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
  scrollToY(el.getBoundingClientRect().top + window.scrollY, smooth);
  return true;
}

/** onClick for <a href="#id"> links. */
export function onAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const id = e.currentTarget.hash.slice(1);
  if (id && scrollToTarget(id)) {
    e.preventDefault();
    history.replaceState(null, '', `#${id}`);
  }
}
