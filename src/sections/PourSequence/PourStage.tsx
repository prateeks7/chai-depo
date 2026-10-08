import { useRef, useState, type CSSProperties } from 'react';
import { ArchMachine } from '../../components/ArchMachine';
import { IngredientField } from '../../components/Ingredients';
import { Picture } from '../../components/Picture';
import { SpinCup, type SpinState } from '../../components/SpinCup';
import { Steam } from '../../components/Steam';
import { FLAVOURS, PACK_PLACEHOLDER_RATIO } from '../../content/flavours';
import { images } from '../../content/images';
import { FlavourCopy, HeroCopy, PackFan, PackPlaceholder, PromiseList, SupplyCopy } from './PourCopy';
import { usePourTimeline } from './usePourTimeline';
import s from './PourStage.module.css';

const RAIL = [...FLAVOURS.map((f) => ({ id: f.id, label: f.variant ?? f.name, color: f.palette.accent })), { id: 'supply', label: 'Premix supply', color: '#b87a4b' }];

/** Desktop: hero, handoff and flavours as one pinned, scroll-scrubbed scene. */
export function PourStage() {
  const root = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState('hero');
  // One turn, one colour, shared by both cups so they spin as one.
  const [spin] = useState<SpinState>(() => ({ turn: 0, r: 0.57, g: 0.64, b: 0.32, amount: 0 }));
  const goTo = usePourTimeline(root, setChapter, spin);

  // The cup drifts away from the pointer. Mouse only.
  const trackPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--tilt-x', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty('--tilt-y', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section id="top" ref={root} className={s.pour}>
      <a className="skip-link" href="#machines">
        Skip the flavour story
      </a>
      <div className={s.stage} data-stage onPointerMove={trackPointer}>
        <div className={s.ground} aria-hidden="true" />
        <div className={s.shelf} aria-hidden="true" />

        <div className={s.wordSlot} aria-hidden="true">
          {FLAVOURS.map((f) => (
            <span key={f.id} className={s.word} data-word={f.id} style={{ '--word': f.palette.accent } as CSSProperties}>
              <span className={s.wordLean}>{f.name}</span>
            </span>
          ))}
        </div>

        {FLAVOURS.map((f, i) => (
          <IngredientField key={f.id} kinds={f.ingredients} depth="back" seed={i} color={f.palette.glow} dataFlavour={f.id} className={s.field} />
        ))}

        <div className={s.archSlot}>
          <div className={s.arch} data-arch>
            <ArchMachine
              image="machine-hero"
              alt="Chai Depo compact chai vending machine"
              sizes="(min-width: 1024px) 34vh, 80vw"
              blend="none"
              fit="tight"
              backdrop={false}
              priority
            />
          </div>
        </div>

        <div className={s.packSlot}>
          <div className={s.packShadow} data-pack-shadow aria-hidden="true" />
          {FLAVOURS.map((f) => (
            <div key={f.id} className={s.pack} data-pack={f.id} style={{ '--label-ratio': f.pack ? images[f.pack].ratio : PACK_PLACEHOLDER_RATIO } as CSSProperties}>
              <div className={s.packMedia}>
                {f.pack ? <Picture name={f.pack} alt={f.packAlt} sizes="(min-width: 1024px) 34vw, 60vw" /> : <PackPlaceholder name={f.name} />}
              </div>
            </div>
          ))}
          {/* Callouts sit outside the clipped panels so their labels can reach onto the stage.
              Each one repeats its panel's geometry, so label coordinates land on the print. */}
          {FLAVOURS.filter((f) => f.badge).map((f) => (
            <div key={f.id} className={s.calloutLayer} data-callout={f.id} style={{ '--label-ratio': f.pack ? images[f.pack].ratio : PACK_PLACEHOLDER_RATIO } as CSSProperties}>
              <div className={s.packMedia}>
                <div className={s.callout} style={{ left: `${f.badge!.at.x * 100}%`, top: `${f.badge!.at.y * 100}%` }}>
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="46" pathLength={1} data-ring />
                    <path d="M4 50H-40" pathLength={1} data-ring />
                  </svg>
                  <span className={s.calloutLabel} data-ring-label>
                    {f.badge!.label}
                    <small>printed on the pack</small>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={s.fanSlot} data-fan>
          <PackFan itemProps={{ 'data-fan-item': '' }} />
        </div>

        <div className={s.cupSlot}>
          <div className={s.cup} data-cup style={{ '--cup-ratio': images['cup-garden'].ratio } as CSSProperties}>
            <div className={s.cupInner} data-cup-inner>
              <Steam className={s.steam} />
              {/* The tea-garden cup outside the flavours; the branded cup, in each flavour's
                  colour, through them. The timeline swaps them halfway through a turn. */}
              <div className={s.glass}>
                <SpinCup model="garden" state={spin} className={s.cupModel} data={{ 'data-cup-model': 'garden' }} />
                <SpinCup model="branded" state={spin} recolour className={s.cupModel} data={{ 'data-cup-model': 'branded' }} />
              </div>
            </div>
          </div>
        </div>

        {FLAVOURS.map((f, i) => (
          <IngredientField key={f.id} kinds={f.ingredients} depth="mid" seed={i + 1} color={f.palette.glow} dataFlavour={f.id} className={s.field} count={f.id === 'cardamom-nas' ? 3 : undefined} />
        ))}
        {FLAVOURS.map((f, i) => (
          <IngredientField key={f.id} kinds={f.ingredients} depth="front" seed={i + 2} color={f.palette.glow} dataFlavour={f.id} className={s.field} count={f.id === 'cardamom-nas' ? 1 : undefined} />
        ))}

        <div className={s.copyCol}>
          <div className={s.copySlot} data-hero-copy>
            <HeroCopy />
          </div>
          <div className={s.copySlot}>
            <h2 className="sr-only">Why a chai machine</h2>
            <PromiseList itemProps={{ 'data-promise': '' }} />
          </div>
          <h2 className="sr-only">Five chai premixes</h2>
          {FLAVOURS.map((f) => (
            <div key={f.id} className={s.copySlot} data-copy={f.id}>
              <FlavourCopy flavour={f} />
            </div>
          ))}
        </div>

        <div className={s.supplySlot} data-supply>
          <SupplyCopy centred />
        </div>

        <nav className={s.rail} data-rail aria-label="Flavour chapters">
          <ol>
            {RAIL.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => goTo(r.id)}
                  aria-current={chapter === r.id ? 'step' : undefined}
                  style={{ '--dot': r.color } as CSSProperties}
                >
                  <span className={s.railLabel}>{r.label}</span>
                  <span className={s.railDot} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <p className={s.cue} data-cue aria-hidden="true">
          <span />
          Scroll to pour
        </p>
      </div>
    </section>
  );
}
