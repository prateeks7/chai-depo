// Builds the two takeaway cups from the generated photographs in ../gemini, each as a
// still and as a cup the flavour scene can spin (components/SpinCup.tsx).
//
//   garden   the tea-garden printed cup, as photographed. The hero, the promises, premix
//            supply, and every still that is not about one flavour.
//   branded  the plain branded cup, its paper recoloured to each flavour (palette.cup).
//            The roundel — the dark disc, the gold ring, "Chai Depot" — is masked out of
//            the recolouring (see `roundel` below) and stays exactly as photographed. The
//            flavour chapters.
//
// For each: cup-<model> (still), cup-<model>-lid (the lid alone, drawn over the spinning
// body), cup-<model>-wrap.webp (the print unwrapped into a strip) and cup-<model>-mask.png
// (where that strip may be recoloured — see `roundel`); the branded cup also gets
// cup-branded-<flavour> stills. Measurements go to src/content/cupGeometry.json.
//
// The recolouring and the shading model live here and in SpinCup's shader and must stay
// identical, or the cup jumps when the page swaps the spinning cup for a still one.
import sharp from 'sharp';
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GEMINI = path.resolve(root, '../gemini');
const OUT = path.join(root, 'public/img');
const WIDTHS = [320, 480, 640, 960];

/** Same values as palette.cup in src/content/flavours.ts. */
const TINTS = {
  cardamom: '#92a452',
  'cardamom-nas': '#b8c088',
  jaggery: '#a96830',
  masala: '#ad2622',
  karak: '#c9a228',
};

/**
 * Each cup's body is a cone seen from a little above: every height is a circle that
 * projects to an ellipse (centre height yc, half-width a, depth b = k·a), opening up
 * toward the base because the camera is nearer the lid. h = 0 is a section hidden just
 * under the lid, h = 1 the base. All in pixels of the source photograph.
 *
 * gap: how the half of the cup the photo never saw is filled. The strip covers half a
 *      turn and repeats, so the front print appears front and back; beyond ±72° the photo
 *      is too foreshortened, and that band is either mirrored landscape ('mirror', clear
 *      of the roundel) or the paper's own tone ('paper').
 *
 * roundel: a region (in source pixels) excluded from recolouring — the dark disc, gold
 *          ring and "Chai Depot" lettering, kept exactly as photographed. Everything else
 *          on the body is plain paper and takes the flavour colour.
 */
const MODELS = {
  garden: {
    file: 'Gemini_Generated_Image_90a4q990a4q990a4.jpeg',
    BODY: { y0: 500, y1: 1823, cx0: 1075, cx1: 1080, a0: 545.4, a1: 397.7, k0: 0.12, k1: 0.232 },
    lidEdge: (x) => 566 - 32 * ((x - 1076) / 475) ** 2,
    gap: 'mirror',
    phiMax: 72,
    // Light falls off evenly toward both edges; this shape, fitted as a cubic in s.
    shade: fitCubic((s) => 0.45 + 0.55 * (1 - s * s) ** 0.4),
  },
  branded: {
    // The plain branded cup (…mriah3mriah3mria.jpeg) with hatching and a small drawn cup
    // added over it: the same photograph underneath, silhouette and paper within a few
    // pixels and levels, so the body and lid measurements are the plain cup's.
    file: 'Gemini_Generated_Image_5zw4it5zw4it5zw4.jpeg',
    // Its white backdrop is JPEG noise at 248–252 — the same levels as the lid's
    // highlights — so no threshold separates them. The plain photo's backdrop is a clean
    // 255, so the cut-out shape is taken from that.
    maskFile: 'Gemini_Generated_Image_mriah3mriah3mria.jpeg',
    BODY: { y0: 660, y1: 2140, cx0: 854.3, cx1: 858.5, a0: 592.9, a1: 435.1, k0: 0.116, k1: 0.2446 },
    lidEdge: (x) => 730 - 31 * ((x - 856) / 494) ** 2,
    gap: 'mirror',
    // The small drawn cup reaches the right edge, so mirroring that edge into the back
    // would draw it twice, facing itself. Fill the back from the left edge's hatching
    // only, bounced back and forth within the 16° clear of the roundel.
    mirrorFrom: 'left',
    mirrorWidth: 16,
    phiMax: 72,
    // The light, fitted on the plain cup's bare paper. Measuring it here would count the
    // edge hatching as shadow.
    shade: [0.74847, 0.35297, 0.03224, -0.13347],
    // The disc (radius ~393) and the outer edge of its gold ring (417–421).
    roundel: { cx: 855, cy: 1316.5, rx: 418, ry: 421 },
    tints: TINTS,
  },
};

