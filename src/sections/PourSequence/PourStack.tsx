import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ArchMachine } from '../../components/ArchMachine';
import { ChaiCup } from '../../components/ChaiCup';
import { Eyebrow } from '../../components/Eyebrow';
import { IngredientField } from '../../components/Ingredients';
import { Picture } from '../../components/Picture';
import { Steam } from '../../components/Steam';
import { FLAVOUR_GROUPS, type Flavour } from '../../content/flavours';
import { images } from '../../content/images';
import { CUP_ON_TRAY } from '../../content/machines';
import { useInView } from '../../lib/useInView';
import { FlavourCopy, HeroCopy, PackFan, PromiseList, SupplyCopy } from './PourCopy';
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

/** Phones, tablets, short screens and reduced motion: the same story, stacked. */
export function PourStack() {
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
          <FlavourPanel key={group[0].id} group={group} seed={i} />
        ))}
        <SupplyPanel />
      </section>
    </>
  );
}

function FlavourPanel({ group, seed }: { group: Flavour[]; seed: number }) {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView<HTMLElement>();
  const f = group[active];

  return (
    <article ref={ref} className={s.panel} data-in={inView} style={paletteVars(f)} aria-labelledby={`flavour-${group[0].id}`}>
      <span className={s.word} aria-hidden="true">
        {f.name}
      </span>
      <div className={s.visual}>
        <IngredientField kinds={f.ingredients} depth="mid" seed={seed} color={f.palette.glow} className={s.field} count={4} />
        <div className={s.cup} style={cupRatio}>
          <Steam className={s.cupSteam} />
          <ChaiCup className={s.glass} flavour={f.id} />
        </div>
        <div className={s.packs}>
          {group.map((g, i) => (
            <div key={g.id} className={s.pack} data-active={i === active} aria-hidden={i !== active}>
              <Picture name={g.pack} alt={g.packAlt} sizes="(min-width: 700px) 30vw, 42vw" />
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

function SupplyPanel() {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={s.supply} data-in={inView}>
      <div className={s.supplyVisual}>
        <PackFan className={s.fan} />
        <div className={s.supplyCup} style={cupRatio}>
          <ChaiCup className={s.glass} />
        </div>
      </div>
      <SupplyCopy centred />
    </div>
  );
}
