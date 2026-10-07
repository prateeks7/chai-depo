import type { FlavourId } from '../content/flavours';
import { images, type ImageKey } from '../content/images';
import { Picture } from './Picture';
import s from './ChaiCup.module.css';

const tinted = (id: FlavourId) => `cup-branded-${id}` as ImageKey;

interface ChaiCupProps {
  className?: string;
  title?: string;
  /** The branded cup's paper in this flavour's colour. Without it, the tea-garden cup. */
  flavour?: FlavourId;
}

/**
 * A takeaway cup, still (scripts/hero-cup.mjs): the tea-garden cup, or with a flavour, the
 * branded cup with its paper recoloured to that flavour and its roundel — the dark disc,
 * the gold ring, "Chai Depot" — kept exactly as photographed. The desktop flavour scene
 * uses SpinCup instead, which turns.
 */
export function ChaiCup({ className, title, flavour }: ChaiCupProps) {
  const name: ImageKey = flavour ? tinted(flavour) : 'cup-garden';
  const { ratio } = images[name];
  return (
    <div
      className={[s.cup, className].filter(Boolean).join(' ')}
      style={{ ['--ratio' as string]: ratio }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <Picture name={name} alt="" sizes="280px" imgClassName={s.art} />
    </div>
  );
}
