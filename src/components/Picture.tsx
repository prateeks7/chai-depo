import type { Ref } from 'react';
import { images, imageUrl, type ImageKey } from '../content/images';

interface PictureProps {
  name: ImageKey;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  imgRef?: Ref<HTMLImageElement>;
}

export function Picture({ name, alt, sizes, priority, className, imgClassName, imgRef }: PictureProps) {
  const { widths, width, height } = images[name];
  const srcSet = (format: 'avif' | 'webp') => widths.map((w) => `${imageUrl(name, w, format)} ${w}w`).join(', ');
  const fallback = widths[Math.min(1, widths.length - 1)];

  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        ref={imgRef}
        className={imgClassName}
        src={imageUrl(name, fallback, 'webp')}
        width={width}
        height={height}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}
