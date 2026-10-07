import { useRef, type ReactNode } from 'react';

/**
 * Nudges its child toward the pointer when the pointer is close. Mouse only:
 * skipped on touch and under reduced motion.
 */
export function Magnetic({ children, strength = 0.32, radius = 90 }: { children: ReactNode; strength?: number; radius?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  const move = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    const pull = Math.max(0, 1 - dist / (Math.max(r.width, r.height) / 2 + radius));
    el.style.translate = `${dx * strength * pull}px ${dy * strength * pull}px`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.translate = '';
  };

  return (
    <span ref={ref} onPointerMove={move} onPointerLeave={reset} onPointerDown={reset} style={{ display: 'inline-block', transition: 'translate 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}>
      {children}
    </span>
  );
}
