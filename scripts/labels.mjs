// Renders the printed label artwork (PDF) into pack images for the flavour scene,
// replacing the pouch photographs. Flat artwork is crisper and colour-accurate, and it
// shows the revised labels rather than older printed pouches.
//
// The PDFs are print files: each page carries crop marks and a white margin, so the
// label body is found by looking for the rows and columns that are mostly ink.
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public/img');
const REVISED = path.resolve(root, '../asset/CHAI_DEPOT_PREMIX_MARCH_REVISED.pdf');
const JAGGERY = path.resolve(root, '../finalized asset/CHAI_DEPOT_PREMIX_JAGGERY_4x6.pdf');
const WIDTHS = [360, 640, 960, 1400];

// Page order in the revised file. Page 1 is a COFFEE label: out of scope for this site.
const JOBS = [
  { key: 'label-cardamom', pdf: REVISED, page: 2 },
  { key: 'label-masala', pdf: REVISED, page: 3 },
  { key: 'label-karak', pdf: REVISED, page: 4 },
  { key: 'label-cardamom-nas', pdf: REVISED, page: 5 },
  { key: 'label-jaggery', pdf: JAGGERY, page: 1 },
];

/** Bounds of the label body: the rows and columns that are mostly not paper. */
async function labelBox(file) {
  const { data, info } = await sharp(file).resize({ width: 400 }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const inked = (i) => {
    const r = data[i * c], g = data[i * c + 1], b = data[i * c + 2];
    return r < 240 || g < 240 || b < 240 ? 1 : 0;
  };
  const rowHit = [], colHit = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) n += inked(y * w + x);
    rowHit[y] = n / w > 0.5;
  }
  for (let x = 0; x < w; x++) {
    let n = 0;
    for (let y = 0; y < h; y++) n += inked(y * w + x);
    colHit[x] = n / h > 0.5;
  }
  const first = (arr) => arr.findIndex(Boolean);
  const last = (arr) => arr.length - 1 - [...arr].reverse().findIndex(Boolean);
  return {
    left: first(colHit) / w,
    top: first(rowHit) / h,
    right: (last(colHit) + 1) / w,
    bottom: (last(rowHit) + 1) / h,
  };
}

const manifestPath = path.join(root, 'src/content/imageManifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

for (const job of JOBS) {
  if (!existsSync(job.pdf)) {
    console.log(`missing ${job.pdf}`);
    continue;
  }
  const dir = mkdtempSync(path.join(tmpdir(), 'label-'));
  const base = path.join(dir, 'page');
  execFileSync('pdftoppm', ['-r', '300', '-f', String(job.page), '-l', String(job.page), '-png', '-singlefile', job.pdf, base]);
  const png = `${base}.png`;

  const box = await labelBox(png);
  const meta = await sharp(png).metadata();
  const crop = {
    left: Math.round(box.left * meta.width),
    top: Math.round(box.top * meta.height),
    width: Math.round((box.right - box.left) * meta.width),
    height: Math.round((box.bottom - box.top) * meta.height),
  };
  const buf = await sharp(png).extract(crop).png().toBuffer();
  const mm = await sharp(buf).metadata();

  const widths = WIDTHS.filter((w) => w <= mm.width);
  for (const width of widths) {
    const out = path.join(OUT, `${job.key}-${width}`);
    const r = sharp(buf).resize({ width });
    await r.clone().avif({ quality: 62, effort: 4 }).toFile(`${out}.avif`);
    await r.clone().webp({ quality: 88 }).toFile(`${out}.webp`);
  }
  manifest[job.key] = { widths, width: mm.width, height: mm.height, ratio: +(mm.width / mm.height).toFixed(4) };
  console.log(`${job.key.padEnd(22)} page ${job.page}  ${mm.width}x${mm.height}  ratio ${manifest[job.key].ratio}`);
  rmSync(dir, { recursive: true, force: true });
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
