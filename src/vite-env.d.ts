/// <reference types="vite/client" />

declare module 'utif2' {
  export interface UtifIfd {
    width: number;
    height: number;
    [tag: string]: unknown;
  }

  const UTIF: {
    decode(buffer: ArrayBuffer): UtifIfd[];
    decodeImage(buffer: ArrayBuffer, ifd: UtifIfd): void;
    toRGBA8(ifd: UtifIfd): Uint8Array;
  };

  export default UTIF;
}
