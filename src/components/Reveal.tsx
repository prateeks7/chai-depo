import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInView } from '../lib/useInView';
import s from './Reveal.module.css';

/** Rises and fades in once, the first time it is scrolled to. */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <Tag ref={ref} className={[s.reveal, className].filter(Boolean).join(' ')} data-in={inView} style={{ '--delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/**
 * Words rise out from behind a mask, one after another. Used on headings, where a plain
 * fade reads flat.
 */
export function MaskedText({ text, className, as: Tag = 'span', start = 0 }: { text: string; className?: string; as?: ElementType; start?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={[s.masked, className].filter(Boolean).join(' ')} data-in={inView}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className={s.word}>
            <span style={{ '--i': start + i } as CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
