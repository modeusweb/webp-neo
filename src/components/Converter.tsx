"use client";
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ImageItem } from '../types';
import {
  clamp,
  compressionRatio,
  extOf,
  formatBytes,
  plural,
  rejectionMessage,
  sanitizeName,
  stemOf,
  validateFiles,
} from '../lib/format';
import type { RejectedFile } from '../lib/format';
import { convertImage } from '../lib/converter';
import { buildZipArchive } from '../lib/zip';
import { ImageLightbox } from './ImageLightbox';
import { DropZone } from './DropZone';
import { FileCard } from './FileCard';
import { ProgressBar } from './ProgressBar';
import { QualitySlider } from './QualitySlider';
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ArchiveBoxIcon, BoltIcon, XMarkIcon } from '@heroicons/react/24/solid';

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

const DEFAULT_SETTINGS: PersistedSettings = { quality: 80, maxDimension: 0 };

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    const quality = Math.round(Number(parsed.quality));
    const maxDimension = Number(parsed.maxDimension);
    return {
      quality: Number.isFinite(quality) ? clamp(quality, 30, 100) : 80,
      maxDimension: MAX_DIMENSION_OPTIONS.some(
        (option) => option.value === maxDimension,
      )
        ? maxDimension
        : 0,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function Converter() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(DEFAULT_SETTINGS.quality);
  const [maxDimension, setMaxDimension] = useState(DEFAULT_SETTINGS.maxDimension);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [zip, setZip] = useState<{ url: string; size: number } | null>(null);
  const [rejections, setRejections] = useState<RejectedFile[]>([]);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const zipNameRef = useRef(`webp-${new Date().toISOString().slice(0, 10)}.zip`);
  const walletAddress = 'TQZxZ2Ygh6RvkZDi5qswq8uF9KbDbDw9bo';

  /* ---------- persistence & unload guard ---------- */

  // Remember quality / max dimension between visits.
  // Skipped until the stored values have been read (see the effect below) —
  // otherwise the default 80% would be written over the stored value on mount.
  useEffect(() => {
    if (!settingsHydrated) return;
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ quality, maxDimension }),
      );
    } catch {
      /* storage unavailable — settings simply won't persist */
    }
  }, [quality, maxDimension, settingsHydrated]);
  // Load persisted quality / max dimension after mount (SSR-safe, avoids hydration mismatch)
  useEffect(() => {
    const settings = loadSettings();
    setQuality(settings.quality);
    setMaxDimension(settings.maxDimension);
    setSettingsHydrated(true);
  }, []);

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

  /* ---------- image lightbox ---------- */

  // Images that can be shown full-size: converted results (WebP), or —
  // for files not converted yet — the original preview. TIFF previews
  // cannot be rendered by browsers, so they stay out of the gallery.
  const lightboxImages = items.flatMap((item) => {
    const isTiff = ['tif', 'tiff'].includes(extOf(item.file.name));
    const src = item.result?.url ?? (isTiff ? null : item.previewUrl);
    return src ? [{ id: item.id, src, stem: item.stem }] : [];
  });

  const openLightbox = useCallback(
    (id: string) => {
      const index = lightboxImages.findIndex((image) => image.id === id);
      if (index === -1) return;
      setLightboxIndex(index);
      setLightboxOpen(true);
    },
    [lightboxImages],
  );

  /* ---------- markup ---------- */

  return (
  <>
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
                className="flex cursor-pointer items-center justify-center rounded-md p-1 transition-colors hover:bg-amber-500/15"
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

                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-center">
                    <button
                      type="button"
                      onClick={() => void convertAll()}
                      disabled={isConverting || totalCount === 0}
                      className={[
                        'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] sm:w-auto',
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
                      className="flex w-full cursor-pointer items-center justify-center px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                        className="flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:brightness-110 active:scale-[0.98]"
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
                      onOpen={openLightbox}
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

          <ImageLightbox
            open={lightboxOpen}
            index={lightboxIndex}
            images={lightboxImages}
            onClose={() => setLightboxOpen(false)}
            onIndexChange={setLightboxIndex}
          />
        </>
  );
}
