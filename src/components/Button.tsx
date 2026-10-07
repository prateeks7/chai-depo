import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import s from './Button.module.css';

type Look = { variant?: 'solid' | 'line' | 'text'; tone?: 'dark' | 'light'; arrow?: boolean; children: ReactNode };

const classes = (variant: Look['variant'] = 'solid', tone: Look['tone'] = 'dark', extra?: string) =>
  [s.btn, s[variant], s[tone], extra].filter(Boolean).join(' ');

const Arrow = () => (
  <svg className={s.arrow} width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
    <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export function ButtonLink({ variant, tone, arrow = true, children, className, ...rest }: Look & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={classes(variant, tone, className)} {...rest}>
      <span>{children}</span>
      {arrow && <Arrow />}
    </a>
  );
}

export function Button({ variant, tone, arrow = true, children, className, ...rest }: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(variant, tone, className)} {...rest}>
      <span>{children}</span>
      {arrow && <Arrow />}
    </button>
  );
}
