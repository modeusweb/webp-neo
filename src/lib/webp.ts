import { clamp } from './format';

/**
 * Encodes a canvas into a WebP image.
 *
 * Strategy:
 *  1) Fast native path — canvas.toBlob('image/webp')
 *     (Chrome, Edge, Safari, Opera; quality 0..1).
 *  2) If the browser can't do it (e.g. Firefox) — a pure-TypeScript encoder
 *     @stacksjs/ts-webp (VP8 lossy / VP8L lossless, zero dependencies).
 */
export async function encodeWebp(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  const q = clamp(Math.round(quality), 0, 100);

  if (await nativeWebpEncodeSupported()) {
    const blob = await blobFromNativeCanvas(canvas, q);
    if (blob) return blob;
  }

  return encodeWithJsEncoder(canvas, q);
}

/* --- Native encoder (HTMLCanvasElement.toBlob) --- */

interface SyncToBlob {
  toBlob?: (type: string, quality?: number) => Blob | null;
}

let nativeSupport: boolean | null = null;

async function nativeWebpEncodeSupported(): Promise<boolean> {
  if (nativeSupport !== null) return nativeSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillRect(0, 0, 2, 2);
      const blob = await blobFromNativeCanvas(canvas, 80);
      nativeSupport = blob !== null && blob.type === 'image/webp';
    } else {
      nativeSupport = false;
    }
  } catch {
    nativeSupport = false;
  }
  return nativeSupport;
}

/**
 * Tries encoding through toBlob: first the synchronous API variant
 * (Canvas 2D v2, Chromium 132+), then the classic callback variant.
 */
async function blobFromNativeCanvas(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  const sync = (canvas as unknown as SyncToBlob).toBlob;
  if (sync) {
    try {
      const blob = sync.call(canvas, 'image/webp', quality / 100);
      if (blob && blob.type === 'image/webp') return blob;
    } catch {
      // synchronous variant unsupported — fall back to the callback version
    }
  }
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob && blob.type === 'image/webp' ? blob : null),
      'image/webp',
      quality / 100,
    );
  });
}

/* --- TypeScript encoder (@stacksjs/ts-webp) --- */

async function encodeWithJsEncoder(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  // The pure-TypeScript encoder is loaded lazily — the vast majority of
  // browsers use the native canvas.toBlob path, so we keep this fallback
  // out of the main bundle until it is actually needed.
  const { encode } = await import('@stacksjs/ts-webp');

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get image pixels.');

  // Classic Canvas 2D getImageData — available in every browser that can
  // render a canvas at all; its pixels feed the pure-TS encoder fallback.
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const extended = imageData as unknown as { hasAlpha?: boolean };

  const webp = encode(
    {
      data: imageData.data as unknown as Uint8Array,
      width: imageData.width,
      height: imageData.height,
      hasAlpha: extended.hasAlpha ?? true,
    },
    {
      lossless: false,
      quality,
      effort: 4,
    },
  );

  return new Blob([webp as BlobPart], { type: 'image/webp' });
}