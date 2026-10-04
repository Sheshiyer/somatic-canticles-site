// Scene 5 — The first page (f720–809). The cream page of Book I, Chapter 01 rises as a
// printed plate (verbatim text). The camera pushes into its drop cap T, which hands off
// to the sigil in the resolve: a match cut through the letter.
import { CUE, S, W, H } from "../timeline.ts";
import { C, FONT } from "../tokens.ts";
import { E, clamp, lerp, prog, rgba } from "../lib/math.ts";
import { type Ctx, mk } from "../lib/canvas.ts";
import { type Cam, D as D_PERSP, cardCorners, project } from "../gl.ts";
import { type Stage } from "../stage.ts";
import { RUNNING_LEFT, RUNNING_RIGHT, SAMPLE_CHAPTER, SAMPLE_P1, SAMPLE_TITLE } from "../copy.ts";

const PW = 1100, PH = 1500; // page texture px
const QW = 660, QH = 900; // page quad size on screen (px at Z=0)
const INK = "#1B2433"; // void, softened for print on cream
const M = 110; // page margin
const BODY = `400 31px ${FONT.body}`;
const BODY_I = `italic 400 31px ${FONT.body}`;
const LH = 47;
const CAP = { x: M, y: 470, size: 158 };
const CAP_W = 128; // indent for the first three lines

let pageCanvas: HTMLCanvasElement | null = null;
let lines: Array<Array<{ w: string; italic: boolean }>> | null = null;

/** Word-wrap the first paragraph (minus the drop-capped T) once. */
function layout(x: Ctx) {
  const words = SAMPLE_P1.slice(1).split(" ").map((w) => ({ w: w.replace(/\*/g, ""), italic: w.includes("*") }));
  const out: Array<Array<{ w: string; italic: boolean }>> = [];
  let cur: Array<{ w: string; italic: boolean }> = [];
  let width = 0;
  const space = (() => { x.font = BODY; return x.measureText(" ").width; })();
  for (const word of words) {
    x.font = word.italic ? BODY_I : BODY;
    const ww = x.measureText(word.w).width;
    const max = PW - M * 2 - (out.length < 3 ? CAP_W : 0);
    if (cur.length && width + space + ww > max) {
      out.push(cur);
      cur = [];
      width = 0;
    }
    width += (cur.length ? space : 0) + ww;
    cur.push(word);
  }
  if (cur.length) out.push(cur);
  return out;
}

const paperGrain = mk(PW / 2, PH / 2, (x) => {
  const img = x.createImageData(PW / 2, PH / 2);
  let s = 42424242;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const v = 120 + ((s >>> 24) - 128) * 0.35;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
});

function drawPage(t: number) {
  if (!pageCanvas) pageCanvas = mk(PW, PH);
  const x = pageCanvas.getContext("2d")!;
  if (!lines) lines = layout(x);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.fillStyle = C.cream;
  x.fillRect(0, 0, PW, PH);
  x.save();
  x.globalCompositeOperation = "multiply";
  x.globalAlpha = 0.16;
  x.drawImage(paperGrain, 0, 0, PW, PH);
  x.restore();
  const head = prog(t, 0, 8);
  x.globalAlpha = head;
  x.font = `400 21px ${FONT.display}`;
  x.letterSpacing = "4px";
  x.fillStyle = INK;
  x.fillText(RUNNING_LEFT, M, 112);
  const rw = x.measureText(RUNNING_RIGHT).width - 4;
  x.fillText(RUNNING_RIGHT, PW - M - rw, 112);
  x.fillRect(M, 134, PW - M * 2, 1.5);
  x.globalAlpha = prog(t, 2, 10);
  x.font = `500 22px ${FONT.mono}`;
  x.letterSpacing = "5px";
  const cw = x.measureText(SAMPLE_CHAPTER).width - 5;
  x.fillText(SAMPLE_CHAPTER, PW / 2 - cw / 2, 276);
  x.font = `400 68px ${FONT.display}`;
  x.letterSpacing = "2px";
  const tw2 = x.measureText(SAMPLE_TITLE).width - 2;
  x.fillText(SAMPLE_TITLE, PW / 2 - tw2 / 2, 362);
  x.letterSpacing = "0px";
  // drop cap
  x.globalAlpha = prog(t, 4, 12);
  x.font = `700 ${CAP.size}px ${FONT.display}`;
  x.fillStyle = C.bronze;
  x.fillText("T", CAP.x - 4, CAP.y + 118);
  // body lines, top to bottom
  x.fillStyle = INK;
  lines.forEach((ln, k) => {
    const a = prog(t, 6 + k * 1.2, 14 + k * 1.2);
    if (a <= 0.002) return;
    x.globalAlpha = a;
    let px = M + (k < 3 ? CAP_W : 0);
    const py = CAP.y + 34 + k * LH;
    for (const word of ln) {
      x.font = word.italic ? BODY_I : BODY;
      x.fillText(word.w, px, py);
      px += x.measureText(word.w + " ").width;
    }
  });
  x.globalAlpha = prog(t, 30, 40);
  x.font = `400 22px ${FONT.body}`;
  x.fillText("1", PW / 2 - 5, PH - 70);
  x.globalAlpha = 1;
  return pageCanvas;
}

