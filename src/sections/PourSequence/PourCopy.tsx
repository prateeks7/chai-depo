import type { CSSProperties } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { Magnetic } from '../../components/Magnetic';
import { MaskedText } from '../../components/Reveal';
import { Eyebrow } from '../../components/Eyebrow';
import { Picture } from '../../components/Picture';
import { FLAVOURS, type Flavour } from '../../content/flavours';
import { promises } from '../../content/site';
import { useDemoIntent } from '../../lib/DemoIntentContext';
import { onAnchorClick } from '../../lib/scrollTargets';
import c from './copy.module.css';

export function HeroCopy() {
  const { requestDemo } = useDemoIntent();
  return (
    <div className={c.hero}>
      <Eyebrow>Chai vending machines · Premixes</Eyebrow>
      <h1 className={c.title}>
        <span>
          <MaskedText text="Chai," />
        </span>
        <span>
          <MaskedText text="poured" start={1} />
        </span>
        <em>
          <MaskedText text="on demand." start={2} />
        </em>
      </h1>
      <p className={c.lead}>
        Vending machines and authentic premixes for offices, restaurants, hotels and every place people need a proper cup.
      </p>
      <div className={c.actions}>
        <Magnetic>
          <Button onClick={() => requestDemo({ interest: 'demo' })}>Book a demo</Button>
        </Magnetic>
        <ButtonLink href="#machines" onClick={onAnchorClick} variant="text">
          See the machines
        </ButtonLink>
      </div>
      <p className={c.range}>
        {FLAVOURS.map((f) => (
          <span key={f.id}>{f.variant ?? f.name}</span>
        ))}
      </p>
    </div>
  );
}

export function PromiseList({ itemProps }: { itemProps?: Record<string, string> }) {
  return (
    <ol className={c.promises}>
      {promises.map((p, i) => (
        <li key={p.title} className={c.promise} {...itemProps}>
          <span className={c.promiseNum}>{String(i + 1).padStart(2, '0')}</span>
          <span className={c.promiseTitle}>{p.title}</span>
          <span className={c.promiseDetail}>{p.detail}</span>
        </li>
      ))}
    </ol>
  );
}

export function FlavourCopy({ flavour }: { flavour: Flavour }) {
  const n = FLAVOURS.indexOf(flavour) + 1;
  return (
    <div className={c.flavour}>
      <Eyebrow>
        {String(n).padStart(2, '0')} / {String(FLAVOURS.length).padStart(2, '0')} · Premix
      </Eyebrow>
      <h3 className={c.name}>
        {flavour.name}
        {flavour.variant && <em>{flavour.variant.toLowerCase()}</em>}
      </h3>
      <p className={c.kicker}>{flavour.kicker}</p>
      <p className={c.note}>{flavour.note}</p>
      <ul className={c.tasting}>
        {flavour.tasting.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className={c.meta}>
        <span>2 lb vending pack</span>
        {flavour.badge && <span>{flavour.badge.label}</span>}
      </p>
    </div>
  );
}

export function SupplyCopy({ centred }: { centred?: boolean }) {
  const { requestDemo } = useDemoIntent();
  return (
    <div className={[c.supply, centred && c.supplyCentred].filter(Boolean).join(' ')}>
      <Eyebrow>Premix supply</Eyebrow>
      <h3 className={c.supplyTitle}>
        Five flavours. <em>One 2 lb pack each.</em>
      </h3>
      <p className={c.note}>Order premix with a machine, or on its own to keep the one you have pouring.</p>
      <div className={c.actions}>
        <Button onClick={() => requestDemo({ interest: 'premix' })}>Ask about premix supply</Button>
      </div>
    </div>
  );
}

/** All five labels, fanned out like a hand of cards (see .fan). */
export function PackFan({ className, itemProps }: { className?: string; itemProps?: Record<string, string> }) {
  const mid = (FLAVOURS.length - 1) / 2;
  return (
    <ul className={[c.fan, className].filter(Boolean).join(' ')}>
      {FLAVOURS.map((f, i) => (
        <li key={f.id} className={c.fanItem} style={{ '--k': i - mid, '--ak': Math.abs(i - mid) } as CSSProperties} {...itemProps}>
          <div className={c.fanTilt}>
            <Picture name={f.pack} alt={f.packAlt} sizes="(min-width: 1024px) 12vh, 18vw" />
          </div>
        </li>
      ))}
    </ul>
  );
}
