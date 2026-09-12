import Converter from '../components/Converter';
import { SupportCard } from '../components/SupportCard';
import { LockClosedIcon } from '@heroicons/react/24/outline';

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

export default function HomePage() {
  return (
    <>
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
            <Converter />
            {/* SEO_CONTENT */}
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

          {/* SEO_FAQ */}
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

          <SupportCard />

          <footer className="mt-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 sm:flex-row">
            <span className="flex items-center gap-1.5">
              <LockClosedIcon className="h-4 w-4 shrink-0" />
              100% free · Private by design — images never leave your device
            </span>
            <span className="hidden text-slate-600 sm:inline">·</span>
            <span>Safe limits: 50 MB per file · 30 files · 200 MB total</span>
            <span className="hidden text-slate-600 sm:inline">·</span>
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

      <noscript>
        <div
          style={{
            maxWidth: '42rem',
            margin: '1.5rem auto',
            padding: '0 1rem',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
            color: '#334155',
          }}
        >
          <h2 style={{ fontSize: 22, lineHeight: 1.2, margin: 0 }}>
            WebP Neo — Free Image to WebP Converter
          </h2>
          <ul style={{ fontSize: 14, lineHeight: 1.8, marginTop: 12 }}>
            <li>PNG, JPG, BMP, GIF, AVIF and TIFF to WebP</li>
            <li>Batch conversion with adjustable quality</li>
            <li>Download results individually or as a ZIP archive</li>
          </ul>
          <p style={{ fontSize: 13, marginTop: 12 }}>
            Please enable JavaScript to use the converter, or visit the project
            on{' '}
            <a
              href="https://github.com/modeusweb/webp-neo"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </noscript>
    </>
  );
}