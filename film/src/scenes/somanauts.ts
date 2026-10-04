// Scene 4 — The Somanauts (f570–719). Four instrument readouts land on four beats.
// Each waveform is the character's signature and matches the tone the score plays
// on the same frame: Jian steps, Sona sings, Gideon guards, Corv witnesses.
import { CUE, S, SOMANAUTS, W } from "../timeline.ts";
import { C, FONT } from "../tokens.ts";
import { E, clamp, prog, rgba } from "../lib/math.ts";
import { type Ctx, glow, layer, txt } from "../lib/canvas.ts";
import { ecgShape, plate } from "../stage.ts";

const PW = 400, PH = 470, GAP = 32;
const X0 = (W - (PW * 4 + GAP * 3)) / 2;
const Y = 410;

type Wave = (typeof SOMANAUTS)[number]["wave"];
/** Waveform value in [-1, 1] at sample x for a phase. */
function wave(kind: Wave, x: number, ph: number) {
  switch (kind) {
    case "step": {
      const s = Math.sin((x + ph) * 0.028) + 0.45 * Math.sin((x + ph) * 0.071);
      return Math.round(s * 2.2) / 3.2;
    }
    case "sine":
      return Math.sin((x + ph) * 0.05) * (0.75 + 0.2 * Math.sin((x + ph) * 0.009));
    case "guard": {
      const m = ((x + ph) % 90 + 90) % 90;
      return m < 10 ? 0.85 : m < 14 ? -0.25 : 0;
    }
    case "ecg": {
      const m = ((x + ph) % 150 + 150) % 150;
      return ecgShape((m - 75) * 0.8, 1) / 140;
    }
  }
}

function panel(x: Ctx, i: number, f: number) {
  const s = SOMANAUTS[i];
  const at = CUE.somanaut[i];
  const a = f - at;
  if (a < 0) return;
  const p = prog(a, 0, 14, E.out);
  const px = X0 + i * (PW + GAP), py = Y + (1 - p) * 56;
  x.save();
  x.globalAlpha *= p;
  // reveal from the top like a printed plate
  x.beginPath();
  x.rect(px - 2, py - 2, PW + 4, (PH + 4) * clamp(p * 1.15));
  x.clip();
  x.fillStyle = rgba(C.voidRaised, 0.88);
  x.fillRect(px, py, PW, PH);
  x.strokeStyle = rgba(C.titanium, 0.38);
  x.lineWidth = 1;
  x.strokeRect(px + 0.5, py + 0.5, PW - 1, PH - 1);
  txt(x, `CH. 0${i + 1}`, px + 22, py + 34, `400 14px ${FONT.mono}`, C.titanium, { ls: 3 });
  txt(x, s.verb, px + PW - 22, py + 34, `500 14px ${FONT.mono}`, C.bronze, { ls: 3, align: "right" });
  // oscilloscope window
  const ox = px + 22, oy = py + 58, ow = PW - 44, oh = 176;
  x.fillStyle = rgba("#050C18", 0.7);
  x.fillRect(ox, oy, ow, oh);
  x.strokeStyle = rgba(C.titanium, 0.12);
  x.beginPath();
  for (let gx = ox; gx <= ox + ow; gx += ow / 8) { x.moveTo(gx + 0.5, oy); x.lineTo(gx + 0.5, oy + oh); }
  for (let gy = oy; gy <= oy + oh; gy += oh / 4) { x.moveTo(ox, gy + 0.5); x.lineTo(ox + ow, gy + 0.5); }
  x.stroke();
  if (s.wave === "guard") {
    x.setLineDash([6, 6]);
    x.strokeStyle = rgba(C.bronze, 0.55);
    x.beginPath();
    x.moveTo(ox, oy + oh * 0.2); x.lineTo(ox + ow, oy + oh * 0.2);
    x.moveTo(ox, oy + oh * 0.8); x.lineTo(ox + ow, oy + oh * 0.8);
    x.stroke();
    x.setLineDash([]);
  }
  const drawn = prog(a, 2, 20, E.out);
  const ph = (f - S.somanauts) * 4.2;
  x.save();
  x.beginPath();
  x.rect(ox, oy, ow, oh);
  x.clip();
  x.strokeStyle = C.chlorophyllBright;
  x.lineWidth = 2;
  x.shadowColor = rgba(C.chlorophyllBright, 0.6);
  x.shadowBlur = 8;
  x.beginPath();
  const end = ow * drawn;
  for (let sx = 0; sx <= end; sx += 2) {
    const v = wave(s.wave, sx, ph);
    const yy = oy + oh / 2 - v * oh * 0.38;
    if (sx === 0) x.moveTo(ox + sx, yy);
    else x.lineTo(ox + sx, yy);
  }
  x.stroke();
  x.restore();
  if (drawn < 1) {
    const v = wave(s.wave, end, ph);
    glow(x, ox + end, oy + oh / 2 - v * oh * 0.38, 26, C.chlorophyllBright, 0.6);
  }
  // name / verb / role
  const np = prog(a, 6, 20, E.out);
  txt(x, s.name, px + 22, py + 318 + (1 - np) * 18, `400 66px ${FONT.display}`, C.cream, { ls: 3, alpha: np });
  txt(x, s.verb.toLowerCase(), px + 24, py + 370, `italic 400 38px ${FONT.body}`, C.bronze, { alpha: prog(a, 10, 22) });
  txt(x, s.role, px + 22, py + 434, `400 12px ${FONT.mono}`, C.titanium, { ls: 2.2, alpha: prog(a, 14, 26) });
  x.restore();
}

export function somanauts(x: Ctx, f: number) {
  const t = f - S.somanauts;
  const out = prog(t, 138, 150, E.in);
  const [lc, lx] = layer(6);
  plate(lx, f, S.somanauts, "PLATE III", "INSTRUMENT READOUTS · CH. 01–04");
  const hp = prog(t, 4, 20, E.out);
  txt(lx, "THE SOMANAUTS", X0, 262 + (1 - hp) * 20, `400 58px ${FONT.display}`, C.cream, { ls: 4, alpha: hp });
  txt(lx, "scientists who navigate the somatic architecture", X0 + 2, 318, `italic 400 30px ${FONT.body}`, C.titanium, { alpha: prog(t, 12, 28) });
  for (let i = 0; i < 4; i++) panel(lx, i, f);
  x.save();
  x.globalAlpha = 1 - out;
  if (out > 0.02) x.filter = `blur(${(out * 6).toFixed(2)}px)`;
  x.translate(0, -out * 30);
  x.drawImage(lc, 0, 0);
  x.restore();
}
