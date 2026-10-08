import type { ImageKey } from './images';
import type { IngredientKind } from '../components/Ingredients';

export type FlavourId = 'masala' | 'jaggery' | 'cardamom' | 'cardamom-nas' | 'karak' | 'coffee';

export interface Flavour {
  id: FlavourId;
  /** Short name, used for the giant word behind the cup and in lists. */
  name: string;
  /** Full name as the client writes it, when it is longer than the word above. */
  title?: string;
  /** Sub-variant within a family, e.g. the no-added-sugar cardamom. */
  variant?: string;
  family?: 'cardamom';
  kicker: string;
  note: string;
  tasting: [string, string, string];
  /** Printed badge on the real pack, shown with a ring callout. */
  badge?: { label: string; at: { x: number; y: number } };
  /** The label artwork. Absent while the client is still preparing it. */
  pack?: ImageKey;
  packAlt: string;
  /**
   * cup:   the cup's print is graded toward this (scripts/hero-cup.mjs bakes the same
   *        colours for the static cups; keep them in step)
   * label: the header colour of the printed label, behind it on the label panel
   */
  palette: { stage: string; accent: string; glow: string; liquid: string; cup: string; label: string; steam: number };
  ingredients: IngredientKind[];
  /** false = wording or claim still to be confirmed by the client. */
  verified: boolean;
  todo?: string;
}

// Client's running order: Masala, Jaggery, Cardamom, Cardamom no sugar, Karak, Indian
// Style Coffee. Every list on the site reads from this array, so the order is set here.
export const FLAVOURS: Flavour[] = [
  {
    id: 'masala',
    name: 'Masala',
    kicker: 'Spiced and aromatic',
    note: 'Authentic Indian-style chai with a rich blend of traditional spices. Smooth, creamy and aromatic at any time of day.',
    tasting: ['Traditional spices', 'Smooth and creamy', 'Aromatic'],
    pack: 'label-masala',
    packAlt: 'Chai Depot Masala instant tea premix label, 2 lb vending pack',
    palette: { stage: '#2a120f', accent: '#c4543e', glow: '#eb9a7c', liquid: '#96593a', cup: '#ad2622', label: '#ad2622', steam: 0.8 },
    ingredients: ['cinnamon', 'clove', 'ginger', 'pod', 'clove', 'cinnamon'],
    verified: true,
  },
  {
    id: 'jaggery',
    name: 'Jaggery',
    title: 'Jaggery Chai',
    kicker: 'Naturally sweetened with jaggery',
    note: 'A rich, aromatic cardamom chai sweetened with traditional jaggery. Smooth, warming, and full of comforting spice.',
    tasting: ['Sweetened with jaggery', 'Aromatic cardamom', 'Smooth, rich flavour'],
    pack: 'label-jaggery',
    packAlt: 'Chai Depot Jaggery instant tea premix label, 2 lb vending pack',
    palette: { stage: '#26180d', accent: '#d08a3c', glow: '#ebb872', liquid: '#a4693c', cup: '#a96830', label: '#a96830', steam: 0.75 },
    ingredients: ['jaggery', 'pod', 'jaggery', 'seeds', 'jaggery', 'pod'],
    verified: true,
    todo: 'The 4x6 label lists no jaggery in its ingredients and shows Sugar 0.00 g.',
  },
  {
    id: 'cardamom',
    name: 'Cardamom',
    family: 'cardamom',
    kicker: 'The everyday classic',
    note: 'Classic Indian cardamom chai. Delicate and aromatic, with balanced sweetness and a rich, creamy body.',
    tasting: ['Delicate cardamom', 'Balanced sweetness', 'Creamy body'],
    pack: 'label-cardamom',
    packAlt: 'Chai Depot Cardamom instant tea premix label, 2 lb vending pack',
    palette: { stage: '#1c2215', accent: '#a9a95c', glow: '#d6d29a', liquid: '#b3875c', cup: '#92a452', label: '#92a452', steam: 0.7 },
    ingredients: ['pod', 'leaf', 'podOpen', 'pod', 'seeds', 'leaf'],
    verified: false,
    todo: 'Source deck swaps the with/without-sugar descriptions; confirm this one.',
  },
  {
    id: 'cardamom-nas',
    name: 'Cardamom',
    variant: 'No added sugar',
    family: 'cardamom',
    kicker: 'Sweeten to taste',
    note: 'The same cardamom chai with no added sugar, so everyone can sweeten their own cup.',
    tasting: ['Delicate cardamom', 'No added sugar', 'Sweeten to taste'],
    badge: { label: 'No added sugar', at: { x: 0.11, y: 0.08 } },
    pack: 'label-cardamom-nas',
    packAlt: 'Chai Depot Cardamom instant tea premix label with a No Added Sugar badge, 2 lb vending pack',
    palette: { stage: '#1e231b', accent: '#b7be8e', glow: '#e6e2c8', liquid: '#bb9068', cup: '#b8c088', label: '#92a452', steam: 0.65 },
    ingredients: ['pod', 'leaf', 'pod'],
    verified: true,
  },
  {
    id: 'karak',
    name: 'Karak',
    kicker: 'Strong and full-bodied',
    note: 'A strong, full-bodied tea with bold flavour and a creamy finish, inspired by Middle Eastern-style karak.',
    tasting: ['Strong tea', 'Bold flavour', 'Creamy finish'],
    pack: 'label-karak',
    packAlt: 'Chai Depot Karak instant tea premix label, 2 lb vending pack',
    palette: { stage: '#120f0b', accent: '#c9933e', glow: '#ecca86', liquid: '#7f4c30', cup: '#c9a228', label: '#c9a228', steam: 1 },
    ingredients: ['leaf', 'saffron', 'pod', 'leaf', 'saffron', 'leaf'],
    verified: false,
    todo: 'Revised artwork has both a plain Karak and a no-added-sugar Karak; the site shows only the plain one.',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    title: 'Indian Style Coffee',
    kicker: 'Rich and milky',
    note: 'Instant coffee premix, rich and milky, poured from the same machine as the chai. Just add hot water.',
    tasting: ['Rich instant coffee', 'Milky and smooth', 'Just add hot water'],
    pack: 'label-coffee',
    packAlt: 'Chai Depot Instant Coffee premix label, 2 lb vending pack',
    palette: { stage: '#1d1009', accent: '#c2703c', glow: '#e6a86a', liquid: '#6b4428', cup: '#a6542b', label: '#a6542b', steam: 0.85 },
    ingredients: ['seeds', 'leaf', 'seeds', 'cinnamon', 'seeds'],
    verified: false,
    todo: 'Copy is read off the March label; tasting notes not yet supplied by the client.',
  },
];

/** Ratio used for a label plate while a flavour has no artwork. */
export const PACK_PLACEHOLDER_RATIO = 0.75;

/**
 * Panels on mobile: consecutive flavours from the same family (the two cardamoms) share
 * one panel with a sweetness switch. Everything else gets a panel of its own.
 */
export const FLAVOUR_GROUPS: Flavour[][] = FLAVOURS.reduce<Flavour[][]>((groups, f) => {
  const last = groups[groups.length - 1];
  if (last && f.family && last[0].family === f.family) last.push(f);
  else groups.push([f]);
  return groups;
}, []);
