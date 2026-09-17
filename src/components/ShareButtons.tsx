"use client";

import { useEffect, useState } from 'react';

const PAGE_URL = 'https://webp-neo.vercel.app/';
const SHARE_TEXT =
  'WebP Neo — free, private image to WebP converter. Everything runs in your browser, no uploads.';
const enc = encodeURIComponent;

const LINKS = [
  {
    name: 'Post on X',
    href: `https://twitter.com/intent/tweet?url=${enc(PAGE_URL)}&text=${enc(SHARE_TEXT)}`,
    styles: 'border-slate-700 text-slate-300 hover:bg-slate-800',
  },
  {
    name: 'Share on Facebook',
    href: `https://www.facebook.com/sharer/sharer.php?u=${enc(PAGE_URL)}`,
    styles: 'border-blue-800/70 text-blue-300 hover:bg-blue-700/25',
  },
  {
    name: 'Post to Telegram',
    href: `https://t.me/share/url?url=${enc(PAGE_URL)}&text=${enc(SHARE_TEXT)}`,
    styles: 'border-sky-700/80 text-sky-300 hover:bg-sky-700/25',
  },
  {
    name: 'Share on WhatsApp',
    href: `https://api.whatsapp.com/send?text=${enc(SHARE_TEXT + ' ' + PAGE_URL)}`,
    styles: 'border-emerald-800/70 text-emerald-300 hover:bg-emerald-700/25',
  },
  {
    name: 'Submit to Reddit',
    href: `https://www.reddit.com/submit?url=${enc(PAGE_URL)}&title=${enc('WebP Neo — free image to WebP converter')}`,
    styles: 'border-orange-800/70 text-orange-300 hover:bg-orange-700/25',
  },
  {
    name: 'Share on LinkedIn',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(PAGE_URL)}`,
    styles: 'border-sky-900 text-sky-300 hover:bg-sky-900/50',
  },
];

export function ShareButtons() {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: SHARE_TEXT, url: PAGE_URL });
    } catch {
      /* user closed the share sheet — nothing to do */
    }
  };

  return (
    <section
      aria-labelledby="share-this"
      className="mx-auto mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-md"
    >
      <h2 id="share-this" className="text-sm font-semibold tracking-tight text-slate-200">
        Share WebP Neo — it&apos;s free and private
      </h2>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {canShare && (
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-violet-500/50 px-3.5 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
          >
            Share…
          </button>
        )}
        {LINKS.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${link.styles}`}
          >
            {link.name}
          </a>
        ))}
      </div>
    </section>
  );
}