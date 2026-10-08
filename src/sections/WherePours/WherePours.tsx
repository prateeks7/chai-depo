import type { CSSProperties } from 'react';
import { Eyebrow } from '../../components/Eyebrow';
import { MaskedText } from '../../components/Reveal';
import { USE_CASES } from '../../content/useCases';
import { useDemoIntent } from '../../lib/DemoIntentContext';
import { useInView } from '../../lib/useInView';
import s from './WherePours.module.css';

/** A typographic index of venues. Picking one pre-fills the demo form. */
export function WherePours() {
  const { requestDemo } = useDemoIntent();
  const [listRef, listIn] = useInView<HTMLUListElement>();

  return (
    <section className={s.section} aria-labelledby="where-title">
      <div className={s.inner}>
        <header className={s.head}>
          <Eyebrow>Where it pours</Eyebrow>
          <h2 id="where-title" className={s.title}>
            <MaskedText text="Wherever people" />
            <em>
              <MaskedText text="need a proper cup." start={2} />
            </em>
          </h2>
          <p className={s.lead}>
            From the office break room to a busy hotel lobby, our machines make quality hot beverages simple, consistent and available on demand.
          </p>
        </header>
        <ul ref={listRef} className={s.list} data-in={listIn}>
          {USE_CASES.map((u, i) => (
            <li key={u.id} style={{ '--i': i } as CSSProperties}>
              <button type="button" className={s.row} onClick={() => requestDemo({ useCase: u.id })} aria-label={`Book a demo for ${u.name.toLowerCase()}`} aria-describedby={`use-${u.id}`}>
                <span className={s.index}>{String(i + 1).padStart(2, '0')}</span>
                <span className={s.name}>{u.name}</span>
                <span className={s.line} id={`use-${u.id}`}>
                  <strong>{u.headline}</strong>
                  {u.line}
                </span>
                <span className={s.action} aria-hidden="true">
                  Book a demo
                  <svg width="18" height="12" viewBox="0 0 18 12">
                    <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
