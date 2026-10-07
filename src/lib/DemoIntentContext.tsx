import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MachineId } from '../content/machines';
import { scrollToTarget } from './scrollTargets';

export type Interest = 'demo' | 'pricing' | 'rental' | 'installation' | 'premix';

export interface DemoIntent {
  useCase?: string;
  machine?: MachineId;
  interest?: Interest;
  /** Bumped on every request so the form re-applies it even if values repeat. */
  version: number;
}

interface Ctx {
  intent: DemoIntent;
  requestDemo: (patch: Omit<Partial<DemoIntent>, 'version'>) => void;
}

const DemoIntentContext = createContext<Ctx | null>(null);

export function DemoIntentProvider({ children }: { children: ReactNode }) {
  const [intent, setIntent] = useState<DemoIntent>({ version: 0 });

  const requestDemo = useCallback<Ctx['requestDemo']>((patch) => {
    setIntent((prev) => ({ ...prev, ...patch, version: prev.version + 1 }));
    scrollToTarget('demo');
  }, []);

  const value = useMemo(() => ({ intent, requestDemo }), [intent, requestDemo]);
  return <DemoIntentContext.Provider value={value}>{children}</DemoIntentContext.Provider>;
}

export function useDemoIntent() {
  const ctx = useContext(DemoIntentContext);
  if (!ctx) throw new Error('useDemoIntent must be used inside DemoIntentProvider');
  return ctx;
}
