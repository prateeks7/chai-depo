// Turns the 44MP masters in ../finalized asset into responsive AVIF/WebP files
// in public/img and writes src/content/imageManifest.json.
//
// Treatments:
//   studio — white-background machine photos: auto-cropped with a wide margin, missing
//            margin added back as white, and the edges faded out, so the backdrop (and
//            its soft studio shadows) disappear under mix-blend-mode: multiply on any
//            light-to-mid background.
//   cutout — experimental background removal (cutout.mjs); not accurate enough on these
//            photos, because the wrap artwork contains pale sky that keys out with the
//            backdrop. Real cutouts are an image-tool job: see art/PROMPTS.md.
//   dark   — pack photos on black cloth: cropped, blacks crushed to 0 so the backdrop
//            disappears under mix-blend-mode: lighten on the dark stage.
//   flat   — artwork (logo, label) resized only.
import sharp from 'sharp';
import { cutout } from './cutout.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = path.resolve(root, '../finalized asset');
const OUT = path.join(root, 'public/img');
mkdirSync(OUT, { recursive: true });

const MACHINE_W = [480, 800, 1200, 1800];

// crop: [left, top, right, bottom] as fractions of the source (dark/flat only)
const JOBS = [

  // The compact on white with room around it, for How it works (multiply on cream).
  { key: 'machine-compact-studio', src: 'machines/3.jpg', type: 'studio', widths: [...MACHINE_W, 2600] },
  // Background removed (cutout.mjs), so they can move and overlap on any colour.
  { key: 'machine-compact', type: 'cutout', widths: [...MACHINE_W, 2600] },
  { key: 'machine-multi', type: 'cutout', widths: MACHINE_W },
  { key: 'machine-high', type: 'cutout', widths: MACHINE_W },


  { key: 'logo', src: 'direct/brand/chai-depo-logo.png', type: 'flat', widths: [160, 320, 503], alpha: true },
  { key: 'label-jaggery', src: 'CHAI_DEPOT_PREMIX_JAGGERY_4x6.pdf', type: 'flat', widths: [480, 960, 1440] },
];

const only = process.argv.slice(2);
const manifest = {};

async function loadSource(job) {
  const abs = path.join(A, job.src);
  if (!existsSync(abs)) throw new Error(`missing source ${abs}`);
  if (abs.endsWith('.pdf')) {
    const dir = mkdtempSync(path.join(tmpdir(), 'pdf-'));
    execFileSync('pdftoppm', ['-r', '400', '-png', '-singlefile', abs, path.join(dir, 'page')]);
    return sharp(path.join(dir, 'page.png'));
  }
  return sharp(abs).rotate();
}

// Bounding box of everything darker than the studio backdrop, analysed on a small copy.
async function studioBox(img, meta) {
  const small = 400;
  const { data, info } = await img.clone().resize(small).greyscale().raw().toBuffer({ resolveWithObject: true });
  const bg = [...data.slice(0, info.width * 10)].sort((a, b) => a - b)[Math.floor(info.width * 5)];
  const cut = bg - 38;
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[y * info.width + x] < cut) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
  const k = meta.width / info.width;
  // Generous padding leaves room for the edge fade (see fadeEdges) outside the machine.
  // Where the photo runs out, the missing margin is added back as white (`extend`).
  const padX = 0.12 * (x1 - x0), padTop = 0.06 * (y1 - y0), padBottom = 0.08 * (y1 - y0);
  const want = {
    left: Math.round((x0 - padX) * k),
    top: Math.round((y0 - padTop) * k),
    right: Math.round((x1 + padX) * k),
    bottom: Math.round((y1 + padBottom) * k),
  };
  const box = {
    left: Math.max(0, want.left),
    top: Math.max(0, want.top),
    width: Math.min(meta.width, want.right) - Math.max(0, want.left),
    height: Math.min(meta.height, want.bottom) - Math.max(0, want.top),
  };
  const extend = {
    left: Math.max(0, -want.left),
    top: Math.max(0, -want.top),
    right: Math.max(0, want.right - meta.width),
    bottom: Math.max(0, want.bottom - meta.height),
  };
  return { box, extend, bg };
}

