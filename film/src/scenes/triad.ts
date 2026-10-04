// Scene 2 — Witness. Sever. Ripen. (f150–329). One verb per beat-pair, each with its own
// motion idea: a compass-drawn vesica eye; a diagonal cut that splits the vine and the
// word itself; a bloom of seeds as leaves unfurl along the severed vine.
import { CUE, S, W, H } from "../timeline.ts";
import { C, FONT } from "../tokens.ts";
import { E, clamp, lerp, mix, prog, rgba, rnd, srnd } from "../lib/math.ts";
import { type Ctx, arcPoly, bronzeFill, comp, glow, layer, txt, textW } from "../lib/canvas.ts";
import { TRACE_X0, TRACE_X1, TRACE_Y, vineLift } from "../stage.ts";

// Cut line for SEVER (screen px) and its unit normal.
const A: [number, number] = [1330, 170];
const B: [number, number] = [590, 1010];
const dirLen = Math.hypot(B[0] - A[0], B[1] - A[1]);
const NX = -(B[1] - A[1]) / dirLen, NY = (B[0] - A[0]) / dirLen;

const WORD_Y = 700;
const WORD_FONT = `400 196px ${FONT.display}`;
const EYE: [number, number] = [960, 380];

/** Draw `src` split along the cut line, halves pushed apart by `sep` px along the normal. */
function splitComp(dst: Ctx, src: HTMLCanvasElement, sep: number, rot = 0) {
  if (sep < 0.05) { dst.drawImage(src, 0, 0); return; }
  const far = 4000;
  const ux = (B[0] - A[0]) / dirLen, uy = (B[1] - A[1]) / dirLen;
  const p1: [number, number] = [A[0] - ux * far, A[1] - uy * far];
  const p2: [number, number] = [A[0] + ux * far, A[1] + uy * far];
  for (const side of [1, -1]) {
    dst.save();
    dst.beginPath();
    dst.moveTo(p1[0], p1[1]);
    dst.lineTo(p2[0], p2[1]);
    dst.lineTo(p2[0] + NX * far * side, p2[1] + NY * far * side);
    dst.lineTo(p1[0] + NX * far * side, p1[1] + NY * far * side);
    dst.closePath();
    dst.translate(NX * sep * side, NY * sep * side);
    dst.translate(W / 2, H / 2);
    dst.rotate(rot * side);
    dst.translate(-W / 2, -H / 2);
    dst.clip();
    dst.drawImage(src, 0, 0);
    dst.restore();
  }
}

/** The bronze vine across the lower third, with leaves that unfurl by `leaf` (0..1). */
function vine(x: Ctx, f: number, leaf: number) {
  x.save();
  x.lineCap = "round";
  x.strokeStyle = rgba(C.bronze, 0.95);
  x.lineWidth = 3;
  x.beginPath();
  for (let px = TRACE_X0; px <= TRACE_X1; px += 3) {
    const py = TRACE_Y - vineLift(px, f);
    if (px === TRACE_X0) x.moveTo(px, py);
    else x.lineTo(px, py);
  }
  x.stroke();
  if (leaf > 0) {
    for (let i = 0; i < 15; i++) {
      const px = TRACE_X0 + 60 + i * 108 + srnd("lx", i) * 20;
      const local = clamp(leaf * 1.6 - (i / 15) * 0.6);
      const k = E.back(local);
      if (k <= 0.01) continue;
      const py = TRACE_Y - vineLift(px, f);
      const up = i % 2 === 0 ? -1 : 1;
      const ang = up * (0.55 + rnd("la", i) * 0.4) - Math.PI / 2 * 0;
      const len = (34 + rnd("ll", i) * 22) * k;
      x.save();
      x.translate(px, py);
      x.rotate(ang + (up < 0 ? -Math.PI / 2 : Math.PI / 2) * 0.55);
      x.beginPath();
      x.moveTo(0, 0);
      x.quadraticCurveTo(len * 0.5, -len * 0.42, len, 0);
      x.quadraticCurveTo(len * 0.5, len * 0.42, 0, 0);
      x.fillStyle = rgba(C.chlorophyll, 0.75);
      x.fill();
      x.strokeStyle = rgba(C.chlorophyllBright, 0.7);
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(0, 0);
      x.lineTo(len * 0.92, 0);
      x.stroke();
      x.restore();
    }
  }
  x.restore();
}

