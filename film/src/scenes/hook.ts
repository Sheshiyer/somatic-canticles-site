// Scene 1 — Hook (f0–149). An ECG trace sweeps the void; its spikes land exactly on the
// heartbeat frames. "THE BODY IS / THE LAST FRONTIER." rises letter by letter. From f110
// the trace relaxes into the bronze vine that carries the next scene.
import { CUE, S } from "../timeline.ts";
import { C, FONT } from "../tokens.ts";
import { E, clamp, mix, prog, rgba } from "../lib/math.ts";
import { type Ctx, charW, glow, txt } from "../lib/canvas.ts";
import { TRACE_X0, TRACE_X1, TRACE_Y, ecgShape, headX, vineLift } from "../stage.ts";

const SPIKES = CUE.heartbeats.map((hf) => headX(hf));

/** Vertical offset (px, up) of the hook trace at x for frame f: ECG blending to vine. */
export const hookTraceLift = (px: number, f: number) => {
  const v = prog(f, CUE.vineRise, S.triad, E.io);
  let ecg = 0;
  for (const c of SPIKES) ecg += ecgShape(px - c, 1);
  return ecg * (1 - v) + vineLift(px, f) * v;
};

/** Letter-by-letter rise of a line; returns nothing, draws into x. */
export function riseLine(x: Ctx, s: string, px: number, py: number, font: string, color: string, start: number, f: number, per = 1.1, accent?: { index: number; color: string }) {
  let cx = px;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const w = charW(x, ch, font);
    const t0 = start + i * per;
    const p = prog(f, t0, t0 + 14, E.out);
    if (p > 0.002 && ch !== " ") {
      x.save();
      x.globalAlpha *= p;
      if ((1 - p) * 8 > 0.15) x.filter = `blur(${((1 - p) * 8).toFixed(2)}px)`;
      x.font = font;
      x.fillStyle = accent && i === accent.index ? accent.color : color;
      x.fillText(ch, cx, py + (1 - p) * 34);
      x.restore();
    }
    cx += w;
  }
}

export function hook(x: Ctx, f: number) {
  // ── trace
  const hx = headX(f);
  const v = prog(f, CUE.vineRise, S.triad, E.io);
  const stroke = mix(C.chlorophyll, C.bronze, v);
  x.save();
  x.lineCap = "round";
  x.lineJoin = "round";
  // phosphor persistence: older segments dimmer, unless the vine has taken over
  const step = 3;
  for (let px = TRACE_X0; px < hx; px += step) {
    const age = clamp((hx - px) / 1100);
    const a = (0.9 - age * 0.62) * (1 - v) + 0.95 * v;
    x.strokeStyle = `rgba(${stroke.slice(4, -1)},${a.toFixed(3)})`;
    x.lineWidth = 2.2 + v * 0.8;
    x.beginPath();
    x.moveTo(px, TRACE_Y - hookTraceLift(px, f));
    x.lineTo(Math.min(px + step, hx), TRACE_Y - hookTraceLift(Math.min(px + step, hx), f));
    x.stroke();
  }
  // head glow while sweeping
  if (f < 132) {
    const hy = TRACE_Y - hookTraceLift(hx, f);
    glow(x, hx, hy, 46, C.chlorophyllBright, 0.55);
    x.fillStyle = C.chlorophyllBright;
    x.beginPath();
    x.arc(hx, hy, 3.2, 0, Math.PI * 2);
    x.fill();
  }
  // a soft bloom on each spike as it lands
  for (const [i, c] of SPIKES.entries()) {
    const at = CUE.heartbeats[i];
    const a = f >= at ? Math.exp(-(f - at) / 9) : 0;
    if (a > 0.01) glow(x, c, TRACE_Y - 90, 140, C.chlorophyllBright, 0.22 * a);
  }
  x.restore();
  // baseline tick marks under the trace (instrument feel)
  x.save();
  x.strokeStyle = rgba(C.titanium, 0.25 * prog(f, 0, 30));
  x.lineWidth = 1;
  x.beginPath();
  for (let px = TRACE_X0; px <= TRACE_X1; px += 41) { x.moveTo(px + 0.5, TRACE_Y + 46); x.lineTo(px + 0.5, TRACE_Y + 52); }
  x.stroke();
  x.restore();
  // monitor readouts: they fade as the trace becomes the vine
  const ro = prog(f, 10, 28) * (1 - v);
  txt(x, "LEAD II · 25 MM/S", TRACE_X0, TRACE_Y + 82, `400 13px ${FONT.mono}`, C.titanium, { ls: 3, alpha: ro });
  const beat = CUE.heartbeats.reduce((m, hf) => Math.max(m, f >= hf ? Math.exp(-(f - hf) / 8) : 0), 0);
  txt(x, "HR 120", TRACE_X1, TRACE_Y + 82, `500 13px ${FONT.mono}`, mix(C.titanium, C.chlorophyllBright, beat), { ls: 3, align: "right", alpha: ro });

  // ── text
  const out = prog(f, 134, 150, E.in);
  x.save();
  x.globalAlpha = 1 - out;
  x.translate(0, -out * 24);
  if (out > 0.02) x.filter = `blur(${(out * 6).toFixed(2)}px)`;
  txt(x, "A TRILOGY OF CONSCIOUSNESS", 150, 300, `500 20px ${FONT.mono}`, C.bronze, { ls: 7, alpha: prog(f, 16, 34) });
  const font = `400 128px ${FONT.display}`;
  riseLine(x, "THE BODY IS", 142, 455, font, C.cream, CUE.hookTextIn, f, 1.0);
  riseLine(x, "THE LAST FRONTIER.", 142, 600, font, C.cream, CUE.hookTextIn + 8, f, 1.0, { index: 17, color: C.bronze });
  x.restore();
}
