/**
 * Generates raster favicons from public/favicon.svg:
 *   - public/favicon.ico        (16x16, 32x32, 48x48 — classic multi-size ICO, served from the site root)
 *   - public/favicon-120x120.png (Yandex-recommended large favicon size)
 *
 * Uses Playwright's bundled Chromium to rasterize the SVG (no new dependencies),
 * and hand-rolled ICO (BMP 32bpp) / PNG encoders.
 *
 * Run: npm run icons
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { chromium } from 'playwright';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const svgPath = path.join(root, 'public', 'favicon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

/* ---------- PNG encoder (8-bit RGBA, no filtering) ---------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (None)
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- ICO encoder (BMP 32bpp frames) ---------- */

function encodeBmpEntry(size, rgba) {
  const maskRowBytes = Math.ceil(size / 32) * 4;
  const maskBytes = maskRowBytes * size;
  const header = Buffer.alloc(40); // BITMAPINFOHEADER
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // XOR + AND heights
  header.writeUInt16LE(1, 12); // planes
  header.writeUInt16LE(32, 14); // bpp
  header.writeUInt32LE(0, 16); // BI_RGB
  header.writeUInt32LE(size * size * 4 + maskBytes, 20);

  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const src = ((size - 1 - y) * size + x) * 4; // bottom-up rows
      const dst = (y * size + x) * 4;
      xor[dst] = rgba[src + 2]; // B
      xor[dst + 1] = rgba[src + 1]; // G
      xor[dst + 2] = rgba[src]; // R
      xor[dst + 3] = rgba[src + 3]; // A
    }
  }
  return Buffer.concat([header, xor, Buffer.alloc(maskBytes, 0)]);
}

function encodeIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);
  const dirs = [];
  const datas = [];
  let offset = 6 + 16 * frames.length;
  for (const { size, rgba } of frames) {
    const data = encodeBmpEntry(size, rgba);
    const dir = Buffer.alloc(16);
    dir.writeUInt8(size, 0);
    dir.writeUInt8(size, 1);
    dir.writeUInt8(0, 2); // palette size
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // planes
    dir.writeUInt16LE(32, 6); // bpp
    dir.writeUInt32LE(data.length, 8);
    dir.writeUInt32LE(offset, 12);
    offset += data.length;
    dirs.push(dir);
    datas.push(data);
  }
  return Buffer.concat([header, ...dirs, ...datas]);
}

/* ---------- Rasterization ---------- */

async function main() {
  const sizes = [16, 32, 48, 120];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');

  const rasterize = (size) =>
    page.evaluate(async ({ svg, size }) => {
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      return Array.from(ctx.getImageData(0, 0, size, size).data);
    }, { svg, size });

  try {
    const results = [];
    for (const size of sizes) {
      const data = await rasterize(size);
      results.push({ size, rgba: Buffer.from(data) });
      console.log(`rasterized ${size}x${size}`);
    }

    const ico = encodeIco(
      results
        .filter((r) => [16, 32, 48].includes(r.size))
        .map((r) => ({ size: r.size, rgba: r.rgba })),
    );
    const png120 = encodePng(120, 120, results.find((r) => r.size === 120).rgba);

    fs.writeFileSync(path.join(root, 'public', 'favicon.ico'), ico);
    fs.writeFileSync(path.join(root, 'public', 'favicon-120x120.png'), png120);

    console.log(`favicon.ico: ${ico.length} bytes`);
    console.log(`favicon-120x120.png: ${png120.length} bytes`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
