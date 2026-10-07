// Builds machines wrapped in decorative brown contours, so they read on the dark page
// without a lit panel behind them: the real photo with its studio background removed
// (cutout.mjs), then the contours drawn round it.
//   machine-hero            the compact, for the hero
//   machine-multi-outline   the multi-selection, for Book a demo
//
// The contours are echoes of the silhouette at exact offsets, cut from a distance
// field (see distanceOutside). Each one gets its own offset, weight, colour and
// pattern — solid, diagonal dash, dot grid — so the result looks drawn rather than
// like a plain traced outline.
import sharp from 'sharp';
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cutout } from './cutout.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public/img');
const JOBS = [
  { key: 'machine-hero', source: 'machine-compact' },
  { key: 'machine-multi-outline', source: 'machine-multi' },
];
const WIDTHS = [480, 800, 1200, 1800];
const MASTER_W = 1800; // everything is drawn at the largest output width

/**
 * Contours, innermost first. All distances are multiples of R (a share of the
 * machine's width), so the design holds at any source resolution.
 *   gap: distance from the silhouette edge to the inside of the line
 *   weight: line thickness
 *   pattern: how the line is broken up
 */
// Four lines rather than more: the hero draws the machine at roughly a quarter of
// this master's width, and any tighter spacing collapses into one fuzzy band.
const CONTOURS = [
  { gap: 0.6, weight: 1.6, colour: '#e8c79a', alpha: 0.95, pattern: 'solid' },
  { gap: 5.0, weight: 1.3, colour: '#d9a574', alpha: 0.85, pattern: 'dash' },
  { gap: 10.0, weight: 1.1, colour: '#b87a4b', alpha: 0.75, pattern: 'dot' },
  { gap: 15.5, weight: 1.0, colour: '#d9a574', alpha: 0.5, pattern: 'dashFine' },
];

/**
 * Chamfer distance transform: for every transparent pixel, how far it is from the
 * silhouette, in pixels. Two sequential passes with a 5-7-11 kernel, which is
 * accurate to about 2% — far better than thresholding a blur, and it lets the
 * contours sit at offsets that are actually even all the way round the shape.
 */
function distanceOutside(alpha, W, H) {
  const INF = 1e9;
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = alpha[i] > 127 ? 0 : INF;
  const A = 5 / 5, B = 7 / 5, C = 11 / 5; // orthogonal, diagonal, knight's move

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i] === 0) continue;
      let m = d[i];
      if (x > 0) m = Math.min(m, d[i - 1] + A);
      if (y > 0) m = Math.min(m, d[i - W] + A);
      if (x > 0 && y > 0) m = Math.min(m, d[i - W - 1] + B);
      if (x < W - 1 && y > 0) m = Math.min(m, d[i - W + 1] + B);
      if (x > 1 && y > 0) m = Math.min(m, d[i - W - 2] + C);
      if (x > 0 && y > 1) m = Math.min(m, d[i - 2 * W - 1] + C);
      if (x < W - 2 && y > 0) m = Math.min(m, d[i - W + 2] + C);
      if (x < W - 1 && y > 1) m = Math.min(m, d[i - 2 * W + 1] + C);
      d[i] = m;
    }
  }
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (d[i] === 0) continue;
      let m = d[i];
      if (x < W - 1) m = Math.min(m, d[i + 1] + A);
      if (y < H - 1) m = Math.min(m, d[i + W] + A);
      if (x < W - 1 && y < H - 1) m = Math.min(m, d[i + W + 1] + B);
      if (x > 0 && y < H - 1) m = Math.min(m, d[i + W - 1] + B);
      if (x < W - 2 && y < H - 1) m = Math.min(m, d[i + W + 2] + C);
      if (x < W - 1 && y < H - 2) m = Math.min(m, d[i + 2 * W + 1] + C);
      if (x > 1 && y < H - 1) m = Math.min(m, d[i + W - 2] + C);
      if (x > 0 && y < H - 2) m = Math.min(m, d[i + 2 * W - 1] + C);
      d[i] = m;
    }
  }
  return d;
}

/**
 * Coverage of one contour at a pixel: 1 inside the band, 0 outside, feathered over
 * a pixel at each edge so the line is not stepped.
 */
