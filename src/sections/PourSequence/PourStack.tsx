import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ArchMachine } from '../../components/ArchMachine';
import { ChaiCup } from '../../components/ChaiCup';
import { Eyebrow } from '../../components/Eyebrow';
import { IngredientField } from '../../components/Ingredients';
import { Picture } from '../../components/Picture';
import { SpinCup, type SpinState } from '../../components/SpinCup';
import { Steam } from '../../components/Steam';
import { FLAVOUR_GROUPS, type Flavour } from '../../content/flavours';
import { images } from '../../content/images';
import { CUP_ON_TRAY } from '../../content/machines';
import { gsap, useGSAP } from '../../lib/gsap';
import { useInView } from '../../lib/useInView';
import { FlavourCopy, HeroCopy, PackFan, PackPlaceholder, PromiseList, SupplyCopy } from './PourCopy';
import s from './PourStack.module.css';

const paletteVars = (f: Flavour) =>
  ({
    '--stage': f.palette.stage,
    '--accent': f.palette.accent,
    '--glow': f.palette.glow,
    '--liquid': f.palette.liquid,
    '--steam': f.palette.steam,
  }) as CSSProperties;

const cupRatio = { '--cup-ratio': images['cup-garden'].ratio } as CSSProperties;
const flavourCupRatio = { '--cup-ratio': images['cup-branded'].ratio } as CSSProperties;

const rgb01 = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});

/** Phones, tablets, short screens and reduced motion: the same story, stacked. */
export function PourStack({ motion = true }: { motion?: boolean }) {
  return (
    <>
      <section id="top" className={s.hero}>
        <div className={s.heroInner}>
          <HeroCopy />
          <div className={s.heroVisual}>
            <ArchMachine
              image="machine-hero"
              alt="Chai Depo compact chai vending machine"
              sizes="(min-width: 700px) 42vw, 80vw"
              blend="none"
              fit="tight"
              backdrop={false}
              priority
            >
              <div
                className={s.trayCup}
                style={{ ...cupRatio, left: `${CUP_ON_TRAY.x * 100}%`, bottom: `${(1 - CUP_ON_TRAY.y) * 100}%`, height: `${CUP_ON_TRAY.h * 100}%` }}
              >
                <Steam className={s.traySteam} />
                <ChaiCup className={s.glass} />
              </div>
            </ArchMachine>
          </div>
        </div>
      </section>

      <section className={s.promise} aria-labelledby="promise-title">
        <div className={s.inner}>
          <h2 id="promise-title" className="sr-only">
            Why a chai machine
          </h2>
          <PromiseList />
        </div>
      </section>

      <section id="flavours" className={s.flavours} aria-labelledby="flavours-title">
        <header className={s.flavoursHead}>
          <Eyebrow>Five premixes</Eyebrow>
          <h2 id="flavours-title" className={s.flavoursTitle}>
            From delicate <em>to bold.</em>
          </h2>
        </header>
        {FLAVOUR_GROUPS.map((group, i) => (
          <FlavourPanel key={group[0].id} group={group} seed={i} motion={motion} />
        ))}
        <SupplyPanel motion={motion} />
      </section>
    </>
  );
}