const WRAP_W = 2048;
const WRAP_H = 1024;

/**
 * A thin dark rim right at the cutout edge (see toRgba). The photo's own anti-aliasing
 * against the white backdrop leaves a pale sliver a couple of pixels wide that no
 * threshold fully removes; overriding it to a dark colour instead reads as an
 * intentional keyline, and every cup sits on a near-black stage, so it all but
 * disappears there and only shows as a clean edge against anything lighter.
 */
const BORDER_PX = 5;
const BORDER_RGB = [0.043, 0.029, 0.024];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const clamp8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Least-squares cubic through (s, f(s)) for s in -0.98..0.98, normalised to peak at 1. */
function fitCubic(f, samples) {
  const pts = samples ?? Array.from({ length: 99 }, (_, i) => -0.98 + i * 0.02).map((s) => [s, f(s)]);
  const P = 4;
  const A = Array.from({ length: P }, () => new Array(P).fill(0));
  const B = new Array(P).fill(0);
  for (const [x, y] of pts)
    for (let i = 0; i < P; i++) {
      B[i] += y * x ** i;
      for (let j = 0; j < P; j++) A[i][j] += x ** (i + j);
    }
  for (let i = 0; i < P; i++) {
    const piv = A[i][i];
    for (let j = i; j < P; j++) A[i][j] /= piv;
    B[i] /= piv;
    for (let r = 0; r < P; r++) {
      if (r === i) continue;
      const k = A[r][i];
      for (let j = i; j < P; j++) A[r][j] -= k * A[i][j];
      B[r] -= k * B[i];
    }
  }
  let peak = 0;
  for (let s = -1; s <= 1; s += 0.01) peak = Math.max(peak, B[0] + B[1] * s + B[2] * s * s + B[3] * s * s * s);
  return B.map((c) => c / peak);
}

/**
 * The recolouring, on unlit colour (0..1). Mirrored in SpinCup's shader. Each pixel keeps
 * its brightness relative to the paper: the paper becomes the flavour colour and the print
 * (darker than the paper) a proportionally darker shade of it. Nothing goes above the
 * paper tone — matte paper has no highlights, and near the edges, where the light model
 * is least exact, lifting would show as pale blotches.
 */
function recolour(rgb, body, paperL, amount) {
  if (amount <= 0) return rgb;
  const k = Math.min(1, lum(...rgb) / paperL);
  return rgb.map((c, i) => c + (body[i] * k - c) * amount);
}

// ---- Cut-out and output, shared by both cups ------------------------------------------

/**
 * Floods the white backdrop from the border, pulls the edge in past the photo's own
 * anti-aliasing and repaints that band with colour from just inside (see README), and
 * crops to the cup.
 */
