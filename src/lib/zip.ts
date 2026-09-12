export interface ZipEntry {
  name: string;
  blob: Blob;
}

export async function buildZipArchive(entries: ZipEntry[]): Promise<Blob> {
  // Loaded lazily so the ZIP writer stays out of the main bundle until
  // the "Download archive" button is actually used.
  const { ZipWriter, BlobWriter, BlobReader } = await import('@zip.js/zip.js');
  const writer = new ZipWriter(new BlobWriter('application/zip'));
  for (const entry of entries) {
    await writer.add(entry.name, new BlobReader(entry.blob));
  }
  return writer.close();
}