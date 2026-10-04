// Frame-pure math: easing, tweening, hashing. No Math.random, no clocks.

const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const B = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (B(t, x1, x2) < x) lo = t;
      else hi = t;
    }
    return B(t, y1, y2);
  };
};

export type Ease = (x: number) => number;
export const E = {
  linear: ((x: number) => Math.min(1, Math.max(0, x))) as Ease,
  out: bezier(0.16, 1, 0.3, 1),
  in: bezier(0.7, 0, 0.84, 0),
  io: bezier(0.65, 0, 0.35, 1),
  back: bezier(0.34, 1.56, 0.64, 1),
  soft: bezier(0.25, 0.1, 0.25, 1),
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Progress 0..1 of f between frames a and b, eased. */
export const prog = (f: number, a: number, b: number, e: Ease = E.out) => e(clamp((f - a) / (b - a)));
/** Tween v0→v1 over frames a..b. */
export const tw = (f: number, a: number, b: number, v0: number, v1: number, e: Ease = E.out) => v0 + (v1 - v0) * prog(f, a, b, e);
/** Exponential decay after a trigger frame. */
export const decay = (f: number, at: number, len: number) => (f < at ? 0 : Math.exp(-(f - at) / len));
/** 0→1→0 window: in over [a, a+i], out over [b-o, b]. */
export const win = (f: number, a: number, b: number, i = 8, o = 8, e: Ease = E.out) =>
  Math.min(prog(f, a, a + i, e), 1 - prog(f, b - o, b, E.in));
export const rad = (d: number) => (d * Math.PI) / 180;

/** Stable hash → [0,1). */
export const rnd = (...parts: Array<string | number>) => {
  let h = 2166136261;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
export const srnd = (...parts: Array<string | number>) => rnd(...parts) * 2 - 1;

/** Smooth 1D value noise, deterministic. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x), t = x - i, u = t * t * (3 - 2 * t);
  return lerp(srnd(seed, i), srnd(seed, i + 1), u);
};

export const hexRGB = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
export const rgba = (h: string, a: number) => {
  const [r, g, b] = hexRGB(h);
  return `rgba(${r},${g},${b},${clamp(a)})`;
};
export const mix = (a: string, b: string, t: number) => {
  const x = hexRGB(a), y = hexRGB(b), k = clamp(t);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(",")})`;
};
export const glsl = (h: string) => hexRGB(h).map((v) => v / 255) as [number, number, number];