// The backdrops carry soft grey studio shadows that end in a hard rectangle at the crop.
// Screening a white edge gradient over the photo fades them out, so under multiply the
// shadow dissolves into the page instead of outlining the photo.
async function fadeEdges(extracted, w, h) {
  const grad = (id, x2, y2, stops) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const svg = (fill, defs) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>${defs}</defs><rect width="100%" height="100%" fill="url(#${fill})"/></svg>`);
  const x = svg('x', grad('x', 1, 0, [[0, '#fff'], [0.085, '#000'], [0.915, '#000'], [1, '#fff']]));
  const y = svg('y', grad('y', 0, 1, [[0, '#fff'], [0.045, '#000'], [0.94, '#000'], [1, '#fff']]));
  const base = await extracted.png({ compressionLevel: 0 }).toBuffer();
  return sharp(base).composite([
    { input: x, blend: 'screen' },
    { input: y, blend: 'screen' },
  ]);
}

// Dark tones (L < 96) are pulled toward grey, strongest in the deepest shadows, and so
// are blue-dominant pixels at any brightness (the cloth reflected in the foil and the
// black Karak pouch). No label colour on the packs is blue-dominant.
async function neutraliseShadows(extracted) {
  const { data, info } = await extracted.raw().toBuffer({ resolveWithObject: true });
  const c = info.channels;
  for (let i = 0; i < data.length; i += c) {
    const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const blue = data[i + 2] - Math.max(data[i], data[i + 1]);
    const wDark = L < 96 ? 0.9 * (1 - L / 96) : 0;
    const wBlue = blue > 0 ? Math.min(1, blue / 36) * 0.85 : 0;
    const w = Math.max(wDark, wBlue);
    if (!w) continue;
    data[i] += (L - data[i]) * w;
    data[i + 1] += (L - data[i + 1]) * w;
    data[i + 2] += (L - data[i + 2]) * w;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: c } });
}

for (const job of JOBS) {
  if (only.length && !only.includes(job.key)) continue;
  const t0 = Date.now();
  let img = job.type === 'cutout' ? null : await loadSource(job);
  const meta = img && (await img.metadata());
  let pipeline;

  if (job.type === 'cutout') {
    // Background removed, so the machine can stand on any colour (see cutout.mjs).
    pipeline = (await cutout(job.key)).pipeline;
  } else if (job.type === 'studio') {
    // The studio backdrops are already ~255, so no tonal change: brightening would
    // blow out the steel dispensing area.
    const { box, extend } = await studioBox(img, meta);
    const w = box.width + extend.left + extend.right;
    const h = box.height + extend.top + extend.bottom;
    pipeline = await fadeEdges(img.extract(box).extend({ ...extend, background: '#ffffff' }), w, h);
  } else if (job.type === 'dark') {
    const [l, t, r, b] = job.crop;
    const box = {
      left: Math.round(l * meta.width), top: Math.round(t * meta.height),
      width: Math.round((r - l) * meta.width), height: Math.round((b - t) * meta.height),
    };
    // Neutralise the blue cast the cloth leaves in the shadows, then map 34 -> 0 so the
    // backdrop drops to black.
    const a = 255 / (255 - 34);
    pipeline = (await neutraliseShadows(img.extract(box))).linear(a, -34 * a);
  } else {
    pipeline = img;
  }

  // Materialise once, then resize from the processed master.
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const master = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  const mm = await master.metadata();
  const alpha = (mm.channels ?? 3) === 4;
  const widths = job.widths.filter((w) => w <= mm.width);
  if (!widths.includes(Math.min(mm.width, job.widths.at(-1)))) widths.push(Math.min(mm.width, job.widths.at(-1)));

  for (const w of widths) {
    const base = path.join(OUT, `${job.key}-${w}`);
    const r = master.clone().resize({ width: w });
    await r.clone().avif({ quality: job.alpha || alpha ? 60 : 52, effort: 4 }).toFile(`${base}.avif`);
    await r.clone().webp({ quality: job.alpha || alpha ? 86 : 80, alphaQuality: 90 }).toFile(`${base}.webp`);
  }
  manifest[job.key] = { widths, width: mm.width, height: mm.height, ratio: +(mm.width / mm.height).toFixed(4) };
  console.log(`${job.key.padEnd(24)} ${mm.width}x${mm.height} -> [${widths.join(', ')}]  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

const manifestPath = path.join(root, 'src/content/imageManifest.json');
let existing = {};
if (only.length && existsSync(manifestPath)) existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
writeFileSync(manifestPath, JSON.stringify({ ...existing, ...manifest }, null, 2) + '\n');
console.log('manifest ->', path.relative(root, manifestPath));
