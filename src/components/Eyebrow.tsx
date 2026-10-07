import type { ReactNode } from 'react';
import s from './Eyebrow.module.css';

/** Small caps label led by a double hairline, echoing the rules around the logo wordmark. */
export function Eyebrow({ children, tone = 'dark', as: Tag = 'p' }: { children: ReactNode; tone?: 'dark' | 'light'; as?: 'p' | 'span' }) {
  return <Tag className={`${s.eyebrow} ${s[tone]}`}>{children}</Tag>;
}
