# WebP Neo

**Free, private image converter — right in your browser.**

Convert PNG, JPG, BMP, GIF, AVIF and TIFF images to WebP without uploading anything. Everything runs locally on your device — your files never leave your computer.

![WebP Neo](https://img.shields.io/badge/WebP-Neo-8b5cf6?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-green?style=flat-square) ![Free](https://img.shields.io/badge/price-free-10a34f?style=flat-square)

---

## Features

- **100% free** — no fees, no sign-up, no usage limits
- **Private by design** — all processing happens locally in your browser; images are never uploaded to any server
- **Batch conversion** — convert multiple files at once with up to 3 parallel workers
- **Wide format support** — PNG, JPG, BMP, GIF, AVIF, TIFF → WebP
- **Adjustable quality** — slider from 30% (smaller files) to 100% (best quality)
- **Resize option** — limit the long side of images (Original / 1024 / 2048 / 4096 / 8192 px)
- **Real-time progress** — per-file and overall progress with compression ratio
- **Download individually or as ZIP** — grab single files or the whole batch in one archive
- **Smart limits** — 50 MB per file, 30 files, 200 MB total for safe browser processing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 7 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Icons | Heroicons |
| WebP encoding | Native `canvas.toBlob` + `@stacksjs/ts-webp` fallback |
| ZIP archives | `@zip.js/zip.js` |
| TIFF decoding | `utif2` (lazy-loaded) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/modeusweb/webp-neo.git
cd webp-neo

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Usage

1. **Add images** — drag & drop files or click to browse your computer
2. **Adjust settings** — choose WebP quality and optional max dimensions
3. **Convert** — hit the Convert button and watch the progress
4. **Download** — save files individually or as a ZIP archive

---

## Safe Limits

To ensure smooth processing in the browser, the following limits apply:

| Limit | Value |
|---|---|
| Max file size | 50 MB |
| Max files in queue | 30 |
| Max total batch size | 200 MB |

These are safety limits, not usage caps — you can convert as many batches as you want.

---

## Support the Project

WebP Neo is completely free to use. If you find it helpful and would like to support its development, you can send a donation to the following address:

**USDT (TRC-20):** `TQZxZ2Ygh6RvkZDi5qswq8uF9KbDbDw9bo`

Any support is greatly appreciated and helps keep the project running — thank you!

---

## Demo

Live demo is available at: **https://webp-neo.vercel.app/**

---

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Use the [GitHub Issues](https://github.com/modeusweb/webp-neo/issues) page
- Describe the bug or feature request clearly
- Include steps to reproduce, if applicable
- Mention your browser and OS version

### Submitting Changes

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Test locally (`npm run dev` and `npm run build`)
5. Commit with a clear message
6. Push to your fork and open a Pull Request

### Development Guidelines

- Follow the existing code style (TypeScript, Tailwind CSS)
- Keep components small and focused
- Test in multiple browsers if possible
- Ensure all processing stays client-side (privacy first)

---

## License

MIT
