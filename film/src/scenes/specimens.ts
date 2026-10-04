// Scene 3 — Specimens 01–03 (f330–569). The real covers swing in on perspective quads
// with a specular sheen, each catalogued with a specimen label. The camera follows each
// arrival, then pulls back to the site's own headline: THREE BOOKS. TWENTY-SEVEN CHAPTERS.
import { BOOKS, CUE, S, W, H } from "../timeline.ts";
import { C, FONT } from "../tokens.ts";
import { E, clamp, lerp, prog, rgba, rnd } from "../lib/math.ts";
import { type Ctx, layer, txt } from "../lib/canvas.ts";
import { type Cam, cardCorners, project } from "../gl.ts";
import { type Stage, camTransform, cropMarks, plate } from "../stage.ts";
import { riseLine } from "./hook.ts";

export const CARD_W = 300;
export const CARD_H = Math.round((300 * 1043) / 720);
const XS = [-560, 0, 560];
const Y0 = 110;

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";
export const scramble = (text: string, f: number, start: number, per = 0.9, settle = 9) =>
  text.split("").map((ch, i) => {
    if (ch === " ") return " ";
    if (f >= start + i * per + settle) return ch;
    if (f < start + i * per * 0.5) return "";
    return GLYPHS[Math.floor(rnd(text, i, Math.floor(f / 2)) * GLYPHS.length)];
  }).join("");

function camera(t: number): Cam {
  const target = (i: number): Cam => ({ x: XS[i] * 0.52, y: Y0 * 0.45, z: 1.17 });
  const start: Cam = { x: XS[0] * 0.52 + 140, y: 40, z: 1.32 };
  const blend = (a: Cam, b: Cam, k: number): Cam => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });
  let cam = blend(start, target(0), prog(t, 0, 34, E.io));
  cam = blend(cam, target(1), prog(t, 58, 84, E.io));
  cam = blend(cam, target(2), prog(t, 118, 144, E.io));
  cam = blend(cam, { x: 0, y: 0, z: 1 }, prog(t, 178, 212, E.io));
  return cam;
}

function cardPose(i: number, t: number) {
  const a = t - 60 * i;
  const p = prog(a, 0, 40, E.out);
  return {
    visible: a >= 0,
    alpha: prog(a, 0, 10),
    X: XS[i] + lerp(320, 0, p),
    Y: Y0 + lerp(-50, 0, p),
    Z: lerp(950, 0, p),
    ry: lerp(-1.25, -0.07, p) + 0.035 * Math.sin((t + i * 23) / 36) * p,
    rx: lerp(0.32, 0.02, p) + 0.015 * Math.sin((t + i * 31) / 47) * p,
    sheen: lerp(-0.7, 1.75, prog(a, 12, 48, E.io)),
  };
}

export function specimens(st: Stage, f: number) {
  const x = st.ctx;
  const t = f - S.specimens;
  const cam = camera(t);
  const active = clamp(Math.floor(t / 60), 0, 2);
  const allLit = prog(t, 176, 200);
  // exit: a scan line sweeps left → right, taking the plate with it
  const scan = lerp(-40, W + 40, prog(t, 224, 240, E.in));

  const [wc, wx] = layer(5);
  // world-space 2D (zooms with the camera)
  wx.save();
  camTransform(wx, cam);
  for (let i = 0; i < 3; i++) {
    const pose = cardPose(i, t);
    const cx = W / 2 + XS[i], cy = H / 2 + Y0;
    cropMarks(wx, cx - CARD_W / 2 - 18, cy - CARD_H / 2 - 18, cx + CARD_W / 2 + 18, cy + CARD_H / 2 + 18, 18, C.titanium, 0.55 * prog(t - 60 * i, -6, 8));
    if (!pose.visible) continue;
    // contact shadow
    const g = wx.createRadialGradient(cx, cy + CARD_H / 2 + 14, 0, cx, cy + CARD_H / 2 + 14, CARD_W * 0.62);
    g.addColorStop(0, rgba("#000000", 0.5 * pose.alpha * prog(t - 60 * i, 10, 40)));
    g.addColorStop(1, "rgba(0,0,0,0)");
    wx.fillStyle = g;
    wx.save();
    wx.translate(cx, cy + CARD_H / 2 + 14);
    wx.scale(1, 0.16);
    wx.translate(-cx, -(cy + CARD_H / 2 + 14));
    wx.fillRect(cx - CARD_W, cy + CARD_H / 2 - 200, CARD_W * 2, 400);
    wx.restore();
    // specimen label
    const a = t - 60 * i;
    const b = BOOKS[i];
    const ly = cy + CARD_H / 2 + 46;
    const lit = i === active || allLit > 0 ? 1 : 0.55;
    txt(wx, scramble(`SPECIMEN ${b.n} — ${b.ch}`, a, 8, 0.35, 6), cx, ly, `500 15px ${FONT.mono}`, C.bronze, { ls: 3, align: "center", alpha: prog(a, 8, 14) * lit });
    txt(wx, scramble(b.title, a, 12, 0.35, 6), cx, ly + 40, `400 27px ${FONT.display}`, C.cream, { ls: 2.5, align: "center", alpha: prog(a, 12, 18) * lit });
  }
  // headline on the pullback
  if (t >= 184) {
    const font = `400 76px ${FONT.display}`;
    const l1 = "THREE BOOKS.", l2 = "TWENTY-SEVEN CHAPTERS.";
    wx.font = font;
    const w1 = wx.measureText(l1).width, w2 = wx.measureText(l2).width;
    riseLine(wx, l1, W / 2 - w1 / 2, 246, font, C.cream, 184, t, 0.8, { index: 11, color: C.bronze });
    riseLine(wx, l2, W / 2 - w2 / 2, 330, font, C.bronze, 192, t, 0.6);
  }
  wx.restore();

  // GL covers
  st.quads.clear();
  for (let i = 0; i < 3; i++) {
    const pose = cardPose(i, t);
    if (!pose.visible) continue;
    const corners = cardCorners(pose.X, pose.Y, pose.Z, CARD_W, CARD_H, pose.rx, pose.ry);
    const dim = i === active ? 0 : 0.5 * (1 - allLit);
    st.quads.draw(`book${i}`, corners, cam, { alpha: pose.alpha, shade: dim, sheen: pose.sheen, sheenAmt: 0.3, edge: 0.012 });
  }

  // composite: plate chrome (screen space) + world layer + covers, clipped by the exit scan
  x.save();
  if (t >= 224) {
    x.beginPath();
    x.rect(scan, 0, W - scan + 1, H);
    x.clip();
  }
  plate(x, f, S.specimens, "PLATE II", "CAT. SC-02 · SPECIMENS 01–03");
  x.drawImage(st.quads.frame, 0, 0);
  x.drawImage(wc, 0, 0);
  x.restore();
  if (t >= 224 && scan > 0 && scan < W) {
    x.save();
    x.fillStyle = rgba(C.bronzeBright, 0.9);
    x.fillRect(scan - 1, 150, 2, H - 246);
    x.restore();
  }
  void project;
  void CUE;
}
