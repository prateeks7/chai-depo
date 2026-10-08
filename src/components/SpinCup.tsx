import { useEffect, useRef, type CSSProperties } from 'react';
import cupGeometry from '../content/cupGeometry.json';
import { images, staticImageUrl, type ImageKey } from '../content/images';
import { gsap } from '../lib/gsap';
import { Picture } from './Picture';
import s from './SpinCup.module.css';

export type CupModel = keyof typeof cupGeometry;

/**
 * What a timeline animates, shared by every SpinCup on the stage so they turn together.
 * `turn` is in radians; half a turn lands on the print again (it repeats front and back).
 */
export interface SpinState {
  turn: number;
  /** Flavour colour, 0..1 per channel. */
  r: number;
  g: number;
  b: number;
  /** 0 = the cup as photographed, 1 = its paper fully in the flavour colour. */
  amount: number;
}

/*
 * The body is redrawn from the unwrapped print (scripts/hero-cup.mjs) for any angle.
 * Every pixel is traced back to a point on the cup: the section it lies on (h) and its
 * horizontal position across it (s). Sections are ellipses whose depth depends on h, so
 * the two depend on each other; a few fixed-point steps settle them, because the
 * ellipses are shallow. recolour() and shade() must match hero-cup.mjs exactly.
 */
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uWrap;
uniform sampler2D uMask;
uniform vec2 uBox;
uniform vec4 uY;      // y0, y1, cx0, cx1
uniform vec4 uA;      // a0, a1, k0, k1
uniform float uTurn;
uniform vec3 uTint;
uniform float uAmount;
uniform float uPx;    // photo pixels per canvas pixel
uniform vec4 uShade;  // light across the cup: a cubic in s, left edge -1 .. right edge 1
uniform float uPaperL; // the paper's brightness, unlit

const float PI = 3.14159265;

float shade(float s) { return uShade.x + s * (uShade.y + s * (uShade.z + s * uShade.w)); }
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// The paper becomes the flavour colour and the print a proportionally darker shade of it.
vec3 recolour(vec3 c, vec3 body, float amount) {
  return mix(c, body * min(1.0, lum(c) / uPaperL), amount);
}

