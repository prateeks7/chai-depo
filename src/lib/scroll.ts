import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

let lenis: Lenis | null = null;
let velocity = 0;

/** Current scroll speed in px/s, smoothed. Drives the ticker and the velocity skew. */
export const scrollVelocity = () => velocity;

/** Programmatic scrolling has to go through Lenis while it is running, or it fights it. */
export function scrollToY(top: number, smooth = true) {
  if (lenis && smooth) lenis.scrollTo(top, { duration: 1.1 });
  else window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
}

/**
 * Weighted scrolling: the page keeps moving for a moment after the wheel stops, which is
 * what makes scroll-linked motion feel liquid rather than snappy. Off under reduced motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    lenis = new Lenis({ duration: 1.05, wheelMultiplier: 1, touchMultiplier: 1.5 });
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // One shared velocity reading for every effect that wants it.
    const tracker = ScrollTrigger.create({
      onUpdate: (self) => {
        velocity += (self.getVelocity() - velocity) * 0.25;
      },
    });

    // How far there is to scroll, measured when the page changes rather than every
    // frame: reading scrollHeight forces a full layout, and this runs on every tick.
    const root = document.documentElement;
    let maxScroll = 0;
    const measure = () => {
      maxScroll = root.scrollHeight - window.innerHeight;
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    ScrollTrigger.addEventListener('refresh', measure);

    // Both custom properties sit on the root, so every write restyles the whole page.
    // Writing only when the rounded value actually changes costs nothing while idle and
    // skips most frames while scrolling.
    let lastSkew = '';
    let lastProgress = '';
    const decay = () => {
      velocity *= 0.92;
      // Shared lean: big display type tilts with the scroll and settles when it stops.
      const skew = `${Math.max(-3.4, Math.min(3.4, velocity / 420)).toFixed(1)}deg`;
      if (skew !== lastSkew) {
        lastSkew = skew;
        root.style.setProperty('--vskew', skew);
      }
      const progress = maxScroll > 0 ? (window.scrollY / maxScroll).toFixed(3) : '0';
      if (progress !== lastProgress) {
        lastProgress = progress;
        root.style.setProperty('--scroll-progress', progress);
      }
    };
    gsap.ticker.add(decay);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.remove(decay);
      gsap.ticker.lagSmoothing(500, 33);
      tracker.kill();
      window.removeEventListener('resize', measure);
      ScrollTrigger.removeEventListener('refresh', measure);
      root.style.removeProperty('--vskew');
      lenis?.destroy();
      lenis = null;
      velocity = 0;
    };
  }, []);
}
