import { useEffect, useState } from 'react';
import { nav, site } from '../content/site';
import { onAnchorClick } from '../lib/scrollTargets';
import { ButtonLink } from './Button';
import { Picture } from './Picture';
import s from './SiteHeader.module.css';

export function SiteHeader() {
  const [onLight, setOnLight] = useState(false);

  // Cream sections mark themselves data-tone="light"; the bar inverts while one is
  // passing behind it.
  useEffect(() => {
    const header = Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68);
    const crossing = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? crossing.add(e.target) : crossing.delete(e.target));
        setOnLight(crossing.size > 0);
      },
      { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - header)}px 0px` },
    );
    document.querySelectorAll('[data-tone="light"]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header className={s.header} data-light={onLight}>
      <div className={s.inner}>
        <a className={s.logo} href="#top" onClick={onAnchorClick} aria-label={`${site.brand}, back to top`}>
          <Picture name="logo" alt="" sizes="52px" priority />
        </a>
        <nav className={s.nav} aria-label="Main">
          <ul>
            {nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={onAnchorClick}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink href="#demo" onClick={onAnchorClick} className={s.cta} arrow={false}>
          Book a demo
        </ButtonLink>
      </div>
    </header>
  );
}
