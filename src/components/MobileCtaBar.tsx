import { useEffect, useState } from 'react';
import { site } from '../content/site';
import { onAnchorClick } from '../lib/scrollTargets';
import s from './MobileCtaBar.module.css';

/** Phone-only bar: appears once the hero has scrolled away, hides while the form is on screen. */
export function MobileCtaBar() {
  const [pastHero, setPastHero] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('top');
    const form = document.getElementById('demo');
    const observers: IntersectionObserver[] = [];
    if (hero) {
      const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0));
      io.observe(hero);
      observers.push(io);
    }
    if (form) {
      const io = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { rootMargin: '0px 0px -20% 0px' });
      io.observe(form);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, []);

  const shown = pastHero && !formVisible;

  return (
    <div className={s.bar} data-shown={shown} aria-hidden={!shown}>
      <a className={s.call} href={site.phone.href} tabIndex={shown ? 0 : -1}>
        Call
      </a>
      <a className={s.demo} href="#demo" onClick={onAnchorClick} tabIndex={shown ? 0 : -1}>
        Book a demo
      </a>
    </div>
  );
}
