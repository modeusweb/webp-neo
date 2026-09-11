import type { CSSProperties } from 'react';

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const SLIDER_MIN = 30;
export const SLIDER_MAX = 100;

export function QualitySlider({
  value,
  onChange,
  disabled = false,
}: QualitySliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor="quality-slider"
          className="cursor-pointer text-sm font-medium text-slate-300"
        >
          WebP Quality
        </label>
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-sm font-semibold tabular-nums text-violet-300">
          {value}%
        </span>
      </div>
      <input
        id="quality-slider"
        type="range"
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="quality-range mt-4"
        style={
          {
            // Thumb fraction as the browser computes it: (v−min)/(max−min).
            // The CSS converts it to the fill edge position:
            // calc(fraction * (100% - 18px) + 9px)
            '--range-pos': `${(value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)}`,
          } as CSSProperties
        }
      />
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
        <span>Lower — smaller files</span>
        <span>Higher — better quality</span>
      </div>
    </div>
  );
}