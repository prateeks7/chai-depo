// Processes generated art dropped into art/incoming (see art/PROMPTS.md) into
// public/img, and adds it to src/content/imageManifest.json.
//
// Treatments:
//   key   — flat magenta #FF00FF background keyed out, colour fringe removed, trimmed
//   glow  — shot on pure black; blacks crushed so it screen-blends cleanly (no alpha)
//   scene — a full photograph, resized only
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(root, 'art/incoming');
const OUT = path.join(root, 'public/img');
mkdirSync(IN, { recursive: true });
mkdirSync(OUT, { recursive: true });

const FLAVOURS = ['cardamom', 'jaggery', 'masala', 'karak'];
const DEPTHS = ['back', 'mid', 'front'];

const MACHINES = ['compact-angle', 'compact-cup', 'compact-front', 'eight', 'high-capacity'];

const JOBS = [
  ...MACHINES.map((m) => ({ file: `cut-machine-${m}.png`, key: `cut-machine-${m}`, treatment: 'key', widths: [480, 800, 1200, 1800] })),
  // No cup jobs: the branded cup and its flavour colours come from scripts/hero-cup.mjs.
  ...[1, 2, 3].map((n) => ({ file: `steam-0${n}.png`, key: `steam-0${n}`, treatment: 'glow', widths: [360, 720] })),
  ...FLAVOURS.flatMap((f) => DEPTHS.map((d) => ({ file: `ing-${f}-${d}.png`, key: `ing-${f}-${d}`, treatment: 'key', widths: [480, 900, 1400] }))),
  { file: 'hero-backdrop-desktop.jpg', key: 'hero-backdrop-desktop', treatment: 'scene', widths: [900, 1600, 2400] },
  { file: 'hero-backdrop-mobile.jpg', key: 'hero-backdrop-mobile', treatment: 'scene', widths: [600, 1000, 1440] },
  { file: 'pour-stream.png', key: 'pour-stream', treatment: 'glow', widths: [400, 800] },
  { file: 'dust-motes.png', key: 'dust-motes', treatment: 'glow', widths: [700, 1400] },
];

/**
 * Removes the flat magenta backing. Alpha comes from how magenta a pixel is
 * (red and blue high, green low), with a soft edge band so hair-fine detail and
 * glass edges stay smooth. Remaining magenta spill is pulled back toward neutral.
 */
async function keyMagenta(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const FULL = 90; // magenta-ness at which a pixel is fully background
  const EDGE = 26; // below this it is fully foreground
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const magenta = Math.min(r, b) - g;
    if (magenta <= EDGE) continue;
    if (magenta >= FULL) {
      data[i + 3] = 0;
      continue;
    }
    data[i + 3] = Math.round(data[i + 3] * (1 - (magenta - EDGE) / (FULL - EDGE)));
    // de-spill: hold red and blue near green so edges do not glow pink
    const cap = g + 18;
    data[i] = Math.min(r, cap);
    data[i + 2] = Math.min(b, cap);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()
    .then((buf) => sharp(buf).trim({ threshold: 1 }));
}

/** Pulls near-black down to true black so the layer screen-blends without a grey box. */
function crushToBlack(file) {
  const a = 255 / (255 - 26);
  return sharp(file).removeAlpha().linear(a, -26 * a);
}

const manifestPath = path.join(root, 'src/content/imageManifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const present = [];
const missing = [];

for (const job of JOBS) {
  const src = path.join(IN, job.file);
  if (!existsSync(src)) {
    missing.push(job.file);
    continue;
  }
  const pipeline =
    job.treatment === 'key' ? await keyMagenta(src) : job.treatment === 'glow' ? crushToBlack(src) : sharp(src);
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const master = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  const alpha = info.channels === 4;
  const widths = job.widths.filter((w) => w <= info.width);
  if (!widths.length) widths.push(info.width);

  for (const w of widths) {
    const base = path.join(OUT, `${job.key}-${w}`);
    const r = master.clone().resize({ width: w });
    await r.clone().avif({ quality: alpha ? 58 : 50, effort: 4 }).toFile(`${base}.avif`);
    await r.clone().webp({ quality: alpha ? 84 : 78, alphaQuality: 90 }).toFile(`${base}.webp`);
  }
  manifest[job.key] = { widths, width: info.width, height: info.height, ratio: +(info.width / info.height).toFixed(4) };
  present.push(`${job.key.padEnd(22)} ${info.width}x${info.height} -> [${widths.join(', ')}]`);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const stray = readdirSync(IN).filter((f) => !f.startsWith('.') && !JOBS.some((j) => j.file === f));
console.log(present.length ? `Processed:\n  ${present.join('\n  ')}` : 'Nothing found in art/incoming yet.');
if (stray.length) console.log(`\nIgnored (name not in art/PROMPTS.md):\n  ${stray.join('\n  ')}`);
console.log(`\nStill to generate (${missing.length}):\n  ${missing.join('\n  ') || 'none — all present'}`);
