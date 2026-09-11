export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

export function plural(
  n: number,
  singular: string,
  pluralForm = `${singular}s`,
): string {
  return n === 1 ? singular : pluralForm;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function compressionRatio(originalBytes: number, resultBytes: number): number {
  if (originalBytes <= 0) return 0;
  return (1 - resultBytes / originalBytes) * 100;
}

export function stemOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/** Lowercase extension of a file name without the dot ('' if absent). */
export function extOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/tiff': 'tiff',
};

/** Best-effort extension for a MIME type ('' if unknown). */
export function mimeToExt(mime: string): string {
  return EXT_BY_MIME[mime] ?? '';
}

export function sanitizeName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]+/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'image';
}

export const SUPPORTED_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'bmp',
  'gif',
  'avif',
  'tif',
  'tiff',
];
export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/avif',
  'image/tiff',
];

export function isSupportedImage(file: File): boolean {
  if (SUPPORTED_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/* ---------- upload limits ---------- */

/** Max size of a single image file. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
/** Max number of images kept in the queue at once. */
export const MAX_FILES = 30;
/** Max combined size of all queued images. */
export const MAX_TOTAL_BYTES = 200 * 1024 * 1024; // 200 MB

export type RejectionReason =
  | 'too-large'
  | 'too-many'
  | 'total-too-large'
  | 'unsupported';

export interface RejectedFile {
  name: string;
  reason: RejectionReason;
}

const REJECTION_MESSAGES: Record<RejectionReason, string> = {
  'too-large': 'exceeds the 50 MB per-file safety limit',
  'too-many': 'queue limit reached (30 files max for safe processing)',
  'total-too-large': 'would exceed the 200 MB total batch limit',
  unsupported: 'unsupported format',
};

export function rejectionMessage(reason: RejectionReason): string {
  return REJECTION_MESSAGES[reason];
}

/**
 * Validates a batch of files against the upload limits.
 * Returns the files that may be added and structured reasons for the rest.
 * `queuedCount` / `queuedBytes` describe what is already in the queue.
 */
export function validateFiles(
  files: readonly File[],
  queuedCount: number,
  queuedBytes: number,
): { accepted: File[]; rejected: RejectedFile[] } {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];

  let count = queuedCount;
  let total = queuedBytes;

  for (const file of files) {
    if (!isSupportedImage(file)) {
      rejected.push({ name: file.name, reason: 'unsupported' });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      rejected.push({ name: file.name, reason: 'too-large' });
      continue;
    }
    if (count >= MAX_FILES) {
      rejected.push({ name: file.name, reason: 'too-many' });
      continue;
    }
    if (total + file.size > MAX_TOTAL_BYTES) {
      rejected.push({ name: file.name, reason: 'total-too-large' });
      continue;
    }
    accepted.push(file);
    count += 1;
    total += file.size;
  }

  return { accepted, rejected };
}