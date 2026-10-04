// 2D canvas plumbing: pooled offscreen layers, compositing, tracked text, draw-on paths.
import { W, H } from "../timeline.ts";
import { clamp, rgba } from "./math.ts";

export type Ctx = CanvasRenderingContext2D;

export const mk = (w: number, h: number, fn?: (x: Ctx, c: HTMLCanvasElement) => void) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  fn?.(x, c);
  return c;
};

const pool: HTMLCanvasElement[] = [];
/** Fresh, cleared offscreen layer #i (full frame). */
export const layer = (i: number): [HTMLCanvasElement, Ctx] => {
  if (!pool[i]) pool[i] = mk(W, H);
  const c = pool[i], x = c.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.filter = "none";
  x.globalCompositeOperation = "source-over";
  x.shadowBlur = 0;
  x.shadowColor = "transparent";
  x.letterSpacing = "0px";
  x.clearRect(0, 0, W, H);
  return [c, x];
};

export interface CompOpts { alpha?: number; blur?: number; scale?: number; ox?: number; oy?: number; dx?: number; dy?: number; rot?: number; op?: GlobalCompositeOperation }
export const comp = (dst: Ctx, src: CanvasImageSource, o: CompOpts = {}) => {
  const { alpha = 1, blur = 0, scale = 1, ox = W / 2, oy = H / 2, dx = 0, dy = 0, rot = 0, op = "source-over" } = o;
  if (alpha <= 0.002) return;
  dst.save();
  dst.globalAlpha *= alpha;
  dst.globalCompositeOperation = op;
  if (blur > 0.05) dst.filter = `blur(${blur.toFixed(2)}px)`;
  dst.translate(ox + dx, oy + dy);
  if (rot) dst.rotate(rot);
  dst.scale(scale, scale);
  dst.translate(-ox, -oy);
  dst.drawImage(src, 0, 0);
  dst.restore();
};

export interface TxtOpts { ls?: number; align?: "left" | "center" | "right"; base?: CanvasTextBaseline; alpha?: number; glow?: number; glowC?: string }
/** Text with tracking; returns the visual width. */
export const txt = (x: Ctx, s: string, px: number, py: number, font: string, color: string | CanvasGradient, o: TxtOpts = {}) => {
  const { ls = 0, align = "left", base = "alphabetic", alpha = 1, glow = 0, glowC } = o;
  x.save();
  x.font = font;
  x.letterSpacing = `${ls}px`;
  x.textBaseline = base;
  x.textAlign = "left";
  x.fillStyle = color;
  x.globalAlpha *= clamp(alpha);
  if (glow) {
    x.shadowColor = glowC ?? (typeof color === "string" ? color : "#fff");
    x.shadowBlur = glow;
  }
  const w = x.measureText(s).width - (s.length ? ls : 0);
  const sx = align === "center" ? px - w / 2 : align === "right" ? px - w : px;
  if (alpha > 0.002) x.fillText(s, sx, py);
  x.restore();
  return w;
};
export const textW = (x: Ctx, s: string, font: string, ls = 0) => {
  x.save();
  x.font = font;
  x.letterSpacing = `${ls}px`;
  const w = x.measureText(s).width - (s.length ? ls : 0);
  x.restore();
  return w;
};
export const charW = (x: Ctx, ch: string, font: string) => {
  x.save();
  x.font = font;
  x.letterSpacing = "0px";
  const w = x.measureText(ch).width;
  x.restore();
  return w;
};

/** A polyline with cumulative lengths, drawable to any fraction. */
export class Poly {
  pts: Array<[number, number]>;
  cum: number[];
  len: number;
  constructor(pts: Array<[number, number]>) {
    this.pts = pts;
    this.cum = [0];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      this.cum.push(this.cum[i - 1] + Math.hypot(bx - ax, by - ay));
    }
    this.len = this.cum[this.cum.length - 1];
  }
  /** Point at distance d along the line. */
  at(d: number): [number, number] {
    d = clamp(d, 0, this.len);
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < d) i++;
    const t = (d - this.cum[i - 1]) / Math.max(1e-6, this.cum[i] - this.cum[i - 1]);
    const [ax, ay] = this.pts[i - 1], [bx, by] = this.pts[i];
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  }
  /** Stroke the portion between fractions a..b. */
  stroke(x: Ctx, a: number, b: number) {
    if (b <= a) return;
    const da = a * this.len, db = b * this.len;
    x.beginPath();
    const p0 = this.at(da);
    x.moveTo(p0[0], p0[1]);
    for (let i = 1; i < this.pts.length; i++) {
      if (this.cum[i] <= da) continue;
      if (this.cum[i] >= db) break;
      x.lineTo(this.pts[i][0], this.pts[i][1]);
    }
    const p1 = this.at(db);
    x.lineTo(p1[0], p1[1]);
    x.stroke();
  }
}

/** Sample a circle/arc as a Poly (for compass draw-ons). */
export const arcPoly = (cx: number, cy: number, r: number, a0: number, a1: number, n = 96) =>
  new Poly(Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
  }));

/** Soft radial glow. */
export const glow = (x: Ctx, cx: number, cy: number, r: number, col: string, a: number) => {
  if (a <= 0.002) return;
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
};

/** Vertical bronze fill for display type. */
export const bronzeFill = (x: Ctx, top: number, bottom: number) => {
  const g = x.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, "#F6E3BF");
  g.addColorStop(0.35, "#D9A25E");
  g.addColorStop(0.72, "#C4873B");
  g.addColorStop(1, "#8E5E26");
  return g;
};
