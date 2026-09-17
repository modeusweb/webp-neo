import type { ImageItem, ItemStatus } from '../types';
import {
  compressionRatio,
  extOf,
  formatBytes,
  formatDuration,
  mimeToExt,
} from '../lib/format';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  MagnifyingGlassPlusIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ProgressBar } from './ProgressBar';

interface FileCardProps {
  item: ImageItem;
  disabled: boolean;
  onRemove: (id: string) => void;
  onDownload: (item: ImageItem) => void;
  onOpen: (id: string) => void;
}

const STATUS_STYLES: Record<
  ItemStatus,
  { chip: string; label: string; pulse?: boolean }
> = {
  pending: { chip: 'bg-slate-500/10 text-slate-300', label: 'Queued' },
  converting: {
    chip: 'bg-sky-500/10 text-sky-300',
    label: 'Converting…',
    pulse: true,
  },
  done: { chip: 'bg-emerald-500/10 text-emerald-300', label: 'Done' },
  error: { chip: 'bg-rose-500/10 text-rose-300', label: 'Error' },
};

export function FileCard({
  item,
  disabled,
  onRemove,
  onDownload,
  onOpen,
}: FileCardProps) {
  const tone = STATUS_STYLES[item.status];
  const isTiff = ['tif', 'tiff'].includes(
    extOf(item.file.name).toLowerCase(),
  );
  const dims =
    item.width && item.height ? `${item.width}×${item.height} · ` : '';
  // Unconverted files keep their original extension; only finished
  // results are .webp
  const ext =
    item.status === 'done'
      ? 'webp'
      : extOf(item.file.name) || mimeToExt(item.mime) || 'img';

  // Browsers cannot render TIFF, so until converted the card shows a
  // placeholder icon; after conversion the actual WebP result is shown.
  const previewSrc =
    item.status === 'done' && item.result
      ? item.result.url
      : isTiff
        ? null
        : item.previewUrl;

  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-3 shadow-lg shadow-slate-900/40 transition-colors hover:border-white/20 sm:gap-x-4 sm:gap-y-0 sm:p-4">
      {previewSrc ? (
        <button
          type="button"
          title="View full image"
          aria-label={`View ${item.stem} full size`}
          onClick={() => onOpen(item.id)}
          className="group relative flex h-14 w-14 shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-800 transition-all duration-200 hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-500/25 focus-visible:border-violet-400"
        >
          <img
            src={previewSrc}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-slate-950/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <MagnifyingGlassPlusIcon className="h-5 w-5 text-violet-200" />
          </span>
        </button>
      ) : (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-800">
          <div className="flex h-full w-full items-center justify-center">
            <DocumentTextIcon className="h-7 w-7 text-slate-500" />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-4 w-4 shrink-0 text-slate-500" />
          <p className="truncate font-medium text-slate-100">{item.stem}</p>
          <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-violet-300">
            .{ext}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {dims}
          {formatBytes(item.originalBytes)}
          {item.result
            ? ` → ${formatBytes(item.result.size)} · ${formatDuration(item.result.durationMs)}`
            : ''}
        </p>
        {item.status === 'converting' && (
          <div className="mt-2">
            <ProgressBar value={item.progress} />
          </div>
        )}
        {item.error && (
          <p className="mt-1.5 truncate text-xs text-rose-300">
            <XMarkIcon className="mr-1 inline h-3 w-3" />
            {item.error}
          </p>
        )}
      </div>

      <div className="flex w-full shrink-0 items-center justify-center gap-1.5 border-t border-white/10 pt-2.5 sm:w-auto sm:border-t-0 sm:pt-0">
        {item.status === 'done' && item.result && (
          <>
            <span
              className={[
                'rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums',
                compressionRatio(item.originalBytes, item.result.size) >= 0
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300',
              ].join(' ')}
            >
              {compressionRatio(item.originalBytes, item.result.size) >= 0
                ? `−${Math.round(compressionRatio(item.originalBytes, item.result.size))}%`
                : `+${Math.round(-compressionRatio(item.originalBytes, item.result.size))}%`}
            </span>
            <button
              type="button"
              title="Download .webp"
              aria-label={`Download ${item.stem}.webp`}
              onClick={() => onDownload(item)}
              className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-violet-200"
            >
              <ArrowDownTrayIcon className="h-4.5 w-4.5" />
            </button>
          </>
        )}

        <span
          className={[
            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
            tone.chip,
            tone.pulse ? 'animate-pulse' : '',
          ].join(' ')}
        >
          {tone.label}
        </span>

        {item.status === 'done' && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <CheckIcon className="h-3 w-3" />
          </span>
        )}

        <button
          type="button"
          title="Remove from list"
          aria-label={`Remove ${item.stem}`}
          disabled={disabled}
          onClick={() => onRemove(item.id)}
          className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-rose-400/60 hover:bg-rose-500/15 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <TrashIcon className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}