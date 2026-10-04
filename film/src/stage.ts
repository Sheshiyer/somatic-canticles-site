// Shared stage: the Khalorēē field schedule, Atlas plate chrome, HUD, the ECG/vine
// geometry used across scenes, camera shake, and the grain/vignette finish.
import { W, H, N, S, IMPACTS, FPS } from "./timeline.ts";
import { C, FONT } from "./tokens.ts";
import { E, clamp, decay, glsl, lerp, prog, rgba, srnd, tw } from "./lib/math.ts";
import { type Ctx, mk, txt } from "./lib/canvas.ts";
import { Field, Quads, type Cam } from "./gl.ts";

export interface Stage {
  ctx: Ctx;
  field: Field;
  quads: Quads;
  img: Record<string, HTMLImageElement>;
}

// ───────────────────────────────────────────── energy / shake
export const energy = (f: number) => IMPACTS.reduce((a, [at, p]) => a + p * decay(f, at, 6), 0);
export const shake = (f: number) => {
  const e = energy(f);
  return { x: srnd("sx", f) * 7 * e, y: srnd("sy", f) * 5 * e };
};

// ───────────────────────────────────────────── field schedule
const KEYS: Array<[number, { intensity: number; warmth: number; focus: [number, number] }]> = [
  [S.hook, { intensity: 0.35, warmth: 0.0, focus: [0, -0.05] }],
  [S.triad, { intensity: 0.7, warmth: 0.25, focus: [0, 0.05] }],
  [S.triad + 120, { intensity: 0.9, warmth: 0.9, focus: [0, 0] }],
  [S.specimens, { intensity: 0.45, warmth: 0.35, focus: [0, 0] }],
  [S.somanauts, { intensity: 0.4, warmth: 0.15, focus: [0, 0.05] }],
  [S.page, { intensity: 0.35, warmth: 0.5, focus: [0, 0] }],
  [S.resolve, { intensity: 0.8, warmth: 1.0, focus: [0, 0.08] }],
];
const fieldAt = (f: number) => {
  let i = 0;
  while (i < KEYS.length - 1 && f >= KEYS[i + 1][0]) i++;
  const [a, ka] = KEYS[i];
  const [b, kb] = KEYS[Math.min(i + 1, KEYS.length - 1)];
  // ease over the first 40 frames after each key
  const k = b === a ? 1 : prog(f, a, a + 40, E.io);
  const prev = KEYS[Math.max(0, i - 1)][1];
  const from = i === 0 ? ka : prev;
  const t = i === 0 ? 1 : k;
  void kb;
  return {
    intensity: lerp(from.intensity, ka.intensity, t),
    warmth: lerp(from.warmth, ka.warmth, t),
    focus: [lerp(from.focus[0], ka.focus[0], t), lerp(from.focus[1], ka.focus[1], t)] as [number, number],
  };
};

export function backdrop(st: Stage, f: number) {
  const x = st.ctx;
  const k = fieldAt(f);
  const fadeIn = prog(f, 0, 50, E.soft);
  const fc = st.field.render({
    time: f / FPS,
    intensity: k.intensity * (0.25 + 0.75 * fadeIn),
    warmth: k.warmth,
    pulse: energy(f),
    base: glsl(C.void),
    vein: glsl(C.chlorophyll),
    warm: glsl(C.bronze),
    focus: k.focus,
  });
  x.save();
  x.imageSmoothingQuality = "high";
  x.drawImage(fc, 0, 0, W, H);
  x.restore();
}

// ───────────────────────────────────────────── ECG + vine geometry (shared by hook and triad)
export const TRACE_Y = 840;
export const TRACE_X0 = 140;
export const TRACE_X1 = 1780;
/** Head position of the hook ECG sweep: reaches the right edge at frame 130. Spikes land on the heartbeat frames. */
export const headX = (f: number) => TRACE_X0 + (TRACE_X1 - TRACE_X0) * clamp(f / 130);
const g = (d: number, s: number) => Math.exp(-(d * d) / (2 * s * s));
/** ECG complex height (px, positive = up) at offset d from an R peak. */
export const ecgShape = (d: number, amp = 1) =>
  amp * (11 * g(d + 46, 9) - 7 * g(d + 10, 3.5) + 128 * g(d, 3.4) - 30 * g(d - 9, 4) + 20 * g(d - 50, 13));
/** Gentle vine undulation (px, positive = up). */
export const vineLift = (x: number, f: number) => 22 * Math.sin(x / 175 + 0.6) + 9 * Math.sin(x / 61 + f / 70);