function band(dist, lo, hi) {
  const f = 1;
  if (dist <= lo - f || dist >= hi + f) return 0;
  const inLo = Math.min(1, Math.max(0, (dist - (lo - f)) / (2 * f)));
  const inHi = Math.min(1, Math.max(0, (hi + f - dist) / (2 * f)));
  return Math.min(inLo, inHi);
}

/**
 * Patterns are sampled in screen space, so a dash or dot crosses the contour
 * wherever it runs. Reading them off x/y rather than along the outline keeps every
 * break the same size regardless of how the silhouette turns.
 */
function patternAt(kind, x, y, R) {
  switch (kind) {
    case 'dash': {
      const p = R * 9;
      return ((x + y) % p) / p < 0.6 ? 1 : 0;
    }
    case 'dashFine': {
      const p = R * 6;
      return ((x - y + 1e5) % p) / p < 0.48 ? 1 : 0;
    }
    case 'dot': {
      const p = R * 4.6;
      const dx = ((x % p) + p) % p - p / 2;
      const dy = ((y % p) + p) % p - p / 2;
      return Math.hypot(dx, dy) < p * 0.34 ? 1 : 0;
    }
    default:
      return 1;
  }
}

const rgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

async function build(KEY, SOURCE) {
  const { pipeline } = await cutout(SOURCE);
  const cut = await pipeline.resize({ width: MASTER_W }).png().toBuffer();
  const { data, info } = await sharp(cut).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  const R = Math.max(3, w * 0.0045);
  const outer = CONTOURS.at(-1);
  const pad = Math.ceil((outer.gap + outer.weight) * R + R * 2);
  const W = w + pad * 2;
  const H = h + pad * 2;

  const padded = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer();

  const alpha = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = padded[i * 4 + 3];

  const dist = distanceOutside(alpha, W, H);

  // Paint the contours into one straight-alpha layer, innermost first. Colours are
  // blended source-over as they overlap, which they only do where a line is feathered.
  const layer = Buffer.alloc(W * H * 4);
  const bands = CONTOURS.map((c) => ({ ...c, lo: c.gap * R, hi: (c.gap + c.weight) * R, tint: rgb(c.colour) }));
  const reach = bands.at(-1).hi + 2;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dv = dist[i];
      if (dv === 0 || dv > reach) continue;
      let ar = 0, ag = 0, ab = 0, aa = 0;
      for (const c of bands) {
        const cov = band(dv, c.lo, c.hi);
        if (cov === 0) continue;
        const a = cov * c.alpha * patternAt(c.pattern, x, y, R);
        if (a <= 0) continue;
        ar = c.tint.r * a + ar * (1 - a);
        ag = c.tint.g * a + ag * (1 - a);
        ab = c.tint.b * a + ab * (1 - a);
        aa = a + aa * (1 - a);
      }
      if (aa <= 0) continue;
      layer[i * 4] = Math.round(ar / aa);
      layer[i * 4 + 1] = Math.round(ag / aa);
      layer[i * 4 + 2] = Math.round(ab / aa);
      layer[i * 4 + 3] = Math.round(aa * 255);
    }
  }

  const composed = await sharp(layer, { raw: { width: W, height: H, channels: 4 } })
    .composite([{ input: padded, raw: { width: W, height: H, channels: 4 }, blend: 'over' }])
    .png()
    .toBuffer();
  const master = sharp(await sharp(composed).trim({ threshold: 1 }).png().toBuffer());
  const mm = await master.metadata();

  for (const width of WIDTHS.filter((x) => x <= mm.width)) {
    const base = path.join(OUT, `${KEY}-${width}`);
    const r = master.clone().resize({ width });
    await r.clone().avif({ quality: 62, effort: 4 }).toFile(`${base}.avif`);
    await r.clone().webp({ quality: 88, alphaQuality: 92 }).toFile(`${base}.webp`);
  }

  const manifestPath = path.join(root, 'src/content/imageManifest.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const widths = WIDTHS.filter((x) => x <= mm.width);
  manifest[KEY] = { widths, width: mm.width, height: mm.height, ratio: +(mm.width / mm.height).toFixed(4) };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${KEY}  ${mm.width}x${mm.height}  ratio ${manifest[KEY].ratio}  R ${R.toFixed(1)}px  -> [${widths.join(', ')}]`);
}

for (const { key, source } of JOBS) await build(key, source);
