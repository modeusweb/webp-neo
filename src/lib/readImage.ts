import { extOf } from './format';

export interface DecodedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}


/**
 * Browsers cannot decode TIFF natively, so a pure-JS decoder (UTIF2) is used.
 * The module is imported lazily — it is only loaded when a TIFF file shows up,
 * keeping the main bundle small. Multi-page TIFFs: the first page is used.
 */
async function decodeTiffToCanvas(file: File): Promise<HTMLCanvasElement> {
  const { default: UTIF } = await import('utif2');
  const buffer = await file.arrayBuffer();

  const pages = UTIF.decode(buffer);
  if (!pages.length) throw new Error('No image found in the TIFF file.');
  const page = pages[0]; // multi-page TIFFs: first page is used
  UTIF.decodeImage(buffer, page); // computes page.width / page.height
  if (!page.width || !page.height) {
    throw new Error('No image found in the TIFF file.');
  }

  const rgba = UTIF.toRGBA8(page); // w * h * 4, RGBA, 8 bit
  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create a graphics context.');

  ctx.putImageData(
    new ImageData(new Uint8ClampedArray(rgba), page.width, page.height),
    0,
    0,
  );
  return canvas;
}

/**
 * Decodes an image file into a canvas.
 * - PNG/JPG/WEBP/BMP/GIF/AVIF: createImageBitmap with automatic EXIF
 *   orientation (fast and lossless).
 * - TIFF: pure-JS UTIF2 decoder (loaded on demand).
 * - Scales down to maxDimension (longest side) when requested.
 */
export async function decodeFileToCanvas(
  file: File,
  maxDimension: number,
  onProgress?: (fraction: number) => void,
): Promise<DecodedImage> {
  const report = onProgress ?? (() => {});
  report(0.05);

  const ext = extOf(file.name);
  const isTiff = ext === 'tif' || ext === 'tiff';
  const source: ImageBitmap | HTMLCanvasElement = isTiff
    ? await decodeTiffToCanvas(file)
    : await decodeBitmap(file);
  report(0.4);

  const scale =
    maxDimension > 0
      ? Math.min(1, maxDimension / Math.max(source.width, source.height))
      : 1;
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create a graphics context.');

  ctx.drawImage(source, 0, 0, width, height);
  if ('close' in source) source.close(); // ImageBitmap only; canvases are GC'd
  report(0.6);

  return { canvas, width, height };
}

async function decodeBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, {
      imageOrientation: 'from-image',
    } as ImageBitmapOptions);
  } catch {
    // Browser without EXIF orientation support, or another decoder failure
    return await createImageBitmap(file);
  }
}