// ───────────────────────────────────────────── plate chrome (Atlas)
export function plate(x: Ctx, f: number, start: number, label: string, cat: string, alpha = 1) {
  const p = prog(f, start, start + 22, E.out);
  if (p <= 0 || alpha <= 0) return;
  x.save();
  x.globalAlpha *= alpha;
  // grid
  x.strokeStyle = rgba(C.titanium, 0.07 * p);
  x.lineWidth = 1;
  x.beginPath();
  for (let gx = 96; gx <= W - 96; gx += 48) { x.moveTo(gx + 0.5, 150); x.lineTo(gx + 0.5, H - 96); }
  for (let gy = 150; gy <= H - 96; gy += 48) { x.moveTo(96, gy + 0.5); x.lineTo(W - 96, gy + 0.5); }
  x.stroke();
  // top ruler, drawn on left → right
  const rx = lerp(96, W - 96, p);
  x.strokeStyle = rgba(C.titanium, 0.55);
  x.beginPath();
  x.moveTo(96, 150.5);
  x.lineTo(rx, 150.5);
  for (let t = 96, i = 0; t <= rx; t += 12, i++) {
    const len = i % 8 === 0 ? 12 : i % 4 === 0 ? 7 : 4;
    x.moveTo(t + 0.5, 150);
    x.lineTo(t + 0.5, 150 + len);
  }
  x.stroke();
  // header
  const hp = prog(f, start + 4, start + 18);
  x.strokeStyle = rgba(C.bronze, 0.9 * hp);
  x.lineWidth = 1.5;
  x.beginPath();
  x.arc(106, 112, 8, 0, Math.PI * 2);
  x.moveTo(94, 112); x.lineTo(118, 112);
  x.moveTo(106, 100); x.lineTo(106, 124);
  x.stroke();
  txt(x, label, 130, 118, `500 17px ${FONT.mono}`, C.bronze, { ls: 3.5, alpha: hp });
  txt(x, cat, W - 96, 118, `400 15px ${FONT.mono}`, C.titanium, { ls: 3, align: "right", alpha: hp });
  x.restore();
}

/** Corner crop marks around a rect. */
export function cropMarks(x: Ctx, l: number, t: number, r: number, b: number, len: number, col: string, alpha: number) {
  if (alpha <= 0.002) return;
  x.save();
  x.strokeStyle = rgba(col, alpha);
  x.lineWidth = 1.5;
  x.beginPath();
  for (const [cx, cy, sx, sy] of [[l, t, 1, 1], [r, t, -1, 1], [r, b, -1, -1], [l, b, 1, -1]]) {
    x.moveTo(cx, cy + len * sy);
    x.lineTo(cx, cy);
    x.lineTo(cx + len * sx, cy);
  }
  x.stroke();
  x.restore();
}

/** Apply a screen-space camera to a 2D context (matches gl.ts project()). */
export const camTransform = (x: Ctx, cam: Cam) => {
  x.setTransform(cam.z, 0, 0, cam.z, W / 2 - (W / 2 + cam.x) * cam.z, H / 2 - (H / 2 + cam.y) * cam.z);
};

// ───────────────────────────────────────────── HUD
const PLATES: Array<[number, string]> = [
  [S.hook, "PLATE 0 · SURFACE"],
  [S.triad, "PLATE I · WITNESS · SEVER · RIPEN"],
  [S.specimens, "PLATE II · SPECIMENS"],
  [S.somanauts, "PLATE III · INSTRUMENTS"],
  [S.page, "PLATE IV · BOOK I · CHAPTER 01"],
  [S.resolve, "SOMATIC CANTICLES"],
];
export function hud(x: Ctx, f: number) {
  const a = prog(f, 4, 28) * (1 - prog(f, S.resolve + 30, S.resolve + 50, E.in) * 0.65);
  if (a <= 0.002) return;
  x.save();
  x.globalAlpha = a * 0.85;
  cropMarks(x, 40, 40, W - 40, H - 40, 30, C.titanium, 0.55);
  const m = `400 13px ${FONT.mono}`;
  let label = PLATES[0][1];
  for (const [at, l] of PLATES) if (f >= at) label = l;
  txt(x, label, 72, 66, m, C.titanium, { ls: 3 });
  const depth = (27 * f) / (N - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  txt(x, `−${depth.toFixed(2)} MM`, W - 72, 66, m, C.bronze, { ls: 3, align: "right" });
  txt(x, `TC 00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`, 72, H - 52, m, C.titanium, { ls: 3 });
  txt(x, "120 BPM · 1920×1080 · 60P", W - 72, H - 52, m, C.titanium, { ls: 3, align: "right" });
  // ECG spine progress rail
  const L = 340, R = W - 340, y = H - 57;
  x.fillStyle = rgba(C.titanium, 0.3);
  x.fillRect(L, y, R - L, 1);
  const head = L + (R - L) * (f / (N - 1));
  x.strokeStyle = C.bronze;
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(L, y + 0.5);
  for (let px = L; px <= head; px += 2) {
    const d = px - head + 14;
    x.lineTo(px, y + 0.5 - ecgShape(d * 2.2, 0.06));
  }
  x.stroke();
  for (const at of Object.values(S)) {
    if (at >= N) continue;
    x.fillStyle = f >= at ? C.bronze : rgba(C.titanium, 0.6);
    x.fillRect(L + (R - L) * (at / (N - 1)), y - 4, 1, 9);
  }
  x.restore();
}

// ───────────────────────────────────────────── finish: vignette + grain
const grains = Array.from({ length: 6 }, (_, k) =>
  mk(W / 2, H / 2, (x) => {
    const img = x.createImageData(W / 2, H / 2);
    let s = 1234567 + k * 7919;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (Math.imul(s, 1103515245) + 12345) >>> 0;
      const v = s >>> 24;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  }),
);
const vignette = mk(W, H, (x) => {
  const gr = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  gr.addColorStop(0, "rgba(6,14,27,0)");
  gr.addColorStop(1, "rgba(6,14,27,0.72)");
  x.fillStyle = gr;
  x.fillRect(0, 0, W, H);
});
export function finish(x: Ctx, f: number) {
  x.save();
  x.drawImage(vignette, 0, 0);
  x.globalCompositeOperation = "overlay";
  x.globalAlpha = 0.07;
  x.imageSmoothingEnabled = false;
  x.drawImage(grains[f % grains.length], 0, 0, W, H);
  x.restore();
}

export { tw };
