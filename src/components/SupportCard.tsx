"use client";

import { useState } from 'react';
import { ClipboardDocumentIcon, HeartIcon } from '@heroicons/react/24/outline';

const WALLET_ADDRESS = 'TQZxZ2Ygh6RvkZDi5qswq8uF9KbDbDw9bo';

export function SupportCard() {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — fail silently */
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.07] to-fuchsia-500/[0.04] p-5 text-center">
      <div className="flex items-center justify-center gap-2">
        <HeartIcon className="h-5 w-5 text-rose-400" />
        <h3 className="text-sm font-semibold text-rose-200">
          Support WebP Neo
        </h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        This project is completely free. If you find it useful, any support
        helps keep it running — thank you!
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-rose-300/70">
        USDT (TRC-20)
      </p>
      <button
        type="button"
        onClick={copyAddress}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 font-mono text-[11px] text-slate-300 transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 sm:text-xs"
      >
        <span className="truncate">{WALLET_ADDRESS}</span>
        <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0" />
        {copied ? (
          <span className="shrink-0 text-emerald-400">Copied!</span>
        ) : (
          <span className="shrink-0 text-slate-500">Copy</span>
        )}
      </button>
    </div>
  );
}