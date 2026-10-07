import manifest from './imageManifest.json';

export type ImageKey = keyof typeof manifest;

export interface ImageEntry {
  widths: number[];
  width: number;
  height: number;
  ratio: number;
}

export const images = manifest as Record<ImageKey, ImageEntry>;

const base = import.meta.env.BASE_URL;
export const imageUrl = (key: ImageKey, width: number, format: 'avif' | 'webp') =>
  `${base}img/${key}-${width}.${format}`;

/** A fixed-size file outside the width/format pattern above (e.g. a CSS mask source). */
export const staticImageUrl = (file: string) => `${base}img/${file}`;
