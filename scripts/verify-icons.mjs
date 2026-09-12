import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function parseIco(buf) {
  const magic = buf.readUInt16LE(0);
  const type = buf.readUInt16LE(2);
  const count = buf.readUInt16LE(4);
  console.log(`ICO magic reserved=${magic} type=${type} frames=${count}`);
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 16;
    console.log(
      `  frame ${i}: ${buf.readUInt8(o)}x${buf.readUInt8(o + 1)} bpp=${buf.readUInt16LE(o + 6)} bytes=${buf.readUInt32LE(o + 8)} offset=${buf.readUInt32LE(o + 12)}`,
    );
  }
}

function parsePng(buf) {
  const sig = buf.slice(0, 8).toString('hex');
  const ok = sig === '89504e470d0a1a0a';
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  console.log(`PNG sig-ok=${ok} ${w}x${h} bitdepth=${buf[24]} colortype=${buf[25]}`);
}

function parseSvg(file) {
  const content = fs.readFileSync(file, 'utf8');
  const hasWidth = /width="64"/.test(content);
  const hasHeight = /height="64"/.test(content);
  console.log(`SVG has width/height: ${hasWidth && hasHeight}`);
}

parseIco(fs.readFileSync(path.join(root, 'public', 'favicon.ico')));
parsePng(fs.readFileSync(path.join(root, 'public', 'favicon-120x120.png')));
parsePng(fs.readFileSync(path.join(root, 'public', 'apple-touch-icon.png')));
parseSvg(path.join(root, 'public', 'favicon.svg'));