function FlavourPanel({ group, seed, motion }: { group: Flavour[]; seed: number; motion: boolean }) {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView<HTMLElement>();
  // Mounted a screen early and dropped a screen late: the cup is a WebGL canvas, and
  // only the panels near the viewport should hold one.
  const [nearRef, near] = useInView<HTMLDivElement>({ once: false, rootMargin: '100% 0px' });
  const panel = useRef<HTMLElement | null>(null);
  const f = group[active];
  const spins = motion && near;

  // One turn and one colour for this panel's cup, animated by the scroll below.
  const [cup] = useState<SpinState>(() => ({ turn: 0, ...rgb01(f.palette.cup), amount: 1 }));
  useEffect(() => {
    Object.assign(cup, rgb01(f.palette.cup));
  }, [cup, f.palette.cup]);

  // The panel's own scroll-scrubbed motion: the cup turns, the word drifts against it,
  // the label rises and settles. The desktop scene does this on a pinned timeline; here
  // it plays as the panel crosses the screen.
  useGSAP(
    () => {
      if (!motion || !panel.current) return;
      const scrollTrigger = { trigger: panel.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
      // A full turn, keyed to the cup rather than the panel, so the logo comes round to
      // face front exactly as the cup reaches the middle of the screen.
      gsap.fromTo(
        cup,
        { turn: -Math.PI },
        { turn: Math.PI, ease: 'none', scrollTrigger: { trigger: nearRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
      );
      gsap.fromTo('[data-word]', { yPercent: 14 }, { yPercent: -14, ease: 'none', scrollTrigger });
      gsap.fromTo('[data-label]', { yPercent: 10, rotate: 2.4 }, { yPercent: -6, rotate: -1.6, ease: 'none', scrollTrigger });
    },
    { scope: panel, dependencies: [motion] },
  );

  return (
    <article
      ref={(el) => {
        ref.current = el;
        panel.current = el;
      }}
      className={s.panel}
      data-in={inView}
      style={paletteVars(f)}
      aria-labelledby={`flavour-${group[0].id}`}
    >
      <span className={s.word} data-word aria-hidden="true">
        {f.name}
      </span>
      <div ref={nearRef} className={s.visual}>
        <IngredientField kinds={f.ingredients} depth="mid" seed={seed} color={f.palette.glow} className={s.field} count={4} />
        <div className={s.cup} style={flavourCupRatio}>
          <Steam className={s.cupSteam} />
          {spins ? (
            <SpinCup model="branded" state={cup} recolour className={s.glass} />
          ) : (
            <ChaiCup className={s.glass} flavour={f.id} />
          )}
        </div>
        <div className={s.packs} data-label>
          {group.map((g, i) => (
            <div key={g.id} className={s.pack} data-active={i === active} aria-hidden={i !== active}>
              {g.pack ? <Picture name={g.pack} alt={g.packAlt} sizes="(min-width: 700px) 30vw, 42vw" /> : <PackPlaceholder name={g.name} />}
            </div>
          ))}
        </div>
        <div className={s.shelf} aria-hidden="true" />
      </div>
      <div className={s.copy} id={`flavour-${group[0].id}`}>
        {group.length > 1 && <SweetnessSwitch options={group} active={active} onChange={setActive} />}
        <FlavourCopy flavour={f} />
      </div>
    </article>
  );
}

function SweetnessSwitch({ options, active, onChange }: { options: Flavour[]; active: number; onChange: (i: number) => void }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + options.length) % options.length;
    onChange(next);
    (e.currentTarget.querySelectorAll('button')[next] as HTMLButtonElement | undefined)?.focus();
  };

  return (
    <div className={s.switch} role="radiogroup" aria-label="Sweetness" onKeyDown={onKeyDown}>
      {options.map((o, i) => (
        <button key={o.id} type="button" role="radio" aria-checked={i === active} tabIndex={i === active ? 0 : -1} onClick={() => onChange(i)}>
          {o.variant ?? 'Classic'}
        </button>
      ))}
    </div>
  );
}

function SupplyPanel({ motion }: { motion: boolean }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [nearRef, near] = useInView<HTMLDivElement>({ once: false, rootMargin: '100% 0px' });
  const panel = useRef<HTMLDivElement | null>(null);
  const [cup] = useState<SpinState>(() => ({ turn: 0, r: 1, g: 1, b: 1, amount: 0 }));

  useGSAP(
    () => {
      if (!motion || !panel.current) return;
      const scrollTrigger = { trigger: panel.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
      gsap.fromTo(
        cup,
        { turn: -Math.PI },
        { turn: Math.PI, ease: 'none', scrollTrigger: { trigger: nearRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
      );
      // The five labels fan out behind the cup, as they do on the desktop stage.
      gsap.fromTo('[data-fan]', { '--open': 0.25 }, { '--open': 1, ease: 'none', scrollTrigger });
    },
    { scope: panel, dependencies: [motion] },
  );

  return (
    <div
      ref={(el) => {
        ref.current = el;
        panel.current = el;
      }}
      className={s.supply}
      data-in={inView}
    >
      <div ref={nearRef} className={s.supplyVisual} data-fan>
        <PackFan className={s.fan} />
        <div className={s.supplyCup} style={cupRatio}>
          {motion && near ? <SpinCup model="garden" state={cup} className={s.glass} /> : <ChaiCup className={s.glass} />}
        </div>
      </div>
      <SupplyCopy centred />
    </div>
  );
}