async function cutout(file, maskFile) {
  const { data: src, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  // The shape can come from another photograph of the same cup (see `maskFile`).
  const shape = maskFile ? (await sharp(maskFile).removeAlpha().raw().toBuffer({ resolveWithObject: true })) : { data: src, info };
  if (shape.info.width !== W || shape.info.height !== H) throw new Error(`${maskFile} is not the same size as ${file}`);
  const bg = new Uint8Array(W * H);
  // The backdrops are pure 255. The lid's rim highlight reaches 248–252 right where it
  // meets the backdrop, so anything looser floods a channel into the lid.
  const white = (i) => Math.min(shape.data[i * 3], shape.data[i * 3 + 1], shape.data[i * 3 + 2]) >= 253;
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !white(i)) continue;
    bg[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < W * (H - 1)) stack.push(i + W);
  }
  // Specks of backdrop noise just under that threshold survive as tiny islands; keep
  // only the largest connected shape, which is the cup.
  {
    const label = new Int32Array(W * H);
    let best = 0, bestSize = 0, next = 0;
    for (let start = 0; start < W * H; start++) {
      if (bg[start] || label[start]) continue;
      next++;
      let size = 0;
      const q = [start];
      label[start] = next;
      while (q.length) {
        const i = q.pop();
        size++;
        const x = i % W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
          if (j < 0 || j >= W * H || bg[j] || label[j]) continue;
          label[j] = next;
          q.push(j);
        }
      }
      if (size > bestSize) (bestSize = size), (best = next);
    }
    for (let i = 0; i < W * H; i++) if (!bg[i] && label[i] !== best) bg[i] = 1;
  }
  const dist = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) dist[i] = bg[i] ? 0 : 1e9;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!dist[i]) continue;
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - W] + 1);
      if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - W - 1] + Math.SQRT2);
      if (x < W - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - W + 1] + Math.SQRT2);
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!dist[i]) continue;
      if (x < W - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      if (y < H - 1) dist[i] = Math.min(dist[i], dist[i + W] + 1);
      if (x < W - 1 && y < H - 1) dist[i] = Math.min(dist[i], dist[i + W + 1] + Math.SQRT2);
      if (x > 0 && y < H - 1) dist[i] = Math.min(dist[i], dist[i + W - 1] + Math.SQRT2);
    }
  const alpha = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = clamp8(((dist[i] - 2) / 1.5) * 255);

  const colour = new Float32Array(W * H * 3);
  for (let i = 0; i < W * H * 3; i++) colour[i] = src[i];
  let known = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) known[i] = dist[i] >= 4 ? 1 : 0;
  for (let pass = 0; pass < 8; pass++) {
    const next = known.slice();
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (known[i] || alpha[i] === 0) continue;
        let n = 0, r = 0, g = 0, b = 0;
        for (const j of [i - 1, i + 1, i - W, i + W]) {
          if (!known[j]) continue;
          n++;
          r += colour[j * 3];
          g += colour[j * 3 + 1];
          b += colour[j * 3 + 2];
        }
        if (!n) continue;
        colour[i * 3] = r / n;
        colour[i * 3 + 1] = g / n;
        colour[i * 3 + 2] = b / n;
        next[i] = 1;
      }
    known = next;
  }

  let bx0 = W, by0 = H, bx1 = 0, by1 = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (alpha[y * W + x]) {
        bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x);
        by0 = Math.min(by0, y); by1 = Math.max(by1, y);
      }
  const box = { left: Math.max(0, bx0 - 2), top: Math.max(0, by0 - 2) };
  box.width = Math.min(W, bx1 + 3) - box.left;
  box.height = Math.min(H, by1 + 3) - box.top;
  return { W, H, colour, alpha, dist, box };
}

/** RGBA of the cropped cup; `shadeRgb(x, y, rgb01)` may recolour each pixel. */
function toRgba({ W, colour, alpha, dist, box }, shadeRgb) {
  const out = Buffer.alloc(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++)
    for (let x = 0; x < box.width; x++) {
      const sx = x + box.left, sy = y + box.top;
      const i = sy * W + sx, o = (y * box.width + x) * 4;
      let rgb = [colour[i * 3] / 255, colour[i * 3 + 1] / 255, colour[i * 3 + 2] / 255];
      if (shadeRgb && alpha[i]) rgb = shadeRgb(sx, sy, rgb);
      if (alpha[i] && dist[i] < BORDER_PX) {
        const t = smooth(0, BORDER_PX, dist[i]);
        rgb = rgb.map((c, k) => c + (BORDER_RGB[k] - c) * (1 - t));
      }
      out[o] = clamp8(rgb[0] * 255);
      out[o + 1] = clamp8(rgb[1] * 255);
      out[o + 2] = clamp8(rgb[2] * 255);
      out[o + 3] = alpha[i];
    }
  return out;
}

