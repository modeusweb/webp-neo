import { clamp } from '../lib/format';

interface ProgressBarProps {
  value: number; // 0..100
  label?: string;
  hint?: string;
}

export function ProgressBar({ value, label, hint }: ProgressBarProps) {
  const v = clamp(value, 0, 100);
  const rounded = Math.round(v);

  return (
    <div>
      {(label || hint) && (
        <div className="flex items-center justify-between gap-3">
          {label ? (
            <span className="text-xs font-medium text-slate-300">{label}</span>
          ) : (
            <span />
          )}
          {hint ? (
            <span className="text-xs tabular-nums text-slate-400">{hint}</span>
          ) : (
            <span />
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/[0.08]"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-200 ease-out"
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  );
}