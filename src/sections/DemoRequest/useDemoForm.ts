import { useEffect, useState, type FormEvent } from 'react';
import { MACHINES, type MachineId } from '../../content/machines';
import { site } from '../../content/site';
import { USE_CASES } from '../../content/useCases';
import { useDemoIntent, type Interest } from '../../lib/DemoIntentContext';

export const INTERESTS: { id: Interest; label: string }[] = [
  { id: 'demo', label: 'Demo' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'rental', label: 'Rental or lease' },
  { id: 'installation', label: 'Installation' },
  { id: 'premix', label: 'Premix supply' },
];

export const VOLUMES = ['Under 50', '50–150', '150–400', '400+'] as const;

export interface LeadValues {
  interests: Interest[];
  name: string;
  business: string;
  email: string;
  phone: string;
  useCase: string;
  machine: MachineId | 'unsure';
  volume: string;
  city: string;
  message: string;
}

type Errors = Partial<Record<keyof LeadValues, string>>;
export type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error';

const INITIAL: LeadValues = {
  interests: ['demo'],
  name: '',
  business: '',
  email: '',
  phone: '',
  useCase: '',
  machine: 'unsure',
  volume: '',
  city: '',
  message: '',
};

function validate(v: LeadValues): Errors {
  const e: Errors = {};
  if (!v.interests.length) e.interests = 'Choose at least one.';
  if (!v.name.trim()) e.name = 'Please add your name.';
  if (!v.business.trim()) e.business = 'Please add your business name.';
  if (!v.email.trim()) e.email = 'Please add an email so we can reply.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'That email doesn’t look right.';
  if (v.phone && !/^[+()\d\s.-]{7,}$/.test(v.phone)) e.phone = 'Use digits, spaces or dashes.';
  return e;
}

function summary(v: LeadValues) {
  const label = <T extends { id: string; name?: string; label?: string }>(list: T[], id: string) =>
    list.find((x) => x.id === id)?.name ?? list.find((x) => x.id === id)?.label ?? '';
  return [
    `Interested in: ${v.interests.map((i) => label(INTERESTS, i)).join(', ')}`,
    `Name: ${v.name}`,
    `Business: ${v.business}`,
    `Email: ${v.email}`,
    v.phone && `Phone: ${v.phone}`,
    v.useCase && `Business type: ${label(USE_CASES, v.useCase)}`,
    `Machine: ${v.machine === 'unsure' ? 'Not sure yet' : label(MACHINES, v.machine)}`,
    v.volume && `Cups per day: ${v.volume}`,
    v.city && `City / postal code: ${v.city}`,
    v.message && `\n${v.message}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function useDemoForm(onIntent: () => void) {
  const { intent } = useDemoIntent();
  const [values, setValues] = useState<LeadValues>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');

  // Buttons elsewhere on the page ("Price this machine", a venue row) pre-fill the form.
  useEffect(() => {
    if (!intent.version) return;
    setValues((v) => ({
      ...v,
      useCase: intent.useCase ?? v.useCase,
      machine: intent.machine ?? v.machine,
      interests: intent.interest && !v.interests.includes(intent.interest) ? [...v.interests, intent.interest] : v.interests,
    }));
    onIntent();
  }, [intent.version]);

  const set = <K extends keyof LeadValues>(key: K, value: LeadValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleInterest = (id: Interest) =>
    set('interests', values.interests.includes(id) ? values.interests.filter((i) => i !== id) : [...values.interests, id]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    const endpoint = import.meta.env.VITE_LEAD_ENDPOINT as string | undefined;
    if (!endpoint) {
      // No lead endpoint configured yet: hand the request to the visitor's email app.
      const subject = `Demo request: ${values.business}`;
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary(values))}`;
      setStatus('mailto');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, summary: summary(values) }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return { values, errors, status, set, toggleInterest, submit };
}
