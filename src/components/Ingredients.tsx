import type { CSSProperties } from 'react';
import s from './Ingredients.module.css';

// Line-art ingredients in the engraved style of the leaf sprigs on the pack labels.
// Each is drawn in a 100 x 100 box. Photographic layers from AI_TASKS.md can
// replace or sit alongside these later.
export type IngredientKind = 'pod' | 'podOpen' | 'leaf' | 'seeds' | 'clove' | 'cinnamon' | 'ginger' | 'jaggery' | 'saffron';

const SHAPES: Record<IngredientKind, { fill?: string[]; line: string[]; dots?: [number, number, number][] }> = {
  pod: {
    fill: ['M50 6C62 16 68 38 64 62C61 80 55 92 50 95C45 92 39 80 36 62C32 38 38 16 50 6Z'],
    line: ['M50 10C56 30 57 60 51 92', 'M50 10C44 30 42 60 48 92', 'M50 10C60 26 64 52 58 84', 'M50 10C40 26 36 52 42 84', 'M50 6L50 1'],
  },
  podOpen: {
    fill: ['M44 8C32 20 28 46 32 66C35 82 40 92 44 95C48 70 48 30 44 8Z', 'M58 12C70 24 74 48 69 68C66 82 62 90 58 93C54 70 54 32 58 12Z'],
    line: ['M44 14C38 34 36 60 40 84', 'M58 18C64 36 66 60 62 82'],
    dots: [[51, 30, 3.4], [50.5, 41, 3.6], [52, 52, 3.4], [50.5, 63, 3.6], [52, 74, 3.2]],
  },
  leaf: {
    fill: ['M50 4C70 20 76 52 60 80C56 88 52 94 50 97C48 94 44 88 40 80C24 52 30 20 50 4Z'],
    line: ['M50 8L50 96', 'M50 26L61 19', 'M50 26L39 19', 'M50 42L65 33', 'M50 42L35 33', 'M50 58L64 49', 'M50 58L36 49', 'M50 74L58 67', 'M50 74L42 67'],
  },
  seeds: {
    line: [],
    dots: [[30, 40, 4], [44, 30, 3.4], [58, 44, 4.2], [40, 56, 3.6], [66, 62, 3.2], [52, 68, 4], [72, 36, 3]],
  },
  clove: {
    fill: ['M47.5 96C48 76 48.6 58 48.8 44L51.2 44C51.4 58 52 76 52.5 96Z'],
    line: ['M49 44C40 42 34 36 34 29', 'M51 44C60 42 66 36 66 29', 'M50 44C46 38 43 32 44 27', 'M50 44C54 38 57 32 56 27'],
    dots: [[50, 21, 8]],
  },
  cinnamon: {
    fill: ['M14 70L78 22L86 30L22 78Z'],
    line: [
      'M14 70C8 76 16 84 22 78C18 82 12 78 16 73',
      'M78 22C84 17 91 25 86 30C83 32 80 27 83 25',
      'M28 62L62 36',
      'M34 68L68 42',
    ],
  },
  ginger: {
    fill: ['M20 60C18 48 30 44 38 48C40 38 52 34 58 42C64 34 78 36 78 48C88 50 90 64 80 68C74 76 60 74 54 70C46 78 30 78 26 70C20 70 18 64 20 60Z'],
    line: ['M38 50C40 58 38 66 36 72', 'M58 44C58 54 58 62 56 70', 'M76 50C74 56 74 62 76 66'],
  },
  jaggery: {
    fill: ['M24 36L52 24L80 34L54 48Z', 'M24 36L54 48L52 82L22 68Z', 'M54 48L80 34L78 66L52 82Z'],
    line: [],
    dots: [[36, 56, 1.6], [42, 66, 1.4], [32, 62, 1.2], [64, 58, 1.5], [70, 50, 1.3], [62, 68, 1.2], [50, 34, 1.3]],
  },
  saffron: {
    line: ['M30 92C36 68 42 46 58 18', 'M42 94C46 72 52 52 70 28', 'M20 82C28 66 38 54 46 32', 'M58 18L53 12M58 18L63 11', 'M70 28L66 21M70 28L76 22', 'M46 32L41 26M46 32L50 25'],
  },
};

export function Ingredient({ kind }: { kind: IngredientKind }) {
  const shape = SHAPES[kind];
  return (
    <svg viewBox="0 0 100 100" className={s.svg} aria-hidden="true">
      {shape.fill?.map((d, i) => <path key={`f${i}`} d={d} className={s.fill} />)}
      {shape.line.map((d, i) => <path key={`l${i}`} d={d} className={s.line} />)}
      {shape.dots?.map(([cx, cy, r], i) => <circle key={`d${i}`} cx={cx} cy={cy} r={r} className={s.dot} />)}
    </svg>
  );
}

type Slot = [x: number, y: number, size: number, rotation: number];

// Positions as % of the field; size in em (the field sets font-size to scale).
// The centre (cup) and the left copy column are kept clear.
export const SLOTS: Record<'back' | 'mid' | 'front', Slot[]> = {
  back: [
    [38, 9, 5, -20],
    [57, 6, 4.4, 30],
    [83, 9, 5.6, -50],
    [97, 42, 4.8, 15],
    [72, 94, 5, 60],
    [45, 92, 4.2, -35],
  ],
  mid: [
    [63, 16, 8.6, -25],
    [93, 22, 7.6, 40],
    [90, 72, 9.4, -60],
    [62, 88, 8, 20],
    [45, 22, 6.4, 55],
  ],
  front: [
    [97, 5, 17, -30],
    [58, 106, 19, 25],
    [104, 58, 16, 70],
  ],
};

interface FieldProps {
  kinds: IngredientKind[];
  depth: keyof typeof SLOTS;
  /** Offsets rotations so neighbouring flavours don't look identical. */
  seed?: number;
  color: string;
  className?: string;
  /** How many slots to use (sparser flavours use fewer). */
  count?: number;
  dataFlavour?: string;
}

export function IngredientField({ kinds, depth, seed = 0, color, className, count, dataFlavour }: FieldProps) {
  const slots = SLOTS[depth].slice(0, count ?? SLOTS[depth].length);
  return (
    <div
      className={[s.field, s[depth], className].filter(Boolean).join(' ')}
      style={{ '--ing': color } as CSSProperties}
      data-ingredients={dataFlavour}
      data-depth={depth}
      aria-hidden="true"
    >
      {slots.map(([x, y, size, rot], i) => (
        <span
          key={i}
          className={s.item}
          style={
            {
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}em`,
              transform: `translate(-50%, -50%) rotate(${rot + seed * 37 * (i % 2 ? 1 : -1)}deg)`,
              '--dx': `${((i % 3) - 1) * 10}px`,
              '--dy': `${-8 - ((i * 5) % 12)}px`,
              '--dur': `${7 + ((i * 3 + seed) % 6)}s`,
              '--delay': `${-(i * 1.3).toFixed(1)}s`,
            } as CSSProperties
          }
        >
          <Ingredient kind={kinds[(i + seed) % kinds.length]} />
        </span>
      ))}
    </div>
  );
}
