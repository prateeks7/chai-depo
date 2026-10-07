// Cuts the machines out of their white studio backgrounds.
//
// The backdrop is near-white and neutral, the machine is dark and saturated, so the
// background is found by flooding inward from the frame edges over pixels that are both
// bright and colourless. Flooding (rather than thresholding) keeps bright parts INSIDE
// the machine — the steel dispensing area — because they are walled off by dark edges.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = path.resolve(root, '../finalized asset');

/**
 * Regions the background growth may never enter, as fractions of the source photo.
 * The wrap artwork contains pale misty sky that is as bright and colourless as the
 * studio backdrop, so without this the flood walks straight into the machine.
 */
const KEEP = {
  // inside the machine's own edges, or it protects backdrop too
  'machine-compact-angle': [[0.135, 0.19, 0.33, 0.4]],
  // left edge measured at x 0.0857-0.0879 over this band, top edge at y 0.203
  'machine-compact': [[0.0905, 0.21, 0.3, 0.52]],
};

const SOURCES = {
  // The current set: one studio session, one angle. machines/2.jpg is left out on
  // purpose: its keypad reads TEA / COFFEE, and this site is chai only.
  'machine-compact': 'machines/3.jpg',
  'machine-multi': 'machines/4.jpg',
  'machine-high': 'machines/6.jpg',
  // Earlier photos, still used where nothing newer replaces them.
  'machine-compact-angle': 'direct/machines/chai-machine-compact-angle.jpg',
  'machine-compact-cup': 'direct/machines/chai-machine-compact-with-cup.jpg',
  'machine-compact-front': 'direct/machines/chai-machine-compact-front-angle.jpg',
  'machine-eight': 'direct/machines/chai-machine-eight-selection-angle.jpg',
  'machine-high-capacity': 'direct/machines/chai-machine-high-capacity-with-cup.jpg',
};

const WORK = 1400; // mask is computed here, then scaled back up

