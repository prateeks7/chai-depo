import type { ImageKey } from './images';

export type MachineId = 'compact' | 'multi' | 'high';

export interface Machine {
  id: MachineId;
  name: string;
  image: ImageKey;
  alt: string;
  /** What the photo shows on the control panel. */
  controls: string[];
  selections: string;
  /** Number of selection buttons, shown huge behind the machine. */
  count: number;
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

// Selection counts are read from the button panels in the photos.
// verified: false until model names, canister counts and dimensions are confirmed.
export const MACHINES: Machine[] = [
  {
    id: 'compact',
    name: 'Compact',
    image: 'machine-compact',
    alt: 'Compact Chai Depot vending machine with a four-button panel and a key in the lock',
    selections: '4 selections',
    count: 4,
    panel: { x: 0.2, y: 0.15, size: 0.2 },
    controls: ['Selections 1 to 4', 'Half cup and rinse', 'Hot water', 'Lockable cabinet'],
    suits: 'Small offices, clinics and front desks',
    scale: 0.94,
    plinth: '#b4823f',
    verified: false,
  },
  {
    id: 'multi',
    name: 'Multi-selection',
    image: 'machine-multi',
    alt: 'Multi-selection Chai Depot vending machine with eight selection buttons and a display',
    selections: '8 selections',
    count: 8,
    panel: { x: 0.16, y: 0.45, size: 0.2 },
    controls: ['Eight selection buttons', 'Display', 'Hot water', 'Lockable cabinet'],
    suits: 'Busy offices, break rooms and hotels',
    scale: 0.98,
    plinth: '#a9714a',
    verified: false,
  },
  {
    id: 'high',
    name: 'High-capacity',
    image: 'machine-high',
    alt: 'High-capacity Chai Depot vending machine with a twelve-button selection panel and a display',
    selections: '12 selections',
    count: 12,
    panel: { x: 0.24, y: 0.26, size: 0.22 },
    controls: ['Twelve selection buttons', 'Display', 'Lockable cabinet'],
    suits: 'Warehouses, campuses and large teams',
    scale: 0.92,
    plinth: '#8e9370',
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
    body: 'Each flavour comes in a 2 lb vending pack. The premix goes into the machine, and switching flavours means switching packs.',
    region: { cx: 0.5, cy: 0.5, size: 1 },
  },
  {
    id: 'choose',
    title: 'Choose your cup',
    body: 'Press 1 to 4 for a selection, or HALF for a smaller cup. The display confirms the choice.',
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
    body: 'RINSE keeps things clean between runs, and the cabinet locks with a key.',
    region: { cx: 0.54, cy: 0.42, size: 0.26 },
  },
] as const;
