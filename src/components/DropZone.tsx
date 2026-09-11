import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';

import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export const ACCEPT_ATTR =
  'image/png,image/jpeg,image/webp,image/bmp,image/gif,image/avif,image/tiff,.png,.jpg,.jpeg,.webp,.bmp,.gif,.avif,.tif,.tiff';

interface DropZoneProps {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFiles, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (disabled) return;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) onFiles(files);
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    if (input.files && input.files.length > 0) onFiles(input.files);
    input.value = ''; // allow choosing the same file again
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add images: drag files here or click to choose"
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200',
        isDragging
          ? 'border-fuchsia-400 bg-fuchsia-500/[0.12] shadow-[0_0_0_4px_rgba(217,70,239,0.25)]'
          : 'border-white/15 bg-white/[0.03] hover:border-violet-400/60 hover:bg-violet-500/[0.06]',
        disabled ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={handleChange}
      />

      <div
        className={[
          'flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 text-violet-200 shadow-lg shadow-fuchsia-500/10 transition-transform duration-200',
          isDragging ? 'scale-110' : 'group-hover:scale-105',
        ].join(' ')}
      >
        <ArrowUpTrayIcon className="h-8 w-8" />
      </div>

      <div className="text-base font-semibold text-slate-100">
        {isDragging ? 'Drop to add files' : 'Drag & drop your images here'}
      </div>
      <div className="text-sm text-slate-400">
        or click to browse — free, works offline, no upload needed
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {['PNG', 'JPG', 'JPEG', 'WEBP', 'BMP', 'GIF', 'AVIF', 'TIFF'].map((ext) => (
          <span
            key={ext}
            className="rounded-md bg-white/[0.07] px-2 py-1 font-mono text-[11px] font-medium text-slate-300"
          >
            .{ext.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}