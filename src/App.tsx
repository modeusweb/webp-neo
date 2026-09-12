import { useCallback, useEffect, useRef, useState } from 'react';

import type { ImageItem } from './types';
import {
  clamp,
  compressionRatio,
  formatBytes,
  plural,
  rejectionMessage,
  sanitizeName,
  stemOf,
  validateFiles,
} from './lib/format';
import type { RejectedFile } from './lib/format';
import { convertImage } from './lib/converter';
import { buildZipArchive } from './lib/zip';
import { DropZone } from './components/DropZone';
import { FileCard } from './components/FileCard';
import { ProgressBar } from './components/ProgressBar';
import { QualitySlider } from './components/QualitySlider';
import { ArrowDownTrayIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { ArchiveBoxIcon, BoltIcon, HeartIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';

const MAX_WORKERS = 3;

const MAX_DIMENSION_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'Original' },
  { value: 1024, label: '1024 px' },
  { value: 2048, label: '2048 px' },
  { value: 4096, label: '4096 px' },
  { value: 8192, label: '8192 px' },
];

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `${Date.now()}-${idCounter}`;
}

/* ---------- persisted settings ---------- */

const SETTINGS_KEY = 'webp-neo:settings';

interface PersistedSettings {
  quality: number;
  maxDimension: number;
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { quality: 82, maxDimension: 0 };
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    const quality = Math.round(Number(parsed.quality));
    const maxDimension = Number(parsed.maxDimension);
    return {
      quality: Number.isFinite(quality) ? clamp(quality, 30, 100) : 82,
      maxDimension: MAX_DIMENSION_OPTIONS.some(
        (option) => option.value === maxDimension,
      )
        ? maxDimension
        : 0,
    };
  } catch {
    return { quality: 82, maxDimension: 0 };
  }
}

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(() => loadSettings().quality);
  const [maxDimension, setMaxDimension] = useState(
    () => loadSettings().maxDimension,
  );
  const [isConverting, setIsConverting] = useState(false);
  const [zip, setZip] = useState<{ url: string; size: number } | null>(null);
  const [rejections, setRejections] = useState<RejectedFile[]>([]);
  const [copied, setCopied] = useState(false);
  const zipNameRef = useRef(`webp-${new Date().toISOString().slice(0, 10)}.zip`);
  const walletAddress = 'TQZxZ2Ygh6RvkZDi5qswq8uF9KbDbDw9bo';

  /* ---------- persistence & unload guard ---------- */

  // Remember quality / max dimension between visits
  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ quality, maxDimension }),
      );
    } catch {
      /* storage unavailable — settings simply won't persist */
    }
  }, [quality, maxDimension]);

  // Warn before leaving while a batch is still running
  useEffect(() => {
    if (!isConverting) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isConverting]);

  /* ---------- list management ---------- */

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — fail silently */
    }
  };

  const discardZip = useCallback(() => {
    if (zip?.url) URL.revokeObjectURL(zip.url);
    setZip(null);
  }, [zip]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const { accepted, rejected } = validateFiles(
        Array.from(files),
        items.length,
        items.reduce((sum, item) => sum + item.originalBytes, 0),
      );

      const incoming: ImageItem[] = accepted.map((file) => ({
        id: nextId(),
        file,
        previewUrl: URL.createObjectURL(file),
        stem: stemOf(file.name),
        mime: file.type || 'application/octet-stream',
        width: null,
        height: null,
        originalBytes: file.size,
        status: 'pending',
        progress: 0,
        result: null,
        error: null,
      }));

      setRejections(rejected);
      if (incoming.length === 0) return;
      setItems((prev) => [...prev, ...incoming]);
      discardZip();
    },
    [items, discardZip],
  );

  const patchItem = useCallback((id: string, patch: Partial<ImageItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target) return;
      URL.revokeObjectURL(target.previewUrl);
      if (target.result?.url) URL.revokeObjectURL(target.result.url);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [items],
  );

  const clearAll = useCallback(() => {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    }
    setItems([]);
    discardZip();
  }, [items, discardZip]);

  const downloadSingle = useCallback((item: ImageItem) => {
    if (!item.result) return;
    const link = document.createElement('a');
    link.href = item.result.url;
    link.download = `${sanitizeName(item.stem)}.webp`;
    document.body.append(link);
    link.click();
    link.remove();
  }, []);

  /* ---------- conversion ---------- */

  const convertAll = useCallback(async () => {
    if (isConverting || items.length === 0) return;

    for (const item of items) {
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    }
    if (zip?.url) URL.revokeObjectURL(zip.url);
    setZip(null);

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'pending',
        progress: 0,
        result: null,
        error: null,
      })),
    );
    setIsConverting(true);

    const total = items.length;
    const queue = [...items];
    const zipEntries: Array<{ name: string; blob: Blob }> = [];
    const usedZipNames = new Set<string>();
    const activeQuality = quality;
    const activeMaxDimension = maxDimension;

    const runOne = async (item: ImageItem) => {
      patchItem(item.id, { status: 'converting', progress: 2 });
      try {
        const result = await convertImage(item.file, {
          quality: activeQuality,
          maxDimension: activeMaxDimension,
          onProgress: (fraction) =>
            patchItem(item.id, {
              progress: clamp(2 + fraction * 97, 2, 99.5),
            }),
        });
        patchItem(item.id, {
          status: 'done',
          progress: 100,
          result,
          width: result.width,
          height: result.height,
        });
        const base = `${sanitizeName(item.stem)}.webp`;
        let name = base;
        let copy = 1;
        while (usedZipNames.has(name)) {
          name = `${sanitizeName(item.stem)} (${copy}).webp`;
          copy += 1;
        }
        usedZipNames.add(name);
        zipEntries.push({ name, blob: result.blob });
      } catch (error) {
        patchItem(item.id, {
          status: 'error',
          progress: 100,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to convert the file.',
        });
      }
    };

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) return;
        await runOne(item);
      }
    };

    const workerCount = Math.max(1, Math.min(MAX_WORKERS, total));
    const pool: Promise<void>[] = [];
    for (let i = 0; i < workerCount; i += 1) pool.push(worker());
    await Promise.all(pool);

    if (zipEntries.length > 0) {
      try {
        const blob = await buildZipArchive(zipEntries);
        const url = URL.createObjectURL(blob);
        zipNameRef.current = `webp-${new Date().toISOString().slice(0, 10)}.zip`;
        setZip({ url, size: blob.size });
      } catch {
        setZip(null);
      }
    }
    setIsConverting(false);
  }, [isConverting, items, quality, maxDimension, zip, patchItem]);

  /* ---------- derived values ---------- */

  const totalCount = items.length;
  const doneCount = items.filter((item) => item.status === 'done').length;
  const failedCount = items.filter((item) => item.status === 'error').length;
  const finishedCount = doneCount + failedCount;
  const allDone =
    totalCount > 0 && finishedCount === totalCount && !isConverting;

  const overallProgress =
    totalCount > 0
      ? items.reduce((sum, item) => sum + item.progress, 0) / totalCount
      : 0;

  const totalIn = items.reduce((sum, item) => sum + item.originalBytes, 0);
  const totalOut = items.reduce(
    (sum, item) => sum + (item.result?.size ?? 0),
    0,
  );

  const doneItems = items.filter((item) => item.status === 'done');
  const savedBytes =
    doneItems.reduce((sum, item) => sum + item.originalBytes, 0) -
    doneItems.reduce((sum, item) => sum + (item.result?.size ?? 0), 0);
  const savingPercent = compressionRatio(
    doneItems.reduce((sum, item) => sum + item.originalBytes, 0),
    doneItems.reduce((sum, item) => sum + (item.result?.size ?? 0), 0),
  );

  /* ---------- markup ---------- */

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-8 sm:px-6">
        <header className="pt-10 pb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 text-xl font-black text-white shadow-lg shadow-fuchsia-500/20">
            W
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            WebP Neo — Free Image to{' '}
            <span className="block bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              WebP Converter
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Completely free converter — turn PNG, JPG, BMP, GIF, AVIF and
            TIFF images into WebP. 100% private — everything runs locally,
            your files never leave your computer.
          </p>
        </header>

  <main className="flex w-full flex-1 flex-col gap-7">
          <DropZone onFiles={addFiles} disabled={isConverting} />

          {rejections.length > 0 && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-300">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">
                    {rejections.length}{' '}
                    {plural(rejections.length, 'file was', 'files were')}{' '}
                    skipped
                  </p>
                  <ul className="mt-0.5 space-y-0.5 text-xs text-amber-200/80">
                    {Object.entries(
                      rejections.reduce<Record<string, string[]>>(
                        (groups, { name, reason }) => {
                          (groups[reason] ??= []).push(name);
                          return groups;
                        },
                        {},
                      ),
                    ).map(([reason, names]) => {
                      const shown = names.slice(0, 3).join(', ');
                      const rest = names.length - 3;
                      return (
                        <li key={reason}>
                          {names.length}{' '}
                          {plural(names.length, 'file', 'files')}{' '}
                          {rejectionMessage(reason as RejectedFile['reason'])}
                          {rest > 0 ? ` and ${rest} more` : ''} — {shown}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setRejections([])}
                className="cursor-pointer rounded-md p-1 transition-colors hover:bg-amber-500/15"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {totalCount > 0 && (
            <>
              {/* Settings & actions panel */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-slate-900/40 backdrop-blur-md">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <QualitySlider
                      value={quality}
                      onChange={(value) => {
                        setQuality(value);
                        discardZip();
                      }}
                      disabled={isConverting}
                    />
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="max-dimension"
                        className="cursor-pointer text-sm font-medium text-slate-300"
                      >
                        Max dimension
                      </label>
                      <select
                        id="max-dimension"
                        value={maxDimension}
                        disabled={isConverting}
                        onChange={(event) => {
                          setMaxDimension(Number(event.target.value));
                          discardZip();
                        }}
                        className="cursor-pointer rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200 focus:border-violet-400 focus:outline-none disabled:cursor-not-allowed"
                      >
                        {MAX_DIMENSION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-500">
                        longer side in pixels
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 sm:items-center">
                    <button
                      type="button"
                      onClick={() => void convertAll()}
                      disabled={isConverting || totalCount === 0}
                      className={[
                        'flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all active:scale-[0.98]',
                        isConverting
                          ? 'cursor-wait bg-white/[0.08] text-slate-300'
                          : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 hover:brightness-110',
                      ].join(' ')}
                    >
                      <BoltIcon className="h-5 w-5" />
                      {isConverting
                        ? `Converting… ${finishedCount}/${totalCount}`
                        : doneCount > 0
                          ? 'Convert again'
                          : `Convert ${totalCount} ${plural(totalCount, 'file')}`}
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      disabled={isConverting}
                      className="cursor-pointer px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear list
                    </button>
                  </div>
                </div>
              </section>

  {/* Overall progress */}
              {isConverting && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-slate-900/40 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-400" />
                      Processing files…
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-300">
                      {finishedCount} of {totalCount}
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBar
                      value={overallProgress}
                      label="Overall progress"
                      hint={`${Math.round(overallProgress)}%`}
                    />
                  </div>
                </section>
              )}

              {/* Success + ZIP download */}
              {allDone && doneCount > 0 && (
                <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] p-6 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-base font-bold text-emerald-300">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </span>
                        Done: {doneCount}{' '}
                        {plural(doneCount, 'file')} converted
                      </p>
                      <p className="mt-1.5 text-sm tabular-nums text-slate-400">
                        {formatBytes(totalIn)} → {formatBytes(totalOut)}
                        {savedBytes > 0
                          ? ` · saved ${formatBytes(savedBytes)} (${Math.round(savingPercent)}%)`
                          : ''}
                        {failedCount > 0 ? ` · errors: ${failedCount}` : ''}
                      </p>
                    </div>
                    {zip && (
                      <a
                        href={zip.url}
                        download={zipNameRef.current}
                        className="flex cursor-pointer shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:brightness-110 active:scale-[0.98]"
                      >
                        <ArchiveBoxIcon className="h-5 w-5" />
                        Download archive · {formatBytes(zip.size)}
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* All failed */}
              {allDone && doneCount === 0 && failedCount > 0 && (
                <section className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] p-6 backdrop-blur-md">
                  <p className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                    <XMarkIcon className="h-5 w-5" />
                    Could not convert any of the files. Try a different format
                    or a smaller image.
                  </p>
                </section>
              )}

  {/* File list */}
              <section className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Files
                </h2>
                <span className="text-xs tabular-nums text-slate-500">
                  {totalCount}{' '}
                  {plural(totalCount, 'file')} ·{' '}
                  {formatBytes(totalIn)}
                </span>
              </section>
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <FileCard
                      item={item}
                      disabled={isConverting}
                      onRemove={removeItem}
                      onDownload={downloadSingle}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {totalCount === 0 && (
            <p className="mb-3 text-center text-sm text-slate-500">
              Add images and hit “Convert” — free, private, no sign-up
            </p>
          )}

          {/* ---- SEO content ---- */}
          <section
            aria-labelledby="why-webp"
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-slate-900/40 backdrop-blur-md"
          >
            <h2
              id="why-webp"
              className="text-lg font-bold tracking-tight text-slate-100"
            >
              Why convert images to WebP?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              WebP is a modern image format that keeps websites fast. Photos in
              WebP are typically 25–35% smaller than JPEG or PNG files at the
              same visual quality, and lossless WebP with transparency support
              works as a drop-in upgrade for PNG as well.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
              <li>
                <span className="font-semibold text-slate-100">
                  Smaller files.
                </span>{' '}
                Save up to 30% bandwidth without losing quality.
              </li>
              <li>
                <span className="font-semibold text-slate-100">
                  Full browser support.
                </span>{' '}
                Works in Chrome, Edge, Firefox, Safari and more.
              </li>
              <li>
                <span className="font-semibold text-slate-100">
                  One format, many uses.
                </span>{' '}
                Lossy, lossless and transparent images in a single format.
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="how-to-convert"
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-slate-900/40 backdrop-blur-md"
          >
            <h2
              id="how-to-convert"
              className="text-lg font-bold tracking-tight text-slate-100"
            >
              How to convert PNG, JPG, GIF, AVIF or TIFF to WebP
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-400">
              <li>
                <span className="font-semibold text-slate-200">
                  Add your images
                </span>{' '}
                — drag and drop files anywhere on this page, or click to choose
                them from your device.
              </li>
              <li>
                <span className="font-semibold text-slate-200">
                  Adjust quality and size
                </span>{' '}
                — pick compression quality from 30% to 100% and, if needed, cap
                the longer side of the image to keep files small.
              </li>
              <li>
                <span className="font-semibold text-slate-200">
                  Convert and download
                </span>{' '}
                — press Convert; the WebP files are ready in seconds, and you
                can grab them one by one or as a single ZIP archive.
              </li>
            </ol>
          </section>

          <section
            aria-labelledby="faq"
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-slate-900/40 backdrop-blur-md"
          >
            <h2
              id="faq"
              className="text-lg font-bold tracking-tight text-slate-100"
            >
              Frequently asked questions
            </h2>
            <div className="mt-2">
              <details className="group border-b border-white/10 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-200 transition-colors hover:text-violet-300 [&::-webkit-details-marker]:hidden">
                  <span>Is WebP Neo really free?</span>
                  <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 pr-8 text-sm leading-relaxed text-slate-400">
                  Yes — 100% free, with no sign-up, no watermark and no usage
                  limits. All processing happens in your browser.
                </p>
              </details>
              <details className="group border-b border-white/10 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-200 transition-colors hover:text-violet-300 [&::-webkit-details-marker]:hidden">
                  <span>Is converting with WebP Neo private?</span>
                  <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 pr-8 text-sm leading-relaxed text-slate-400">
                  Absolutely. Images are processed locally on your device and
                  are never uploaded — your files never leave your computer.
                </p>
              </details>
              <details className="group border-b border-white/10 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-200 transition-colors hover:text-violet-300 [&::-webkit-details-marker]:hidden">
                  <span>Which formats can be converted?</span>
                  <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 pr-8 text-sm leading-relaxed text-slate-400">
                  PNG, JPG, BMP, GIF, AVIF and TIFF — all of them convert to
                  WebP.
                </p>
              </details>
              <details className="group border-b border-white/10 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-200 transition-colors hover:text-violet-300 [&::-webkit-details-marker]:hidden">
                  <span>Can I convert multiple files at once?</span>
                  <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 pr-8 text-sm leading-relaxed text-slate-400">
                  Yes — up to 30 files per batch, 50 MB per file and 200 MB
                  total, with a single-click ZIP download afterwards.
                </p>
              </details>
              <details className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-200 transition-colors hover:text-violet-300 [&::-webkit-details-marker]:hidden">
                  <span>Why use WebP instead of PNG or JPG?</span>
                  <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 pr-8 text-sm leading-relaxed text-slate-400">
                  WebP images are typically 25–35% smaller than PNG or JPG at
                  the same visual quality, so pages load faster and bandwidth
                  costs drop.
                </p>
              </details>
            </div>
          </section>
        </main>

        {/* Support the project */}
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.07] to-fuchsia-500/[0.04] p-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <HeartIcon className="h-5 w-5 text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-200">
              Support WebP Neo
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            This project is completely free. If you find it useful, any support
            helps keep it running — thank you!
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-rose-300/70">
            USDT (TRC-20)
          </p>
          <button
            type="button"
            onClick={copyAddress}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 font-mono text-[11px] text-slate-300 transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 sm:text-xs"
          >
            <span className="truncate">{walletAddress}</span>
            <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0" />
            {copied ? (
              <span className="shrink-0 text-emerald-400">Copied!</span>
            ) : (
              <span className="shrink-0 text-slate-500">Copy</span>
            )}
          </button>
        </div>

        <footer className="flex flex-col items-center justify-center gap-2 mt-6 text-xs text-slate-500 sm:flex-row">
          <span className="flex items-center gap-1.5">
            <LockClosedIcon className="h-4 w-4 shrink-0" />
            100% free · Private by design — images never leave your device
          </span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span>Safe limits: 50 MB per file · 30 files · 200 MB total</span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <a
            href="https://github.com/modeusweb/webp-neo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 transition-colors hover:text-violet-400"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -top-40 -left-24 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-3xl" />
    </div>
  );
}