const manifestPath = path.join(root, 'src/content/imageManifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

async function emit(key, box, rgba) {
  const master = sharp(rgba, { raw: { width: box.width, height: box.height, channels: 4 } });
  const ws = WIDTHS.filter((w) => w <= box.width);
  for (const width of ws) {
    const base = path.join(OUT, `${key}-${width}`);
    const r = master.clone().resize({ width });
    await r.clone().avif({ quality: 64, effort: 4 }).toFile(`${base}.avif`);
    await r.clone().webp({ quality: 90, alphaQuality: 95 }).toFile(`${base}.webp`);
  }
  manifest[key] = { widths: ws, width: box.width, height: box.height, ratio: +(box.width / box.height).toFixed(4) };
  console.log(`${key.padEnd(24)} ${box.width}x${box.height} -> [${ws.join(', ')}]`);
}


const geometry = {};

for (const [name, M] of Object.entries(MODELS)) {
  const cup = await cutout(path.join(GEMINI, M.file), M.maskFile && path.join(GEMINI, M.maskFile));
  const { W, H, colour } = cup;
  const { BODY, lidEdge } = M;

  const section = (h) => {
    const a = BODY.a0 + (BODY.a1 - BODY.a0) * h;
    return { yc: BODY.y0 + (BODY.y1 - BODY.y0) * h, cx: BODY.cx0 + (BODY.cx1 - BODY.cx0) * h, a, k: BODY.k0 + (BODY.k1 - BODY.k0) * h };
  };
  /** Where the surface point (phi, h) lands on the photo. */
  const project = (phi, h) => {
    const c = section(h);
    return [c.cx + c.a * Math.sin(phi), c.yc + c.k * c.a * Math.cos(phi)];
  };
  /** The inverse, as in the shader: the section h and horizontal position s under a pixel. */
  const surfaceAt = (x, y) => {
    const span = BODY.y1 - BODY.y0;
    let h = (y - BODY.y0) / span, s = 0;
    for (let i = 0; i < 4; i++) {
      const c = section(Math.min(1, Math.max(0, h)));
      s = (x - c.cx) / c.a;
      h = (y - c.k * c.a * Math.sqrt(Math.max(0, 1 - s * s)) - BODY.y0) / span;
    }
    return { h, s: Math.max(-1, Math.min(1, s)) };
  };
  const bilinear = (x, y) => {
    const x0 = Math.max(0, Math.min(W - 2, Math.floor(x)));
    const y0 = Math.max(0, Math.min(H - 2, Math.floor(y)));
    const fx = x - x0, fy = y - y0;
    const px = (xx, yy, c) => colour[(yy * W + xx) * 3 + c];
    return [0, 1, 2].map(
      (c) =>
        ((px(x0, y0, c) * (1 - fx) + px(x0 + 1, y0, c) * fx) * (1 - fy) +
          (px(x0, y0 + 1, c) * (1 - fx) + px(x0 + 1, y0 + 1, c) * fx) * fy) /
        255,
    );
  };

  // Light across the cup, as a cubic in s: given, or measured on plain paper.
  const SHADE =
    M.shade ??
    fitCubic(null, (() => {
      const pts = [];
      for (let s = -0.96; s <= 0.961; s += 0.02) {
        let acc = 0, n = 0;
        for (const [ya, yb] of M.shadeBands)
          for (let y = ya; y <= yb; y += 3) {
            const c = section(Math.min(1, Math.max(0, (y - BODY.y0) / (BODY.y1 - BODY.y0))));
            acc += lum(...bilinear(c.cx + s * c.a, y));
            n++;
          }
        pts.push([s, acc / n]);
      }
      return pts;
    })());
  const shade = (s) => SHADE[0] + SHADE[1] * s + SHADE[2] * s * s + SHADE[3] * s * s * s;
  const onBody = (x, y) => smooth(lidEdge(x) - 2, lidEdge(x) + 2, y);
  /**
   * 0 inside the roundel, 1 outside, feathered over a few pixels at its edge so the ring's
   * own soft rim blends into the flavour colour instead of leaving a line of bare paper.
   */
  const outsideRoundel = M.roundel
    ? (x, y) => {
        const r = Math.hypot((x - M.roundel.cx) / M.roundel.rx, (y - M.roundel.cy) / M.roundel.ry);
        const f = 2.5 / M.roundel.rx;
        return smooth(1 - f, 1 + f, r);
      }
    : () => 1;
  /** 1 where a pixel may recolour (plain paper on the body), 0 on the lid and the roundel. */
  const paperWeight = (x, y) => onBody(x, y) * outsideRoundel(x, y);

  /** Unlit colour of the photo at a surface point. */
  const albedo = (phi, h) => {
    const [x, y] = project(phi, h);
    return {
      rgb: bilinear(x, y).map((c) => c / shade(Math.sin(phi))),
      hidden: y < lidEdge(x) + 3,
      mask: paperWeight(x, y),
    };
  };

  // The paper's brightness, unlit: the bright end of the body, which skips the print.
  const bodyLums = [];
  for (let h = 0.05; h < 0.97; h += 0.01)
    for (let deg = -60; deg <= 60; deg += 2) bodyLums.push(lum(...albedo((deg * Math.PI) / 180, h).rgb));
  bodyLums.sort((a, b) => a - b);
  const PAPER_L = bodyLums[Math.floor(bodyLums.length * 0.8)];

  // ---- Stills
  await emit(`cup-${name}`, cup.box, toRgba(cup));
  for (const [id, tint] of Object.entries(M.tints ?? {})) {
    const body = hex(tint);
    await emit(
      `cup-${name}-${id}`,
      cup.box,
      toRgba(cup, (x, y, rgb) => {
        const k = shade(surfaceAt(x, y).s);
        return recolour(rgb.map((c) => c / k), body, PAPER_L, paperWeight(x, y)).map((c) => c * k);
      }),
    );
  }
  const lid = toRgba(cup);
  for (let y = 0; y < cup.box.height; y++)
    for (let x = 0; x < cup.box.width; x++) {
      const o = (y * cup.box.width + x) * 4 + 3;
      lid[o] = clamp8(lid[o] * (1 - onBody(x + cup.box.left, y + cup.box.top)));
    }
  await emit(`cup-${name}-lid`, cup.box, lid);

  // ---- The strip: u across the half-turn (-90°..90°), v down the body.
  // Paper tone per row, from the bright end of the photographed band (skips the print).
  const rowPaper = Array.from({ length: WRAP_H }, (_, v) => {
    const h = (v + 0.5) / WRAP_H;
    const px = [];
    for (let deg = -60; deg <= 60; deg += 2) {
      const a = albedo((deg * Math.PI) / 180, h);
      if (!a.hidden) px.push(a.rgb);
    }
    if (!px.length) return null;
    px.sort((p, q) => lum(...q) - lum(...p));
    const top = px.slice(0, Math.max(1, Math.round(px.length * 0.4)));
    return [0, 1, 2].map((i) => top.reduce((sum, p) => sum + p[i], 0) / top.length);
  });
  for (let v = WRAP_H - 2; v >= 0; v--) if (!rowPaper[v]) rowPaper[v] = rowPaper[v + 1];

  const PHI_MAX = (M.phiMax * Math.PI) / 180;
  const BLEND = ((M.blend ?? 0) * Math.PI) / 180;
  const GAP = Math.PI - 2 * PHI_MAX;
  const wrap = Buffer.alloc(WRAP_W * WRAP_H * 3);
  const mask = Buffer.alloc(WRAP_W * WRAP_H);
  for (let u = 0; u < WRAP_W; u++) {
    const phi = ((u + 0.5) / WRAP_W) * Math.PI - Math.PI / 2;
    const seen = Math.abs(phi) <= PHI_MAX;
    let samples = null;
    if (!seen && M.gap === 'mirror') {
      const g = phi > 0 ? phi - PHI_MAX : phi + Math.PI - PHI_MAX; // 0..GAP from the right edge
      if (M.mirrorFrom === 'left') {
        // Back from the next band's left edge, ping-ponging within its clear strip, so it
        // meets that edge seamlessly; eased in from this band's right edge over 4°.
        const band = (M.mirrorWidth * Math.PI) / 180;
        const d = (GAP - g) % (2 * band);
        const w = smooth(0, (4 * Math.PI) / 180, g);
        samples = [
          { phi: PHI_MAX - g, w: 1 - w },
          { phi: -PHI_MAX + (d < band ? d : 2 * band - d), w },
        ];
      } else {
        const w = smooth(GAP * 0.4, GAP * 0.6, g);
        samples = [
          { phi: PHI_MAX - g, w: 1 - w }, // this band's right edge, mirrored
          { phi: -PHI_MAX + (GAP - g), w }, // the next band's left edge, mirrored
        ];
      }
    }
    const fade = M.gap === 'paper' ? smooth(PHI_MAX - BLEND, PHI_MAX, Math.abs(phi)) : 0;
    let lastGood = null;
    // bottom-up, so texels hidden under the lid inherit the first visible one below
    for (let v = WRAP_H - 1; v >= 0; v--) {
      const h = (v + 0.5) / WRAP_H;
      let rgb, m;
      if (seen || samples) {
        let hidden = false;
        rgb = [0, 0, 0];
        m = 0;
        for (const smp of samples ?? [{ phi, w: 1 }]) {
          if (smp.w === 0) continue;
          const a = albedo(smp.phi, h);
          hidden ||= a.hidden;
          rgb = rgb.map((c, i) => c + a.rgb[i] * smp.w);
          m += a.mask * smp.w;
        }
        if (hidden && lastGood) [rgb, m] = [lastGood.rgb, lastGood.mask];
        else lastGood = { rgb, mask: m };
        if (fade > 0) {
          rgb = rgb.map((c, i) => c + (rowPaper[v][i] - c) * fade);
          m = m + (1 - m) * fade; // the paper fallback is always recolourable
        }
      } else {
        rgb = rowPaper[v];
        m = 1;
      }
      const o3 = (v * WRAP_W + u) * 3;
      wrap[o3] = clamp8(rgb[0] * 255);
      wrap[o3 + 1] = clamp8(rgb[1] * 255);
      wrap[o3 + 2] = clamp8(rgb[2] * 255);
      mask[v * WRAP_W + u] = clamp8(m * 255);
    }
  }
  await sharp(wrap, { raw: { width: WRAP_W, height: WRAP_H, channels: 3 } }).webp({ quality: 90 }).toFile(path.join(OUT, `cup-${name}-wrap.webp`));
  await sharp(mask, { raw: { width: WRAP_W, height: WRAP_H, channels: 1 } })
    .resize(512, 256)
    .toColourspace('b-w')
    .png()
    .toFile(path.join(OUT, `cup-${name}-mask.png`));

  geometry[name] = {
    box: [cup.box.width, cup.box.height],
    y0: BODY.y0 - cup.box.top, y1: BODY.y1 - cup.box.top,
    cx0: BODY.cx0 - cup.box.left, cx1: BODY.cx1 - cup.box.left,
    a0: BODY.a0, a1: BODY.a1,
    k0: BODY.k0, k1: BODY.k1,
    shade: SHADE.map((c) => +c.toFixed(5)),
    paperL: +PAPER_L.toFixed(4),
  };
  console.log(name, 'shade', geometry[name].shade, 'paperL', geometry[name].paperL);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(path.join(root, 'src/content/cupGeometry.json'), JSON.stringify(geometry, null, 2) + '\n');
