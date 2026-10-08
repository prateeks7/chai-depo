import { ScrollTrigger } from './gsap';
import { scrollToY } from './scroll';

// Anchors inside the pinned scene have no real scroll position, so the scene
// registers a resolver here and in-page links ask it first.
type Resolver = () => number;
const targets = new Map<string, Resolver>();

export function registerScrollTarget(id: string, resolve: Resolver) {
  targets.set(id, resolve);
  return () => {
    if (targets.get(id) === resolve) targets.delete(id);
  };
}

export function scrollToTarget(id: string) {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resolve = targets.get(id);
  if (resolve) {
    scrollToY(resolve(), smooth);
    return true;
  }
  const el = document.getElementById(id);
  if (!el) return false;
  scrollToSection(el, smooth);
  return true;
}

/**
 * Phones skip rendering sections that are far off screen (content-visibility, see
 * global.css), so a section below the fold stands at an estimated height and the ones
 * after it read as being somewhere they are not: measured from the top of the page, the
 * demo section looks about 2500px higher than it really is.
 *
 * Turning the skipping off for the measurement does not help, because the moment it goes
 * back on the page shrinks again and the browser clamps the scroll back. Instead we move
 * to where the target looks to be; the sections we pass on the way render for real, so
 * the next reading is closer. Two or three passes land it, and each one is a short hop,
 * not a jump. On desktop nothing is skipped, so the first check finds it already in
 * place and stops.
 */
function scrollToSection(el: HTMLElement, smooth: boolean, pass = 0) {
  const top = () => el.getBoundingClientRect().top + window.scrollY;
  scrollToY(top(), smooth);
  window.setTimeout(() => {
    const gap = top() - window.scrollY;
    if (Math.abs(gap) < 2) {
      ScrollTrigger.refresh();
      return;
    }
    if (pass < 5) scrollToSection(el, smooth, pass + 1);
    else ScrollTrigger.refresh();
  }, smooth ? 1250 : 60);
}

/** onClick for <a href="#id"> links. */
export function onAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const id = e.currentTarget.hash.slice(1);
  if (id && scrollToTarget(id)) {
    e.preventDefault();
    history.replaceState(null, '', `#${id}`);
  }
}
