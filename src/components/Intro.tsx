import { useEffect, useState } from 'react';
import { useReducedMotion } from '../lib/useMotionMode';
import { Picture } from './Picture';
import s from './Intro.module.css';

/** Brief opening curtain: the mark, a filling line, then it lifts. Once per session. */
export function Intro() {
  const reduced = useReducedMotion();
  const [seen] = useState(() => {
    try {
      return sessionStorage.getItem('chai-intro') === '1';
    } catch {
      return true;
    }
  });
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');

  useEffect(() => {
    if (seen || reduced) return;
    const lift = setTimeout(() => setPhase('out'), 1000);
    const remove = setTimeout(() => {
      setPhase('gone');
      try {
        sessionStorage.setItem('chai-intro', '1');
      } catch {
        /* private mode: the curtain simply runs again next time */
      }
    }, 1750);
    return () => {
      clearTimeout(lift);
      clearTimeout(remove);
    };
  }, [seen, reduced]);

  if (seen || reduced || phase === 'gone') return null;

  return (
    <div className={s.intro} data-phase={phase} aria-hidden="true">
      <div className={s.mark}>
        <Picture name="logo" alt="" sizes="120px" priority />
        <span className={s.line} />
      </div>
    </div>
  );
}
