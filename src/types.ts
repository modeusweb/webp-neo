export type ItemStatus = 'pending' | 'converting' | 'done' | 'error';

export interface ConvertResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  durationMs: number;
}

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  stem: string;
  mime: string;
  width: number | null;
  height: number | null;
  originalBytes: number;
  status: ItemStatus;
  progress: number; // 0..100
  result: ConvertResult | null;
  error: string | null;
}