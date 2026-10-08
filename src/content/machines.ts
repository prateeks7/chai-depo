import type { ImageKey } from './images';

export type MachineId = 'compact' | 'versatile' | 'multi' | 'high';

export interface Machine {
  id: MachineId;
  name: string;
  image: ImageKey;
  alt: string;
  /** What the machine can do, listed under the spec. */
  controls: string[];
  /** Canisters and drinks, as the client words it. */
  canisters: string;
  selections: string;
  /** Beverage selections, shown huge behind the machine. */
  count: number;
  /** True when `count` is a ceiling ("up to 6") rather than an exact number. */
  upTo?: boolean;
  /**
   * The selection panel, for the loupe: centre (x, y) as fractions of the image, and
   * how much of the machine's width the loupe should take in.
   */
  panel: { x: number; y: number; size: number };
  suits: string;
  /** Relative display height in the lineup (photos are not to a shared scale). */
  scale: number;
  /** Colour field the machine stands on in the lineup. */
  plinth: string;
  verified: boolean;
}

// Four machines, by canister count. The photos are still the old three-machine set:
// image assignments are placeholders until the 2, 3, 4 and 6 canister photos arrive.
export const MACHINES: Machine[] = [
  {
    id: 'compact',
    name: 'Compact',
    image: 'machine-compact',
    alt: 'Compact Chai Depot hot beverage vending machine',
    canisters: '2 canisters',
    selections: '2 beverages',
    count: 2,
    panel: { x: 0.2, y: 0.15, size: 0.2 },
    controls: ['2 beverage options', 'Easy push-button operation', 'Built-in hot water', 'Automatic rinse function', 'Compact footprint'],
    suits: 'A simple, space-saving option for smaller offices, reception areas, clinics and businesses.',
    scale: 0.94,
    plinth: '#b4823f',
    verified: false,
  },
  {
    id: 'versatile',
    name: 'Versatile',
    image: 'machine-multi',
    alt: 'Versatile Chai Depot hot beverage vending machine with three canisters',
    canisters: '3 canisters',
    selections: '3 beverages',
    count: 3,
    panel: { x: 0.16, y: 0.45, size: 0.2 },
    controls: ['3 beverage options', 'Easy push-button operation', 'Built-in hot water', 'Automatic rinse function', 'Compact and easy to maintain'],
    suits: 'The right balance of variety and simplicity for offices, cafés, shops and customer-facing spaces.',
    scale: 0.96,
    plinth: '#b07a46',
    verified: false,
  },
  {
    id: 'multi',
    name: 'Multi-Selection',
    image: 'machine-multi',
    alt: 'Multi-selection Chai Depot hot beverage vending machine with four canisters',
    canisters: '4 canisters',
    selections: 'Up to 6 beverages',
    count: 6,
    upTo: true,
    panel: { x: 0.16, y: 0.45, size: 0.2 },
    controls: [
      'Up to 6 beverage options',
      'Multiple drink selections from 4 canisters',
      'Easy push-button operation',
      'Built-in hot water',
      'Automatic rinse function',
    ],
    suits: 'More variety without taking up too much space. Ideal for busy offices, restaurants, hotels and break rooms.',
    scale: 0.98,
    plinth: '#a9714a',
    verified: false,
  },
  {
    id: 'high',
    name: 'High-Capacity',
    image: 'machine-high',
    alt: 'High-capacity Chai Depot hot beverage vending machine with six canisters',
    canisters: '6 canisters',
    selections: 'Up to 11 beverages',
    count: 11,
    upTo: true,
    panel: { x: 0.24, y: 0.26, size: 0.22 },
    controls: [
      'Up to 11 beverage options',
      'Multiple drink selections from 6 canisters',
      'Easy push-button operation',
      'Built-in hot water',
      'Automatic rinse function',
    ],
    suits: 'Our most versatile machine, built for high-traffic locations that want a wide selection of hot beverages.',
    scale: 0.92,
    plinth: '#a06a42',
    verified: false,
  },
];

/** Where a cup stands on the drip tray in machine-hero, as fractions of the image:
 *  x and y are the middle of the cup's base, h its height. */
export const CUP_ON_TRAY = { x: 0.3, y: 0.87, h: 0.15 };

/** How it works: regions of machine-compact-studio (cx, cy, size as fractions of the image). */
export const STEPS = [
  {
    id: 'load',
    title: 'Load the premix',
    body: 'Each flavour comes in a 2 lb vending pack. The premix goes into a canister, and switching flavours means switching packs.',
    region: { cx: 0.5, cy: 0.5, size: 1 },
  },
  {
    id: 'choose',
    title: 'Choose your cup',
    body: 'Press a beverage for a full cup, or choose a half or custom serving. The display confirms the choice.',
    region: { cx: 0.255, cy: 0.18, size: 0.22 },
  },
  {
    id: 'pour',
    title: 'It pours',
    body: 'Premix and hot water meet and pour straight into the cup on the drip tray. HOT WATER dispenses on its own when you need it.',
    region: { cx: 0.3, cy: 0.76, size: 0.4 },
  },
  {
    id: 'rinse',
    title: 'Rinse, lock, done',
    body: 'The automatic rinse keeps things clean between runs, and the cabinet locks with a key.',
    region: { cx: 0.54, cy: 0.42, size: 0.26 },
  },
] as const;
