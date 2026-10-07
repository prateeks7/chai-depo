import type { CSSProperties, ReactNode, Ref } from 'react';
import { images, type ImageKey } from '../content/images';
import { Picture } from './Picture';
import s from './ArchMachine.module.css';

interface ArchMachineProps {
  image: ImageKey;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgRef?: Ref<HTMLImageElement>;
  /** 'multiply' (default) for a white-background studio photo; 'none' for art that
   *  already carries real transparency (a keyed sketch, a cutout). */
  blend?: 'multiply' | 'none';
  /** 'padded' (default) for studio photos, which carry extra margin baked in by
   *  build-images.mjs. 'tight' for art trimmed flush to its edges (a cutout). */
  fit?: 'padded' | 'tight';
  /** Backdrop colour field. */
  tone?: 'amber' | 'cream' | 'brown';
  /** false drops the arch entirely: the art stands on the page with no shape behind it. */
  backdrop?: boolean;
  /** Rendered over the machine, positioned against the photo (e.g. cup, steam). */
  children?: ReactNode;
}

/**
 * A black machine disappears on a dark page, so it stands inside a lit cream arch.
 * The white studio photo is multiplied onto the arch, so its backdrop vanishes.
 * The photo is inset far enough that its corners always fall inside the arch.
 */
export function ArchMachine({
  image,
  alt,
  sizes,
  priority,
  className,
  imgRef,
  blend = 'multiply',
  fit = 'padded',
  tone = 'amber',
  backdrop = true,
  children,
}: ArchMachineProps) {
  const style = { '--img-ratio': images[image].ratio } as CSSProperties;
  return (
    <div
      className={[s.arch, className].filter(Boolean).join(' ')}
      style={style}
      data-blend={blend}
      data-fit={fit}
      data-tone={tone}
      data-backdrop={backdrop}
    >
      {backdrop && <div className={s.backdrop} aria-hidden="true" />}
      <div className={s.machine}>
        <Picture name={image} alt={alt} sizes={sizes} priority={priority} imgClassName={s.img} imgRef={imgRef} />
        {children}
      </div>
    </div>
  );
}
