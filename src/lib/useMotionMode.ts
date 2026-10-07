import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const WIDE_AND_TALL = '(min-width: 1024px) and (min-height: 680px)';
const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * full    — pinned scroll scene (desktop, room to breathe, motion allowed)
 * compact — stacked layout with light reveals (phones, tablets, short laptops)
 * reduced — stacked layout, no motion
 */
export type MotionMode = 'full' | 'compact' | 'reduced';

export function useMotionMode(): MotionMode {
  const reduced = useMediaQuery(REDUCED);
  const roomy = useMediaQuery(WIDE_AND_TALL);
  if (reduced) return 'reduced';
  return roomy ? 'full' : 'compact';
}

export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED);
}
