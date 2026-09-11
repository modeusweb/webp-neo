import { ZipWriter, BlobWriter, BlobReader } from '@zip.js/zip.js';

export interface ZipEntry {
  name: string;
  blob: Blob;
}

export async function buildZipArchive(entries: ZipEntry[]): Promise<Blob> {
  const writer = new ZipWriter(new BlobWriter('application/zip'));
  for (const entry of entries) {
    await writer.add(entry.name, new BlobReader(entry.blob));
  }
  return writer.close();
}