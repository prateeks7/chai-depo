import { useRef, type RefObject } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { FLAVOURS } from '../../content/flavours';
import { CUP_ON_TRAY } from '../../content/machines';
import { registerScrollTarget } from '../../lib/scrollTargets';
import { scrollToY } from '../../lib/scroll';
import type { SpinState } from '../../components/SpinCup';

// Timeline "seconds". Labels mark resting states, which scrolling snaps to.
const UNIT = 0.7; // viewport heights of scroll per second
const HANDOFF = 0.3;
const PROMISE = 1.8;
const FIRST = 2.8;
const STEP = 1;
const TRANS = 0.6;
const SUPPLY = FIRST + FLAVOURS.length * STEP;
const END = SUPPLY + 0.3;

const DEPTH_SHIFT: Record<string, number> = { back: 40, mid: 110, front: 220 };
const depthShift = (el: Element) => DEPTH_SHIFT[(el as HTMLElement).dataset.depth ?? 'mid'] ?? 100;

const rgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});

/** Layout position relative to `ancestor`, ignoring any transforms. */
function offsetRect(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function usePourTimeline(
  root: RefObject<HTMLElement | null>,
  onChapter: (label: string) => void,
  spin: SpinState,
) {
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const stage = q('[data-stage]')[0] as HTMLElement;
      const cup = q('[data-cup]')[0] as HTMLElement;
      const cupInner = q('[data-cup-inner]');
      const machineImg = q('[data-arch] img')[0] as HTMLElement;
      const gardenCup = q('[data-cup-model="garden"]');
      const brandedCup = q('[data-cup-model="branded"]');
      const packShadow = q('[data-pack-shadow]');
      const fan = q('[data-fan]');

      const flav = FLAVOURS.map((f) => ({
        f,
        word: q(`[data-word="${f.id}"]`),
        pack: q(`[data-pack="${f.id}"]`),
        packImg: q(`[data-pack="${f.id}"] img`),
        callout: q(`[data-callout="${f.id}"]`),
        copy: q(`[data-copy="${f.id}"]`),
        layers: q(`[data-ingredients="${f.id}"]`),
        ring: q(`[data-callout="${f.id}"] [data-ring]`),
        ringLabel: q(`[data-callout="${f.id}"] [data-ring-label]`),
      }));

      gsap.set(flav.flatMap((x) => [...x.word, ...x.pack, ...x.layers, ...x.ringLabel, ...x.callout]), { autoAlpha: 0 });
      // Flavour copy only fades (no visibility:hidden) so screen readers can still reach it.
      gsap.set(flav.flatMap((x) => x.copy), { opacity: 0 });
      gsap.set(q('[data-promise]'), { autoAlpha: 0, y: 24 });
      gsap.set(q('[data-supply], [data-fan-item], [data-rail]'), { autoAlpha: 0 });
      gsap.set(cup, { transformOrigin: '50% 100%' });

      const cupStart = () => {
        const m = offsetRect(machineImg, stage);
        const c = offsetRect(cup, stage);
        return {
          x: m.x + m.w * CUP_ON_TRAY.x - (c.x + c.w / 2),
          y: m.y + m.h * CUP_ON_TRAY.y - (c.y + c.h),
          scale: (m.h * CUP_ON_TRAY.h) / c.h,
        };
      };

      let lastLabel = '';
      const tl = gsap.timeline({
        defaults: { duration: TRANS, ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${END * window.innerHeight * UNIT}`,
          pin: stage,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // inertia: false, so a fast flick settles on the next chapter instead of skipping several.
          snap: { snapTo: 'labelsDirectional', inertia: false, duration: { min: 0.25, max: 0.8 }, delay: 0.1, ease: 'power1.inOut' },
          onUpdate: (self) => {
            const t = self.progress * tl.duration();
            let nearest = 'hero';
            let best = Infinity;
            for (const [name, time] of Object.entries(tl.labels)) {
              const d = Math.abs(time - t);
              if (d < best) {
                best = d;
                nearest = name;
              }
            }
            if (nearest !== lastLabel) {
              lastLabel = nearest;
              onChapter(nearest);
            }
          },
        },
      });

      // Hero -> the cup leaves the machine.
      tl.addLabel('hero', 0);
      tl.to(q('[data-cue]'), { autoAlpha: 0, duration: 0.2 }, 0.05);
      tl.to(q('[data-hero-copy]'), { autoAlpha: 0, y: -48, duration: 0.45, ease: 'power1.in' }, HANDOFF);
      tl.to(q('[data-arch]'), { autoAlpha: 0, xPercent: 10, scale: 0.92, duration: 1.1, ease: 'power2.in' }, HANDOFF + 0.1);
      tl.fromTo(
        cup,
        { x: () => cupStart().x, y: () => cupStart().y, scale: () => cupStart().scale },
        { x: 0, y: 0, scale: 1, duration: 1.25, ease: 'power3.inOut' },
        HANDOFF + 0.1,
      );
      tl.to(spin, { turn: Math.PI, duration: 1.25, ease: 'power2.inOut' }, HANDOFF + 0.1);
      tl.to(q('[data-promise]'), { autoAlpha: 1, y: 0, stagger: 0.14, duration: 0.4, ease: 'power2.out' }, HANDOFF + 0.6);
      tl.addLabel('promise', PROMISE);
      tl.to(q('[data-rail]'), { autoAlpha: 1, duration: 0.3 }, PROMISE - 0.2);

      // Flavour chapters.
      flav.forEach((cur, i) => {
        const prev = flav[i - 1];
        const at = FIRST + i * STEP - TRANS;
        const sameFamily = !!prev?.f.family && prev.f.family === cur.f.family;
        const { palette } = cur.f;

        tl.to(stage, { '--stage': palette.stage, '--accent': palette.accent, '--glow': palette.glow, '--liquid': palette.liquid, '--steam': palette.steam, ease: 'none' }, at);
        tl.to(cupInner, { rotation: i % 2 ? 1.5 : -1.5, ease: 'sine.inOut' }, at);

        if (i === 0) {
          tl.to(q('[data-promise]'), { autoAlpha: 0, y: -20, stagger: 0.05, duration: 0.3, ease: 'power1.in' }, at);
          tl.to(packShadow, { autoAlpha: 1, duration: 0.45 }, at + 0.25);
        }
        if (prev) {
          tl.to(prev.copy, { opacity: 0, y: -28, duration: 0.3, ease: 'power1.in' }, at);
          tl.to(prev.word, { autoAlpha: 0, yPercent: -10, duration: 0.4 }, at);
          tl.to(prev.layers, { autoAlpha: 0, y: (_: number, t: Element) => -depthShift(t), duration: 0.5 }, at);
          if (prev.callout.length) tl.to(prev.callout, { autoAlpha: 0, duration: 0.2 }, at);
          // Across families the new label wipes up over this one; it is hidden once covered,
          // and before the chapter's resting point (at + TRANS), or a slightly wider label
          // underneath shows as a sliver at the card's edge.
          if (sameFamily) tl.to(prev.pack, { autoAlpha: 0, duration: 0.35 }, at + 0.15);
          else tl.set(prev.pack, { autoAlpha: 0 }, at + TRANS - 0.04);
        }

        tl.fromTo(cur.word, { autoAlpha: 0, yPercent: 12 }, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: 'power2.out' }, at + 0.1);
        tl.fromTo(
          cur.layers,
          { autoAlpha: 0, y: (_: number, t: Element) => depthShift(t) },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' },
          at + 0.05,
        );
        if (sameFamily) {
          tl.fromTo(cur.pack, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, at + 0.1);
        } else {
          tl.fromTo(
            cur.pack,
            { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.inOut' },
            at + 0.05,
          );
          tl.fromTo(cur.packImg, { scale: 1.12 }, { scale: 1, duration: 0.7, ease: 'power2.out' }, at + 0.05);
        }
        // Half a turn per chapter, taking on the flavour's colour as it goes round.
        tl.to(spin, { turn: Math.PI * (i + 2), ...rgb(palette.cup), duration: TRANS, ease: 'power2.inOut' }, at);
        if (i === 0) {
          // Into the flavours: the tea-garden cup becomes the branded cup, already in
          // the first flavour's colour, while the print faces sideways mid-turn.
          tl.set(spin, { amount: 1 }, at);
          tl.to(brandedCup, { autoAlpha: 1, duration: 0.18 }, at + 0.2);
          tl.to(gardenCup, { autoAlpha: 0, duration: 0.18 }, at + 0.24);
        }
        if (cur.callout.length) tl.set(cur.callout, { autoAlpha: 1 }, at + 0.2);
        tl.fromTo(cur.copy, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, at + 0.25);
        if (cur.ring.length) {
          tl.fromTo(cur.ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.28, ease: 'power1.inOut' }, at + 0.22);
          tl.fromTo(cur.ringLabel, { autoAlpha: 0, x: 10 }, { autoAlpha: 1, x: 0, duration: 0.18 }, at + TRANS - 0.18);
        }
        tl.addLabel(cur.f.id, at + TRANS);
      });

      // Outro: the whole range, and premix supply.
      const last = flav[flav.length - 1];
      const at = SUPPLY - TRANS;
      tl.to(last.copy, { opacity: 0, y: -28, duration: 0.3, ease: 'power1.in' }, at);
      tl.to(last.word, { autoAlpha: 0, yPercent: -10, duration: 0.4 }, at);
      tl.to(last.layers, { autoAlpha: 0, y: (_: number, t: Element) => -depthShift(t), duration: 0.5 }, at);
      // The panel retreats to the right edge, clearing the stage for the full range.
      tl.fromTo(
        last.pack,
        { clipPath: 'inset(0% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.45, ease: 'power2.in', immediateRender: false },
        at,
      );
      if (last.callout.length) tl.to(last.callout, { autoAlpha: 0, duration: 0.2 }, at);
      tl.to(packShadow, { autoAlpha: 0, duration: 0.3 }, at);
      // Out of the flavours: back to the tea-garden cup, mid-turn.
      tl.to(spin, { turn: Math.PI * (FLAVOURS.length + 2), duration: TRANS, ease: 'power2.inOut' }, at);
      tl.to(gardenCup, { autoAlpha: 1, duration: 0.18 }, at + 0.2);
      tl.to(brandedCup, { autoAlpha: 0, duration: 0.18 }, at + 0.24);
      tl.to(stage, { '--stage': '#1a130e', '--accent': '#b87a4b', '--glow': '#d9a574', '--liquid': '#9a6644', '--steam': 0.75, ease: 'none' }, at);
      tl.to(cupInner, { rotation: 0 }, at);
      // The cup comes to the middle of the page, in front of the five labels fanning out
      // behind it, and steps forward onto the floor.
      tl.to(
        cup,
        {
          x: () => stage.clientWidth / 2 - (offsetRect(cup, stage).x + cup.offsetWidth / 2),
          y: () => window.innerHeight * 0.03,
          scale: 0.62,
          duration: 0.6,
          ease: 'power2.inOut',
        },
        at,
      );
      tl.fromTo(q('[data-fan-item]'), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power3.out' }, at + 0.15);
      tl.fromTo(fan, { '--open': 0 }, { '--open': 1, duration: 0.7, ease: 'power3.out' }, at + 0.2);
      tl.fromTo(q('[data-supply]'), { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, at + 0.25);
      tl.addLabel('supply', SUPPLY);
      tl.to({}, { duration: END - SUPPLY }, SUPPLY);

      timeline.current = tl;
      const st = tl.scrollTrigger!;
      const unregister = registerScrollTarget('flavours', () => st.labelToScroll(FLAVOURS[0].id));
      stage.dataset.ready = 'true';

      return () => {
        unregister();
        timeline.current = null;
        delete stage.dataset.ready;
      };
    },
    { scope: root },
  );

  /** Scroll position for a label, for the chapter rail. */
  return (label: string) => {
    const st = timeline.current?.scrollTrigger;
    if (!st) return;
    scrollToY(st.labelToScroll(label), !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
}