export async function cutout(key) {
  const src = path.join(A, SOURCES[key]);
  const meta = await sharp(src).metadata();
  if (meta.orientation && meta.orientation !== 1) throw new Error(`${key}: EXIF-rotated source, not handled`);

  const { data, info } = await sharp(src).resize({ width: WORK }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const bg = new Uint8Array(w * h);
  const stack = [];

  // Region growing with a local tolerance: the backdrop drifts darker toward the floor
  // and into contact shadows, so each step compares against the pixel it came from
  // rather than a fixed threshold. The machine's hard, dark edge stops the growth.
  const lum = new Float32Array(w * h);
  const neutral = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * c], g = data[i * c + 1], b = data[i * c + 2];
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    neutral[i] = Math.max(r, g, b) - Math.min(r, g, b) < 34 ? 1 : 0;
  }
  const MIN_LUM = 120; // never grow into genuinely dark pixels
  const STEP = 12; // allowed change between neighbours

  /**
   * The recess of bright steel inside the machine connects to the backdrop through a
   * narrow gap, so a plain flood leaks in and erases the steel. Shrinking the bright
   * area first (a min filter) snaps that thin bridge; the edges are restored afterwards
   * by growing the result back out, clipped to pixels that were bright to begin with.
   */
  const candidate = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) candidate[i] = neutral[i] && lum[i] > MIN_LUM ? 1 : 0;
  for (const [x0, y0, x1, y1] of KEEP[key] ?? []) {
    for (let y = Math.round(y0 * h); y < Math.round(y1 * h); y++) {
      for (let x = Math.round(x0 * w); x < Math.round(x1 * w); x++) candidate[y * w + x] = 0;
    }
  }
  const R = Math.round(w * 0.022);
  const morph = (src, radius, pick) => {
    const tmp = new Uint8Array(w * h);
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let v = pick === 'min' ? 1 : 0;
        for (let d = -radius; d <= radius; d++) {
          const xx = Math.min(w - 1, Math.max(0, x + d));
          v = pick === 'min' ? Math.min(v, src[y * w + xx]) : Math.max(v, src[y * w + xx]);
        }
        tmp[y * w + x] = v;
      }
    for (let x = 0; x < w; x++)
      for (let y = 0; y < h; y++) {
        let v = pick === 'min' ? 1 : 0;
        for (let d = -radius; d <= radius; d++) {
          const yy = Math.min(h - 1, Math.max(0, y + d));
          v = pick === 'min' ? Math.min(v, tmp[yy * w + x]) : Math.max(v, tmp[yy * w + x]);
        }
        out[y * w + x] = v;
      }
    return out;
  };
  const open = morph(candidate, R, 'min');

  for (let x = 0; x < w; x++) {
    if (open[x]) stack.push(x);
    const b = (h - 1) * w + x;
    if (open[b]) stack.push(b);
  }
  for (let y = 0; y < h; y++) {
    const l = y * w, r = y * w + w - 1;
    if (open[l]) stack.push(l);
    if (open[r]) stack.push(r);
  }
  while (stack.length) {
    const i = stack.pop();
    if (bg[i]) continue;
    bg[i] = 255;
    const x = i % w, y = (i / w) | 0;
    const push = (j) => {
      if (!bg[j] && open[j] && Math.abs(lum[j] - lum[i]) < STEP) stack.push(j);
    };
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }

  // Where the machine nearly touches the frame, the strip of backdrop beside it is too
  // thin to survive the opening, so the flood above never reaches it (or the pocket of
  // backdrop behind it). Flood a margin along the frame again, over the unopened
  // candidates. The steel recess is nowhere near the frame edge, so it stays safe.
  const M = Math.round(w * 0.03); // wider reaches pale sky in the wrap (machine-compact, left edge)
  const nearFrame = (x, y) => x < M || y < M || x >= w - M || y >= h - M;
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] === 254 || !candidate[i]) continue;
    bg[i] = 254; // marked separately so this pass does not stop at pixels already found
    const x = i % w, y = (i / w) | 0;
    const push = (j, jx, jy) => {
      if (bg[j] !== 254 && candidate[j] && nearFrame(jx, jy) && Math.abs(lum[j] - lum[i]) < STEP) stack.push(j);
    };
    if (x > 0) push(i - 1, x - 1, y);
    if (x < w - 1) push(i + 1, x + 1, y);
    if (y > 0) push(i - w, x, y - 1);
    if (y < h - 1) push(i + w, x, y + 1);
  }

  // grow the background back to the real edge, but only over pixels that were bright
  const grown = morph(bg, R + 2, 'max');
  const fg = new Uint8Array(w * h); // 0/1, as morph() expects
  for (let i = 0; i < w * h; i++) fg[i] = grown[i] && candidate[i] ? 0 : 1;
  // Close small notches: where pale wrap artwork meets the edge, pixels right at the
  // silhouette flicker between "sky" and "backdrop" and leave it ragged. A closing
  // (grow, then shrink) fills bites narrower than about ten pixels here and leaves real
  // shapes — the tray, the recess, the gap under the body — as they were.
  const closed = morph(morph(fg, 5, 'max'), 5, 'min');
  const alphaSmall = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) alphaSmall[i] = closed[i] * 255;
  const alpha = await sharp(alphaSmall, { raw: { width: w, height: h, channels: 1 } })
    .resize(meta.width, meta.height, { kernel: 'cubic' })
    .blur(2.2)
    .linear(1.9, -108) // tighten the soft edge so it does not look hazy
    .toColourspace('b-w') // without this the buffer comes back as 3 channels
    .raw()
    .toBuffer();
  if (alpha.length !== meta.width * meta.height) throw new Error(`alpha channel mismatch: ${alpha.length} for ${meta.width * meta.height} pixels`);

  const rgb = await sharp(src).removeAlpha().raw().toBuffer();
  const out = Buffer.alloc(meta.width * meta.height * 4);
  for (let i = 0; i < meta.width * meta.height; i++) {
    out[i * 4] = rgb[i * 3];
    out[i * 4 + 1] = rgb[i * 3 + 1];
    out[i * 4 + 2] = rgb[i * 3 + 2];
    out[i * 4 + 3] = alpha[i];
  }
  const cut = sharp(out, { raw: { width: meta.width, height: meta.height, channels: 4 } });
  const trimmed = await cut.png().toBuffer().then((b) => sharp(b).trim({ threshold: 2 }));
  const coverage = bg.reduce((n, v) => n + (v ? 0 : 1), 0) / (w * h);
  return { pipeline: trimmed, coverage };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const preview = process.argv[2];
  const keys = process.argv.slice(3);
  for (const key of keys.length ? keys : Object.keys(SOURCES)) {
    const { pipeline, coverage } = await cutout(key);
    const buf = await pipeline.png().toBuffer();
    const m = await sharp(buf).metadata();
    console.log(`${key.padEnd(24)} kept ${(coverage * 100).toFixed(1)}%  -> ${m.width}x${m.height}`);
    if (preview) {
      // checkerboard behind, so holes and haloes are obvious
      const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#bbb"/><rect width="20" height="20" fill="#eee"/><rect x="20" y="20" width="20" height="20" fill="#eee"/></svg>`);
      const small = await sharp(buf).resize({ height: 620 }).toBuffer();
      const sm = await sharp(small).metadata();
      await sharp({ create: { width: sm.width, height: sm.height, channels: 3, background: '#ddd' } })
        .composite([{ input: tile, tile: true, blend: 'over' }, { input: small }])
        .jpeg({ quality: 80 })
        .toFile(`${preview}/cut-${key}.jpg`);
    }
  }
}
