import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from '../../components/Button';
import { Eyebrow } from '../../components/Eyebrow';
import { MaskedText, Reveal } from '../../components/Reveal';
import { Picture } from '../../components/Picture';
import { imageUrl, images } from '../../content/images';
import { MACHINES, type Machine } from '../../content/machines';
import { useDemoIntent } from '../../lib/DemoIntentContext';
import { useInView } from '../../lib/useInView';
import s from './Lineup.module.css';

/** Loupe diameter, as a share of the machine's width. */
const LOUPE = 34;

/**
 * Where the loupe sits and how its leader line runs, in percent of the machine's width
 * (the machine figure is a size container, so these become cqw in CSS). On wide screens
 * the loupe stands just off the machine's left side, level with the panel; on phones it
 * sits right over the panel (see the CSS).
 */
function loupeVars(m: Machine): CSSProperties {
  const ratio = images[m.image].ratio;
  const px = m.panel.x * 100;
  const py = (m.panel.y * 100) / ratio;
  const r = LOUPE / 2;
  const lx = -(r + 4);
  const ly = py;
  const len = Math.hypot(px - lx, py - ly) - r;
  const angle = Math.atan2(py - ly, px - lx);
  return {
    '--px': px,
    '--py': py,
    '--lx': lx,
    '--ly': ly,
    '--lead': len,
    '--angle': `${angle}rad`,
    '--zoom': LOUPE / (m.panel.size * 100),
    '--ratio': ratio,
    '--scale': m.scale,
  } as CSSProperties;
}

/**
 * The machines on a turntable: one centre stage, the other two stepped back either
 * side. Tabs, arrow keys, the side arrows, a click on a machine at the back, or a swipe
 * bring the next one round. A loupe shows the chosen machine's selection panel.
 */
export function Lineup() {
  const { requestDemo } = useDemoIntent();
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView<HTMLDivElement>();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragFrom = useRef<number | null>(null);
  const n = MACHINES.length;
  const m = MACHINES[active];

  const show = (i: number, focusTab = false) => {
    const next = (i + n) % n;
    setActive(next);
    if (focusTab) tabs.current[next]?.focus();
  };
  // -1, 0 or 1: to the left, centre stage, to the right (three machines, so it wraps).
  const place = (i: number) => ((i - active + n + 1) % n) - 1;

  const onTabKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      show(active + step, true);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      show(e.key === 'Home' ? 0 : n - 1, true);
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    dragFrom.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (dragFrom.current === null) return;
    const dx = e.clientX - dragFrom.current;
    dragFrom.current = null;
    if (Math.abs(dx) > 48) show(active + (dx < 0 ? 1 : -1));
  };

  return (
    <section id="machines" data-tone="light" className={`${s.section} grain`} aria-labelledby="machines-title">
      <div className={s.inner}>
        <header className={s.head}>
          <Eyebrow tone="light">The machines</Eyebrow>
          <h2 id="machines-title" className={s.title}>
            <MaskedText text="Three sizes." />
            <em>
              <MaskedText text="One proper cup." start={2} />
            </em>
          </h2>
          <Reveal as="p" className={s.lead} delay={220}>
            From a front desk to a warehouse floor, pick the machine that fits the way your people take their chai.
          </Reveal>
        </header>

        <div ref={ref} className={s.showcase} data-in={inView} style={{ '--plinth': m.plinth } as CSSProperties}>
          <div className={s.stage} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (dragFrom.current = null)}>
            <div className={s.glow} aria-hidden="true" />
            <div className={s.numerals} aria-hidden="true">
              {MACHINES.map((mm, i) => (
                <span key={mm.id} data-active={i === active}>
                  {mm.count}
                </span>
              ))}
            </div>
            <div className={s.floor} aria-hidden="true" />

            {MACHINES.map((mm, i) => (
              <figure
                key={mm.id}
                className={s.machine}
                data-pos={place(i)}
                aria-hidden={i !== active}
                style={loupeVars(mm)}
                onClick={() => i !== active && show(i)}
              >
                <span className={s.shadow} aria-hidden="true" />
                <Picture name={mm.image} alt={mm.alt} sizes="(min-width: 900px) 34vw, 70vw" imgClassName={s.img} />
                <span className={s.leader} aria-hidden="true" />
                <span className={s.loupe} aria-hidden="true">
                  <img src={imageUrl(mm.image, 1200, 'webp')} alt="" loading="lazy" decoding="async" draggable={false} />
                </span>
              </figure>
            ))}

            <button type="button" className={s.prev} onClick={() => show(active - 1)} aria-label="Previous machine">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" className={s.next} onClick={() => show(active + 1)} aria-label="Next machine">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className={s.spec}>
            <div role="tablist" aria-label="Machines" className={s.tabs} onKeyDown={onTabKey}>
              {MACHINES.map((mm, i) => (
                <button
                  key={mm.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`machine-tab-${mm.id}`}
                  aria-selected={i === active}
                  aria-controls="machine-panel"
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => show(i)}
                >
                  {mm.name}
                </button>
              ))}
            </div>

            <div key={m.id} id="machine-panel" role="tabpanel" aria-labelledby={`machine-tab-${m.id}`} className={s.panel}>
              <p className={s.count}>
                <span>{m.count}</span> selections
              </p>
              <h3 className={s.name}>{m.name}</h3>
              <p className={s.suits}>{m.suits}</p>
              <ul className={s.controls} aria-label={`${m.name} controls`}>
                {m.controls.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <Button variant="text" tone="light" onClick={() => requestDemo({ machine: m.id, interest: 'pricing' })}>
                Price this machine
              </Button>
            </div>
          </div>
        </div>

        <p className={s.footnote}>Photos are not to scale. Selections are read from each machine’s panel; full specifications come with your quote.</p>
      </div>
    </section>
  );
}