function subLabel(x: Ctx, s: string, f: number, at: number, alpha: number) {
  txt(x, s, W / 2, WORD_Y + 78, `500 18px ${FONT.mono}`, C.titanium, { ls: 6, align: "center", alpha: prog(f, at, at + 12) * alpha });
}

export function triad(x: Ctx, f: number) {
  const t = f - S.triad;
  const sever = f - CUE.sever;
  const ripen = f - CUE.ripen;
  const sceneOut = prog(f, S.specimens - 8, S.specimens, E.in);

  // ── vine (layer 2) — split at SEVER
  const [vc, vx] = layer(2);
  vine(vx, f, prog(f, CUE.ripen + 2, CUE.ripen + 40, E.linear));
  const cutSep = f >= CUE.sever + 4 ? lerp(0, 22, E.out(clamp((sever - 4) / 14))) : 0;
  const vineAlpha = 1 - sceneOut;
  x.save();
  x.globalAlpha = vineAlpha;
  splitComp(x, vc, cutSep);
  x.restore();

  // ── WITNESS (t 0–60)
  if (t < 62) {
    const out = prog(t, 50, 60, E.in);
    const [lc, lx] = layer(3);
    const [cx, cy] = EYE, r = 112;
    // seed-of-life construction circles
    lx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const a = (i - 1) * (Math.PI / 3);
      const ox = i === 0 ? cx : cx + Math.cos(a) * r, oy = i === 0 ? cy : cy + Math.sin(a) * r;
      const p = prog(t, i * 2.5, i * 2.5 + 18, E.io);
      lx.strokeStyle = rgba(C.titanium, 0.32);
      arcPoly(ox, oy, r, -Math.PI / 2, Math.PI * 1.5, 120).stroke(lx, 0, p);
    }
    // vesica eye: two arcs
    const half = Math.acos(0.5); // intersection half-angle for centres r apart
    lx.lineWidth = 2.4;
    lx.strokeStyle = C.bronze;
    const pe = prog(t, 6, 24, E.io);
    arcPoly(cx - r / 2, cy, r, -half, half, 64).stroke(lx, 0, pe);
    arcPoly(cx + r / 2, cy, r, Math.PI - half, Math.PI + half, 64).stroke(lx, 0, pe);
    // iris + pupil
    lx.strokeStyle = C.bronzeBright;
    lx.lineWidth = 1.6;
    arcPoly(cx, cy, 40, -Math.PI / 2, Math.PI * 1.5, 80).stroke(lx, 0, prog(t, 14, 28, E.io));
    const pp = E.back(clamp((t - 22) / 10));
    if (pp > 0) {
      glow(lx, cx, cy, 70, C.bronze, 0.35 * pp);
      lx.fillStyle = C.bronzeBright;
      lx.beginPath();
      lx.arc(cx, cy, 9 * pp, 0, Math.PI * 2);
      lx.fill();
    }
    // the word: tracks in from wide
    const p = prog(t, 0, 16, E.out);
    const ls = lerp(90, 26, p);
    lx.save();
    if ((1 - p) * 10 > 0.15) lx.filter = `blur(${((1 - p) * 10).toFixed(2)}px)`;
    txt(lx, "WITNESS", W / 2, WORD_Y, WORD_FONT, C.cream, { ls, align: "center", alpha: prog(t, 0, 6) });
    lx.restore();
    subLabel(lx, "I · DIAGNOSIS", t, 8, 1);
    comp(x, lc, { alpha: 1 - out, blur: out * 8, scale: 1 + out * 0.04 });
  }

  // ── SEVER (t 60–120)
  if (sever >= 0 && sever < 62) {
    const out = prog(sever, 50, 60, E.in);
    const [lc, lx] = layer(3);
    const slam = prog(sever, 0, 5, E.out);
    lx.save();
    lx.translate(W / 2, WORD_Y - 70);
    lx.scale(lerp(1.1, 1, slam), lerp(1.1, 1, slam));
    lx.translate(-W / 2, -(WORD_Y - 70));
    txt(lx, "SEVER", W / 2, WORD_Y, `700 204px ${FONT.display}`, C.cream, { ls: 22, align: "center", alpha: slam });
    lx.restore();
    subLabel(lx, "II · INTEGRATION", sever, 10, 1);
    const sep = sever >= 4 ? lerp(0, 13, E.out(clamp((sever - 4) / 12))) : 0;
    const [sc, sx] = layer(4);
    splitComp(sx, lc, sep, sep > 0 ? 0.004 : 0);
    // the cut: fast hot draw, then a cooling scar
    const draw = prog(sever, 0, 5, E.in);
    const hot = Math.exp(-Math.max(0, sever - 5) / 7);
    const tip: [number, number] = [lerp(A[0], B[0], draw), lerp(A[1], B[1], draw)];
    sx.save();
    sx.lineCap = "round";
    sx.strokeStyle = rgba(C.bronze, 0.35 + 0.4 * hot);
    sx.lineWidth = 10 * hot + 1;
    sx.filter = "blur(4px)";
    sx.beginPath(); sx.moveTo(A[0], A[1]); sx.lineTo(tip[0], tip[1]); sx.stroke();
    sx.filter = "none";
    sx.strokeStyle = mix(C.titanium, "#FFF4DE", hot);
    sx.lineWidth = 1.2 + 1.8 * hot;
    sx.beginPath(); sx.moveTo(A[0], A[1]); sx.lineTo(tip[0], tip[1]); sx.stroke();
    // sparks from where the cut crosses the vine and the word
    for (let i = 0; i < 34; i++) {
      const t0 = 3 + rnd("st", i) * 4;
      const age = sever - t0;
      if (age < 0 || age > 26) continue;
      const along = 0.35 + rnd("sa", i) * 0.45;
      const ox = lerp(A[0], B[0], along), oy = lerp(A[1], B[1], along);
      const side = rnd("ss", i) < 0.5 ? -1 : 1;
      const sp = 7 + rnd("sv", i) * 12;
      const px = ox + NX * side * sp * age * (1 - age / 60) + srnd("sj", i) * age * 1.5;
      const py = oy + NY * side * sp * age * (1 - age / 60) + 0.08 * age * age;
      const a = (1 - age / 26) * 0.9;
      sx.fillStyle = rgba(C.bronzeBright, a);
      sx.beginPath(); sx.arc(px, py, 1.6 + rnd("sr", i) * 1.4, 0, Math.PI * 2); sx.fill();
    }
    sx.restore();
    comp(x, sc, { alpha: 1 - out, blur: out * 8 });
  }

  // ── RIPEN (t 120–180)
  if (ripen >= 0) {
    const out = prog(f, S.specimens - 8, S.specimens, E.in);
    const [lc, lx] = layer(3);
    // seed bloom
    const ocx = W / 2, ocy = 470;
    for (let i = 0; i < 460; i++) {
      const delay = rnd("pd", i) * 12;
      const age = ripen - delay;
      if (age <= 0) continue;
      const k = E.out(clamp(age / 46));
      const a0 = rnd("pa", i) * Math.PI * 2;
      const dist = (90 + rnd("pr", i) * 620) * k;
      const curl = (rnd("pc", i) - 0.5) * 1.6 * k;
      const px = ocx + Math.cos(a0 + curl) * dist * 1.25;
      const py = ocy + Math.sin(a0 + curl) * dist * 0.62;
      const fade = clamp(1 - (age - 30) / 30);
      const col = i % 3 === 0 ? C.bronzeBright : C.chlorophyllBright;
      lx.fillStyle = rgba(col, 0.75 * fade * clamp(age / 6));
      lx.beginPath();
      lx.arc(px, py, 0.8 + rnd("ps", i) * 2.2, 0, Math.PI * 2);
      lx.fill();
    }
    glow(lx, ocx, ocy, 520, C.bronze, 0.16 * prog(ripen, 0, 20) * (1 - prog(ripen, 30, 60)));
    // the word, warm bronze, rising
    const p = prog(ripen, 0, 16, E.out);
    lx.save();
    if ((1 - p) * 10 > 0.15) lx.filter = `blur(${((1 - p) * 10).toFixed(2)}px)`;
    lx.translate(0, (1 - p) * 40);
    const fill = bronzeFill(lx, WORD_Y - 150, WORD_Y + 10);
    txt(lx, "RIPEN", W / 2, WORD_Y, WORD_FONT, fill, { ls: 26, align: "center", alpha: p, glow: 28, glowC: rgba(C.bronze, 0.35) });
    lx.restore();
    subLabel(lx, "III · LIBERATION", ripen, 10, 1);
    comp(x, lc, { alpha: 1 - out, blur: out * 8 });
  }
  void textW;
}