void main() {
  vec2 p = vUv * uBox;
  float span = uY.y - uY.x;
  float h = (p.y - uY.x) / span;
  float s = 0.0;
  float a = uA.x;
  for (int i = 0; i < 4; i++) {
    float hh = clamp(h, 0.0, 1.0);
    a = mix(uA.x, uA.y, hh);
    float k = mix(uA.z, uA.w, hh);
    s = (p.x - mix(uY.z, uY.w, hh)) / a;
    h = (p.y - k * a * sqrt(max(0.0, 1.0 - s * s)) - uY.x) / span;
  }
  // Anti-aliased against the sides and the base; above h = 0 is under the lid layer,
  // so a little is drawn there to meet it and nothing beyond.
  float cover = clamp(min((1.0 - abs(s)) * a, (1.0 - h) * span) / uPx, 0.0, 1.0) * step(-0.06, h);
  if (cover <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  s = clamp(s, -1.0, 1.0);
  vec2 tc = vec2((asin(s) + uTurn) / PI + 0.5, clamp(h, 0.0, 1.0));
  float maskV = texture2D(uMask, tc).r;
  vec3 c = recolour(texture2D(uWrap, tc).rgb, uTint, uAmount * maskV) * shade(s);
  gl_FragColor = vec4(c * cover, cover);
}`;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader failed');
  return sh;
}

interface SpinCupProps {
  model: CupModel;
  state: SpinState;
  /** Whether this cup takes the flavour colour (`state.amount`); otherwise always as photographed. */
  recolour?: boolean;
  className?: string;
  /** Extra attributes for the wrapper, e.g. a data hook for a timeline. */
  data?: Record<string, string>;
}

/**
 * A takeaway cup, turning. Desktop flavour scene only; everywhere else uses the static
 * ChaiCup. Until the texture is in (or if WebGL is unavailable) the still cup stands in,
 * so there is never an empty frame.
 */
export function SpinCup({ model, state, recolour = false, className, data }: SpinCupProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const geometry = cupGeometry[model];

  useEffect(() => {
    const el = canvas.current;
    const host = box.current;
    if (!el || !host) return;
    const gl = el.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    let disposed = false;
    let ready = false;
    let last = '';
    const [bw, bh] = geometry.box;

    const prog = gl.createProgram()!;
    try {
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link failed');
    } catch (e) {
      console.warn('SpinCup: falling back to the still cup', e);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    gl.uniform2f(u('uBox'), bw, bh);
    gl.uniform4f(u('uY'), geometry.y0, geometry.y1, geometry.cx0, geometry.cx1);
    gl.uniform4f(u('uA'), geometry.a0, geometry.a1, geometry.k0, geometry.k1);
    const [s0, s1, s2, s3] = geometry.shade;
    gl.uniform4f(u('uShade'), s0, s1, s2, s3);
    gl.uniform1f(u('uPaperL'), geometry.paperL);
    gl.uniform1i(u('uWrap'), 0);
    gl.uniform1i(u('uMask'), 1);
    const uTurn = u('uTurn'), uTint = u('uTint'), uAmount = u('uAmount'), uPx = u('uPx');

    // The canvas is resized from a ResizeObserver, never measured per frame: reading
    // clientWidth on every tick forces a layout, and with a cup on screen that is a
    // layout per frame, per cup.
    let cssWidth = 0;
    let cssHeight = 0;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentBoxSize?.[0];
      cssWidth = box ? box.inlineSize : entry.contentRect.width;
      cssHeight = box ? box.blockSize : entry.contentRect.height;
      size();
      draw();
    });
    observer.observe(host);

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(cssWidth * dpr));
      const h = Math.max(1, Math.round(cssHeight * dpr));
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform1f(uPx, bw / w);
        last = '';
      }
    };

    const draw = () => {
      if (!ready || !el.width) return;
      const amount = recolour ? state.amount : 0;
      const key = `${state.turn.toFixed(4)}|${state.r.toFixed(3)}|${state.g.toFixed(3)}|${state.b.toFixed(3)}|${amount.toFixed(3)}|${el.width}`;
      if (key === last) return;
      last = key;
      gl.uniform1f(uTurn, state.turn);
      gl.uniform3f(uTint, state.r, state.g, state.b);
      gl.uniform1f(uAmount, amount);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const textures: WebGLTexture[] = [];
    const texture = (unit: number, img: HTMLImageElement, format: number) => {
      const t = gl.createTexture()!;
      textures.push(t);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, img);
      // Both textures are powers of two, so they can repeat round the cup and mipmap.
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    // Phones get the smaller strip: a quarter of the pixels to decode and upload.
    const small = window.matchMedia('(max-width: 899px)').matches;
    Promise.all([
      loadImage(staticImageUrl(`cup-${model}-wrap${small ? '-sm' : ''}.webp`)),
      loadImage(staticImageUrl(`cup-${model}-mask.png`)),
    ])
      .then(([wrap, mask]) => {
        if (disposed) return;
        texture(0, wrap, gl.RGB);
        texture(1, mask, gl.LUMINANCE);
        ready = true;
        draw();
        host.dataset.ready = 'true';
      })
      .catch((e) => console.warn('SpinCup: texture failed, keeping the still cup', e));

    // Redraw only when something changed; the ticker is already running for ScrollTrigger.
    gsap.ticker.add(draw);
    return () => {
      disposed = true;
      gsap.ticker.remove(draw);
      delete host.dataset.ready;
      // Free what this effect made, but never lose the context itself: the canvas outlives
      // the effect (React runs effects twice in development), and getContext() on it
      // would hand the next run the same, dead context.
      observer.disconnect();
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [model, state, recolour, geometry]);

  return (
    <div
      ref={box}
      className={[s.spin, className].filter(Boolean).join(' ')}
      style={{ '--ratio': images[`cup-${model}` as ImageKey].ratio } as CSSProperties}
      aria-hidden="true"
      {...data}
    >
      <Picture name={`cup-${model}` as ImageKey} alt="" sizes="300px" imgClassName={s.still} />
      <canvas ref={canvas} className={s.canvas} />
      <Picture name={`cup-${model}-lid` as ImageKey} alt="" sizes="300px" imgClassName={s.lid} />
    </div>
  );
}
