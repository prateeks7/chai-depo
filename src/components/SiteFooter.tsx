import { FLAVOURS } from '../content/flavours';
import { MACHINES } from '../content/machines';
import { site } from '../content/site';
import { Picture } from './Picture';
import s from './SiteFooter.module.css';

export function SiteFooter() {
  const flavourNames = FLAVOURS.map((f) => (f.variant ? `${f.name}, ${f.variant.toLowerCase()}` : f.name));

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brand}>
          <Picture name="logo" alt={site.brand} sizes="160px" className={s.logo} />
          <p className={s.line}>Chai vending machines and premixes for workplaces, hospitality and events.</p>
        </div>

        <div className={s.col}>
          <h2 className={s.heading}>Talk to us</h2>
          <ul>
            <li>
              <a href={site.phone.href}>{site.phone.display}</a>
            </li>
            <li>
              <a href={site.tollFree.href}>{site.tollFree.display}</a>
            </li>
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          </ul>
          <address className={s.address}>
            {site.company}
            <br />
            {site.address.map((l) => (
              <span key={l}>
                {l}
                <br />
              </span>
            ))}
          </address>
        </div>

        <div className={s.col}>
          <h2 className={s.heading}>Premixes</h2>
          <ul>
            {flavourNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>

        <div className={s.col}>
          <h2 className={s.heading}>Machines</h2>
          <ul>
            {MACHINES.map((m) => (
              <li key={m.id}>{m.name}</li>
            ))}
            <li>Supply, rental and installation</li>
          </ul>
        </div>
      </div>
      <div className={s.base}>
        <p>
          © {new Date().getFullYear()} {site.brand} · {site.company}
        </p>
      </div>
    </footer>
  );
}
