import { useInView } from '../lib/useInView';
import s from './Steam.module.css';

/** Soft rising steam. Pauses off screen; static under reduced motion. */
export function Steam({ className }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: false, rootMargin: '0px' });
  return (
    <div ref={ref} className={[s.steam, className].filter(Boolean).join(' ')} data-paused={!inView} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
