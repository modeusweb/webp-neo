import { decodeFileToCanvas } from './readImage';
import { encodeWebp } from './webp';
import type { ConvertResult } from '../types';

export interface ConvertImageOptions {
  quality: number; // 0..100
  maxDimension: number; // 0 = no limit
  onProgress?: (fraction: number) => void;
}

/**
 * Full conversion pipeline for a single file: decode → encode to WebP.
 * onProgress is called with a fraction in the 0..1 range.
 */
export async function convertImage(
  file: File,
  options: ConvertImageOptions,
): Promise<ConvertResult> {
  const startedAt = performance.now();
  const report = options.onProgress ?? (() => {});

  report(0.02);

  const { canvas, width, height } = await decodeFileToCanvas(
    file,
    options.maxDimension,
    (fraction) => report(0.02 + fraction * 0.6),
  );

  report(0.66);

  const blob = await encodeWebp(canvas, options.quality);
  report(0.95);

  // Release the memory of the large canvas
  canvas.width = 1;
  canvas.height = 1;

  const url = URL.createObjectURL(blob);
  report(1);

  return {
    blob,
    url,
    size: blob.size,
    width,
    height,
    durationMs: Math.round(performance.now() - startedAt),
  };
}