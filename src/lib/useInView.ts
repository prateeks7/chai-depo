import { useEffect, useRef, useState } from 'react';

/** True once (or while, with `once: false`) the element intersects the viewport. */
export function useInView<T extends Element>({
  once = true,
  rootMargin = '0px 0px -12% 0px',
  threshold = 0,
}: { once?: boolean; rootMargin?: string; threshold?: number } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin, threshold]);

  return [ref, inView] as const;
}
