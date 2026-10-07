import { useRef, type ReactNode } from 'react';
import { ArchMachine } from '../../components/ArchMachine';
import { Button } from '../../components/Button';
import { Eyebrow } from '../../components/Eyebrow';
import { Magnetic } from '../../components/Magnetic';
import { MaskedText } from '../../components/Reveal';
import { useInView } from '../../lib/useInView';
import { MACHINES } from '../../content/machines';
import { site } from '../../content/site';
import { USE_CASES } from '../../content/useCases';
import { INTERESTS, VOLUMES, useDemoForm } from './useDemoForm';
import s from './DemoRequest.module.css';

function Field({ id, label, error, optional, children }: { id: string; label: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className={s.field} data-invalid={!!error}>
      <label htmlFor={id}>
        {label}
        {optional && <span className={s.optional}> (optional)</span>}
      </label>
      {children}
      {error && (
        <p className={s.error} id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function DemoRequest() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { values, errors, status, set, toggleInterest, submit } = useDemoForm(() => headingRef.current?.focus({ preventScroll: true }));
  const err = (k: keyof typeof errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {});
  const [innerRef, innerIn] = useInView<HTMLDivElement>();

  return (
    <section id="demo" className={s.section} aria-labelledby="demo-title">
      <div ref={innerRef} className={s.inner} data-in={innerIn}>
        <div className={s.visual}>
          <ArchMachine
            image="machine-multi-outline"
            alt="Multi-selection Chai Depot vending machine"
            sizes="(min-width: 1000px) 30vw, 70vw"
            blend="none"
            fit="tight"
            backdrop={false}
          />
          <div className={s.direct}>
            <p>Prefer to talk?</p>
            <a href={site.phone.href}>{site.phone.display}</a>
            <a href={site.tollFree.href}>{site.tollFree.display}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        </div>

        <div className={s.panel}>
          <Eyebrow tone="light">Book a demo</Eyebrow>
          <h2 id="demo-title" ref={headingRef} tabIndex={-1} className={s.title}>
            <MaskedText text="Let’s pour" />
            <em>
              <MaskedText text="you a cup." start={2} />
            </em>
          </h2>
          <p className={s.lead}>Tell us about your space, and we’ll come back with a demo time and clear pricing.</p>

          {status === 'sent' ? (
            <p className={s.done} role="status">
              Thank you. Your request is with our team, and we’ll be in touch shortly.
            </p>
          ) : (
            <form className={s.form} onSubmit={submit} noValidate>
              <fieldset className={s.chips} aria-describedby={errors.interests ? 'interests-error' : undefined}>
                <legend>I’m interested in</legend>
                <div className={s.chipRow}>
                  {INTERESTS.map((i, n) => (
                    <label key={i.id} className={s.chip}>
                      <input
                        type="checkbox"
                        name={n === 0 ? 'interests' : undefined}
                        checked={values.interests.includes(i.id)}
                        onChange={() => toggleInterest(i.id)}
                      />
                      <span>{i.label}</span>
                    </label>
                  ))}
                </div>
                {errors.interests && (
                  <p className={s.error} id="interests-error">
                    {errors.interests}
                  </p>
                )}
              </fieldset>

              <div className={s.grid}>
                <Field id="name" label="Your name" error={errors.name}>
                  <input id="name" name="name" autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} {...err('name')} />
                </Field>
                <Field id="business" label="Business name" error={errors.business}>
                  <input id="business" name="business" autoComplete="organization" value={values.business} onChange={(e) => set('business', e.target.value)} {...err('business')} />
                </Field>
                <Field id="email" label="Email" error={errors.email}>
                  <input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} {...err('email')} />
                </Field>
                <Field id="phone" label="Phone" optional error={errors.phone}>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} {...err('phone')} />
                </Field>
                <Field id="useCase" label="Type of business" optional>
                  <select id="useCase" name="useCase" value={values.useCase} onChange={(e) => set('useCase', e.target.value)}>
                    <option value="">Choose one</option>
                    {USE_CASES.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="machine" label="Machine" optional>
                  <select id="machine" name="machine" value={values.machine} onChange={(e) => set('machine', e.target.value as typeof values.machine)}>
                    <option value="unsure">Not sure yet</option>
                    {MACHINES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <fieldset className={s.chips}>
                <legend>
                  Cups per day <span className={s.optional}>(optional, a rough guess is fine)</span>
                </legend>
                <div className={s.chipRow}>
                  {VOLUMES.map((v) => (
                    <label key={v} className={s.chip}>
                      <input type="radio" name="volume" value={v} checked={values.volume === v} onChange={() => set('volume', v)} />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className={s.grid}>
                <Field id="city" label="City or postal code" optional>
                  <input id="city" name="city" autoComplete="postal-code" value={values.city} onChange={(e) => set('city', e.target.value)} />
                </Field>
                <Field id="message" label="Anything else" optional>
                  <textarea id="message" name="message" rows={3} value={values.message} onChange={(e) => set('message', e.target.value)} />
                </Field>
              </div>

              <div className={s.submitRow}>
                <Magnetic>
                  <Button type="submit" tone="light" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Request my demo'}
                  </Button>
                </Magnetic>
                <p className={s.status} role="status">
                  {status === 'mailto' && `Your email app should open with the details filled in. If it doesn’t, write to ${site.email}.`}
                  {status === 'error' && `Something went wrong sending that. Please call ${site.phone.display} or email ${site.email}.`}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
