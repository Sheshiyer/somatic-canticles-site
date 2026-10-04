// Scene 6 — Resolve (f810–899). Coming through the drop cap, the sigil arrives scaled up
// and settles as its strokes draw on. The SOMATIC CANTICLES wordmark resolves from the
// centre outward; tagline and URL land; everything is settled from CUE.settled to the end.
import { CUE, S, W } from "../timeline.ts";
import { C, FONT } from "../tokens.ts";
import { E, clamp, lerp, prog, rgba } from "../lib/math.ts";
import { type Ctx, Poly, bronzeFill, charW, glow, txt } from "../lib/canvas.ts";
import { EYEBROW, URL } from "../copy.ts";
import { capOverlay } from "./page.ts";

const SIG = { cx: W / 2, cy: 360, size: 220 };
const tri = (pts: Array<[number, number]>) => new Poly([...pts, pts[0]]);
// favicon.svg geometry (64-unit box)
const OUTER = tri([[32, 5], [60, 56], [4, 56]]);
const INNER = tri([[32, 24], [45, 48], [19, 48]]);

export function resolve(x: Ctx, f: number) {
  const t = f - S.resolve;
  // the drop cap from the page dissolves into the sigil (match cut through the letter)
  capOverlay(x, f);
  // sigil: starts at frame centre near the T's size, then shrinks up into place while drawing on
  const k = prog(t, 4, 28, E.io);
  const sc = lerp(2.2, 1, k) * (SIG.size / 64);
  x.save();
  x.translate(SIG.cx, lerp(540, SIG.cy, k));
  x.scale(sc, sc);
  x.translate(-32, -32);
  x.lineJoin = "round";
  x.lineCap = "round";
  x.strokeStyle = C.bronze;
  x.lineWidth = 3.4;
  OUTER.stroke(x, 0, prog(t, 0, 12, E.out));
  x.lineWidth = 2.4;
  x.strokeStyle = C.bronzeBright;
  INNER.stroke(x, 0, prog(t, 6, 20, E.out));
  const dp = E.back(clamp((t - 18) / 10));
  if (dp > 0) {
    x.fillStyle = C.bronzeBright;
    x.beginPath();
    x.arc(32, 40, 3 * dp, 0, Math.PI * 2);
    x.fill();
  }
  x.restore();
  glow(x, SIG.cx, lerp(540, SIG.cy, k) + 30, 260, C.bronze, 0.14 * prog(t, 14, 34) + 0.05 * prog(t, 0, 10));

  // wordmark: letters resolve from the centre outward
  const WORD = "SOMATIC CANTICLES";
  const font = `700 104px ${FONT.display}`;
  const trk = 14;
  const ws = WORD.split("").map((ch) => charW(x, ch, font));
  const total = ws.reduce((a, b) => a + b, 0) + trk * (WORD.length - 1);
  const mid = (WORD.length - 1) / 2;
  const base = 640;
  let cx = W / 2 - total / 2;
  const fill = bronzeFill(x, base - 92, base + 8);
  WORD.split("").forEach((ch, i) => {
    const t0 = CUE.wordmark - S.resolve + Math.abs(i - mid) * 1.25;
    const p = prog(t, t0, t0 + 16, E.out);
    if (p > 0.002 && ch !== " ") {
      x.save();
      x.globalAlpha = p;
      if ((1 - p) * 10 > 0.15) x.filter = `blur(${((1 - p) * 10).toFixed(2)}px)`;
      x.font = font;
      x.translate(cx + ws[i] / 2, base + (1 - p) * 34);
      x.scale(1.22 - p * 0.22, 1.22 - p * 0.22);
      x.fillStyle = fill;
      x.shadowColor = rgba(C.bronze, 0.3);
      x.shadowBlur = 26;
      x.fillText(ch, -ws[i] / 2, 0);
      x.restore();
    }
    cx += ws[i] + trk;
  });

  // tagline with drawn rules
  const tp = prog(t, CUE.tagline - S.resolve, CUE.tagline - S.resolve + 14);
  const tw2 = txt(x, EYEBROW, W / 2, 712, `500 22px ${FONT.mono}`, C.cream, { ls: 9, align: "center", alpha: tp });
  const rl = lerp(0, 150, prog(t, CUE.tagline - S.resolve + 2, CUE.tagline - S.resolve + 22));
  for (const s of [-1, 1]) {
    const x0 = W / 2 + s * (tw2 / 2 + 28);
    const g = x.createLinearGradient(x0, 0, x0 + s * rl, 0);
    g.addColorStop(0, C.bronze);
    g.addColorStop(1, rgba(C.bronze, 0));
    x.fillStyle = g;
    x.fillRect(Math.min(x0, x0 + s * rl), 704, rl, 1.5);
  }
  // URL
  txt(x, URL, W / 2, 800, `400 28px ${FONT.mono}`, C.bronzeBright, { ls: 3, align: "center", alpha: prog(t, CUE.url - S.resolve, CUE.url - S.resolve + 12) });
}
