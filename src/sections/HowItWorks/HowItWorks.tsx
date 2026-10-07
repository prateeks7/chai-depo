import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Eyebrow } from '../../components/Eyebrow';
import { MaskedText } from '../../components/Reveal';
import { Picture } from '../../components/Picture';
import { images } from '../../content/images';
import { STEPS } from '../../content/machines';
import { useMediaQuery } from '../../lib/useMotionMode';
import s from './HowItWorks.module.css';

type Region = (typeof STEPS)[number]['region'];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** One photo of the compact machine, zoomed to the part each step talks about. */
function ZoomFrame({ region, label }: { region: Region; label: string }) {
  const scale = 1 / region.size;
  const tx = clamp(0.5 - region.cx * scale, 1 - scale, 0) * 100;
  const ty = clamp(0.5 - region.cy * scale, 1 - scale, 0) * 100;
  return (
    <div className={s.frame} style={{ '--ratio': images['machine-compact-studio'].ratio } as CSSProperties} role="img" aria-label={label}>
      <div className={s.zoom} style={{ transform: `translate(${tx}%, ${ty}%) scale(${scale})` }}>
        <Picture name="machine-compact-studio" alt="" sizes="(min-width: 900px) 90vw, 200vw" imgClassName={s.img} />
      </div>
    </div>
  );
}

export function HowItWorks() {
  const wide = useMediaQuery('(min-width: 900px)');
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!wide) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [wide]);

  const step = STEPS[active];

  return (
    <section id="how" data-tone="light" className={`${s.section} grain`} aria-labelledby="how-title">
      <div className={s.inner}>
        <header className={s.head}>
          <Eyebrow tone="light">How it works</Eyebrow>
          <h2 id="how-title" className={s.title}>
            <MaskedText text="Four steps" />
            <em>
              <MaskedText text="to a proper cup." start={2} />
            </em>
          </h2>
        </header>

        <div className={s.layout}>
          {wide && (
            <div className={s.frameCol}>
              <ZoomFrame
                region={step.region}
                label={`Compact machine: ${step.title}`}
              />
            </div>
          )}
          <ol className={s.steps}>
            {STEPS.map((st, i) => (
              <li
                key={st.id}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                data-index={i}
                data-active={wide ? i === active : true}
                className={s.step}
              >
                {!wide && (
                  <ZoomFrame region={st.region} label={`Compact machine: ${st.title}`} />
                )}
                <span className={s.num}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={s.stepTitle}>{st.title}</h3>
                <p className={s.stepBody}>{st.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
