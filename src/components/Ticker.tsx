import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { scrollVelocity } from '../lib/scroll';
import s from './Ticker.module.css';

/**
 * Endless band of flavour names. It always drifts, and scrolling pushes it along:
 * faster with the scroll, and it reverses when you scroll back up.
 */
export function Ticker({ items, className }: { items: string[]; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const el = track.current;
      if (!el) return;

      let x = 0;
      let half = el.scrollWidth / 2;
      const measure = () => {
        half = el.scrollWidth / 2;
      };
      window.addEventListener('resize', measure);

      const BASE = 34; // px per second at rest
      const tick = (_t: number, delta: number) => {
        const v = scrollVelocity();
        const speed = BASE + v * 0.22; // sign follows scroll direction
        x -= (speed * delta) / 1000;
        if (half > 0) {
          if (-x >= half) x += half;
          else if (x > 0) x -= half;
        }
        gsap.set(el, { x });
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener('resize', measure);
      };
    },
    { scope: root },
  );

  const row = (
    <>
      {items.map((item) => (
        <span key={item} className={s.item}>
          {item}
        </span>
      ))}
    </>
  );

  return (
    <div ref={root} className={[s.ticker, className].filter(Boolean).join(' ')} aria-hidden="true">
      <div ref={track} className={s.track}>
        {row}
        {row}
      </div>
    </div>
  );
}