function pose(t: number) {
  const p = prog(t, 0, 30, E.out);
  return { X: 0, Y: lerp(980, 34, p), Z: lerp(420, 0, p), rx: lerp(0.95, 0.07, p) + 0.02 * Math.sin(t / 30), ry: lerp(-0.12, 0.02, p) };
}

/** Screen-space offset (px from centre, at CAM0) of a page-texture point. */
function pagePoint(t: number, u: number, v: number): [number, number] {
  const ps = pose(t);
  const [tl, tr, br, bl] = cardCorners(ps.X, ps.Y, ps.Z, QW, QH, ps.rx, ps.ry);
  const top = tl.map((c, i) => lerp(c, tr[i], u));
  const bot = bl.map((c, i) => lerp(c, br[i], u));
  const pt = top.map((c, i) => lerp(c, bot[i], v));
  const [sx, sy] = project(pt[0], pt[1], pt[2]);
  return [sx - W / 2, sy - H / 2];
}

const PUSH_Z = 5.2;
const CAP_U = (CAP.x + 52) / PW, CAP_V = (CAP.y + 60) / PH;
function camAt(f: number): Cam {
  const t = Math.min(f, S.resolve) - S.page;
  const k = prog(f, CUE.pagePush, S.resolve, E.io);
  const c = pagePoint(t, CAP_U, CAP_V);
  return { x: c[0] * k, y: c[1] * k, z: lerp(1, PUSH_Z, k) };
}
/** Page fades linearly over 24 frames so the cream → void change stays under the strobe limit. */
const pageAlpha = (f: number) => 1 - prog(f, S.resolve - 24, S.resolve, E.linear);

/**
 * The bronze drop cap as a 2D overlay: it fades in as the page fades out, holds through
 * the cut, and is handed to the resolve, where it dissolves into the sigil.
 */
export function capOverlay(x: Ctx, f: number) {
  const t = Math.min(f, S.resolve) - S.page;
  const cam = camAt(f);
  const ps = pose(t);
  const s = (QW / PW) * (D_PERSP / (D_PERSP + ps.Z)) * cam.z;
  const [ox, oy] = pagePoint(t, (CAP.x - 4) / PW, (CAP.y + 118) / PH);
  const sx = W / 2 + (ox - cam.x) * cam.z, sy = H / 2 + (oy - cam.y) * cam.z;
  const a = f < S.resolve ? 1 - pageAlpha(f) : 1 - prog(f, S.resolve, S.resolve + 12, E.in);
  if (a <= 0.002) return;
  x.save();
  x.globalAlpha = a;
  x.font = `700 ${(CAP.size * s).toFixed(2)}px ${FONT.display}`;
  x.fillStyle = C.bronze;
  x.shadowColor = rgba(C.bronze, 0.35);
  x.shadowBlur = 30;
  x.fillText("T", sx, sy);
  x.restore();
}

export function page(st: Stage, f: number) {
  const x = st.ctx;
  const t = f - S.page;
  const cam = camAt(f);
  const alpha = pageAlpha(f);

  st.quads.upload("page", drawPage(t));
  st.quads.clear();
  const ps = pose(t);
  st.quads.draw("page", cardCorners(ps.X, ps.Y, ps.Z, QW, QH, ps.rx, ps.ry), cam, { alpha, sheen: lerp(-0.5, 1.6, prog(t, 6, 44, E.io)), sheenAmt: 0.12, edge: 0.004 });

  // contact shadow under the page
  const [sx0, sy0] = pagePoint(t, 0.5, 1);
  const bx = W / 2 + (sx0 - cam.x) * cam.z, by = H / 2 + (sy0 - cam.y) * cam.z;
  x.save();
  x.globalAlpha = alpha * clamp(1 - prog(f, CUE.pagePush, CUE.pagePush + 20)) * prog(t, 8, 30);
  const g = x.createRadialGradient(bx, by + 10, 0, bx, by + 10, 420);
  g.addColorStop(0, rgba("#000000", 0.55));
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.translate(bx, by + 10);
  x.scale(1, 0.12);
  x.translate(-bx, -(by + 10));
  x.fillStyle = g;
  x.fillRect(bx - 500, by - 400, 1000, 800);
  x.restore();
  x.drawImage(st.quads.frame, 0, 0);
  capOverlay(x, f);
}
