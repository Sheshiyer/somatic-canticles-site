// Somatic Canticles — procedural score for the 15.000 s launch film.
//
// Zero dependencies (Bun built-ins only). Every event is placed from the shared
// cue list in src/timeline.ts, so picture and sound are in sync by construction.
// D minor / D Dorian, 120 BPM (1 beat = 30 frames = 0.5 s).
//
// Run:    cd film && bun tools/audio.ts
// Output: out/audio.wav       48 kHz, stereo, 16-bit PCM, exactly 720000 frames
//         out/audio-cues.json every placed event as { t_seconds, label }
//
// Loudness is measured inside this script (ITU-R BS.1770 K-weighting + gating,
// 4x-oversampled true peak) and the master is normalised to -14 LUFS with a
// look-ahead true-peak limiter, ceiling below -1.5 dBTP. Deterministic: seeded
// PRNG only, so two runs are byte-identical.

import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { CUE, S, IMPACTS, SOMANAUTS, FPS, BEAT, BAR, N } from "../src/timeline.ts";

// ================================================================ constants
const SR = 48000;
const SPF = SR / FPS; // 800 samples per video frame
const NS = N * SPF; // 720000 sample frames = 15.000 s
const T_END = N / FPS;
const TAU = Math.PI * 2;
const OUT_DIR = resolve(import.meta.dir, "..", "out");

const fs = (frame: number) => frame / FPS; // frame -> seconds
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const dbToGain = (db: number) => Math.pow(10, db / 20);
const gainToDb = (g: number) => 20 * Math.log10(Math.max(g, 1e-12));

/** Linear attack (>= 1 ms) then exponential decay. */
function env(t: number, attack: number, tau: number): number {
  if (t < 0) return 0;
  const a = Math.max(attack, 0.001);
  if (t < a) return t / a;
  return Math.exp(-(t - a) / tau);
}

/** IMPACTS strength for a cue frame (0 if it is not an impact). */
const impact = (frame: number): number => IMPACTS.find(([f]) => f === frame)?.[1] ?? 0;

// ================================================================ PRNG
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedRng = mulberry32(0x50a71c);
const nextSeed = () => Math.floor(seedRng() * 4294967296) >>> 0;
const noise = (seed = nextSeed()) => {
  const r = mulberry32(seed);
  return () => r() * 2 - 1;
};
const rng = mulberry32(0xd0217a); // musical choices (scatter times, pans)

// ================================================================ cue log
const cueLog: { t_seconds: number; label: string }[] = [];
const mark = (t: number, label: string) => cueLog.push({ t_seconds: Math.round(t * 1e5) / 1e5, label });

// ================================================================ DSP primitives
/** Zavalishin TPT state-variable filter (stable for any cutoff below Nyquist). */
class SVF {
  ic1 = 0;
  ic2 = 0;
  lp = 0;
  bp = 0;
  hp = 0;
  process(x: number, fc: number, q: number): void {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2;
    this.bp = v1;
    this.hp = x - k * v1 - v2;
  }
}

class OnePole {
  y = 0;
  constructor(init = 0) {
    this.y = init;
  }
  process(x: number, fc: number): number {
    this.y += (1 - Math.exp((-TAU * fc) / SR)) * (x - this.y);
    return this.y;
  }
}

/** PolyBLEP band-limited saw. ph in [0,1), dt = f / SR. */
function blepSaw(ph: number, dt: number): number {
  let v = 2 * ph - 1;
  if (ph < dt) {
    const t = ph / dt;
    v -= t + t - t * t - 1;
  } else if (ph > 1 - dt) {
    const t = (ph - 1) / dt;
    v -= t * t + t + t + 1;
  }
  return v;
}

function panGains(pan: number): [number, number] {
  const x = ((Math.max(-1, Math.min(1, pan)) + 1) / 2) * (Math.PI / 2);
  return [Math.cos(x), Math.sin(x)];
}

// ================================================================ buses
type Bus = { l: Float64Array; r: Float64Array };
const mkBus = (): Bus => ({ l: new Float64Array(NS), r: new Float64Array(NS) });
const DRY = mkBus(); // events
const SEND = mkBus(); // shared reverb send ("the same room")
const BED = mkBus(); // drone + pad, sidechain-ducked under hits
const BED_SEND = mkBus();
const duck = new Float64Array(NS).fill(1);

type VoiceOpts = { pan?: number; send?: number; fadeIn?: number; fadeOut?: number; to?: Bus; sendTo?: Bus };

/** Edge window: every voice starts and ends at exactly zero. */
function edge(k: number, n: number, fi: number, fo: number): number {
  return Math.min(1, k / fi, (n - 1 - k) / fo);
}

/** Mono voice at an exact time. fn(t) is called for every sample (stateful voices stay coherent). */
function mono(t0: number, dur: number, fn: (t: number) => number, o: VoiceOpts = {}): void {
  const s0 = Math.round(t0 * SR);
  const n = Math.round(dur * SR);
  const [gl, gr] = panGains(o.pan ?? 0);
  const send = o.send ?? 0;
  const to = o.to ?? DRY;
  const st = o.sendTo ?? SEND;
  const fi = Math.max(1, Math.round((o.fadeIn ?? 0.002) * SR));
  const fo = Math.max(1, Math.round((o.fadeOut ?? 0.01) * SR));
  for (let k = 0; k < n; k++) {
    const v = fn(k / SR) * edge(k, n, fi, fo);
    const i = s0 + k;
    if (i < 0 || i >= NS) continue;
    to.l[i] += v * gl;
    to.r[i] += v * gr;
    if (send) {
      st.l[i] += v * gl * send;
      st.r[i] += v * gr * send;
    }
  }
}

/** Stereo voice. fn writes [L, R] into o. */
function stereo(t0: number, dur: number, fn: (t: number, out: number[]) => void, o: VoiceOpts = {}): void {
  const s0 = Math.round(t0 * SR);
  const n = Math.round(dur * SR);
  const send = o.send ?? 0;
  const to = o.to ?? DRY;
  const st = o.sendTo ?? SEND;
  const fi = Math.max(1, Math.round((o.fadeIn ?? 0.002) * SR));
  const fo = Math.max(1, Math.round((o.fadeOut ?? 0.01) * SR));
  const out = [0, 0];
  for (let k = 0; k < n; k++) {
    out[0] = 0;
    out[1] = 0;
    fn(k / SR, out);
    const w = edge(k, n, fi, fo);
    const i = s0 + k;
    if (i < 0 || i >= NS) continue;
    const l = out[0] * w;
    const r = out[1] * w;
    to.l[i] += l;
    to.r[i] += r;
    if (send) {
      st.l[i] += l * send;
      st.r[i] += r * send;
    }
  }
}

/** Sidechain the bed under a hit: smooth 10 ms dip, exponential recovery. */
function duckAt(t0: number, depth: number, tau: number): void {
  const s0 = Math.round(t0 * SR);
  const n = Math.round(tau * 6 * SR);
  for (let k = 0; k < n; k++) {
    const i = s0 + k;
    if (i < 0 || i >= NS) continue;
    const t = k / SR;
    duck[i] = Math.min(duck[i], 1 - depth * Math.min(1, t / 0.01) * Math.exp(-t / tau));
  }
}

/** Piecewise-linear automation over [seconds, value] keyframes. */
function automation(keys: ReadonlyArray<readonly [number, number]>) {
  return (t: number): number => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let k = 1; k < keys.length; k++) {
      const [t1, v1] = keys[k];
      const [t0, v0] = keys[k - 1];
      if (t <= t1) return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0));
    }
    return keys[keys.length - 1][1];
  };
}

// ================================================================ instruments

/** Round, sub-heavy thump: sine pitch drop + a little body noise. */
function thump(t0: number, amp: number, pan = 0): void {
  const nz = noise();
  const lp = new SVF();
  let ph = 0;
  mono(
    t0,
    0.5,
    (t) => {
      const f = 44 + 56 * Math.exp(-t / 0.028);
      ph += f / SR;
      const body = Math.sin(TAU * ph) * env(t, 0.003, 0.085);
      const h2 = Math.sin(2 * TAU * ph) * env(t, 0.003, 0.03) * 0.12;
      lp.process(nz(), 220, 0.7);
      const knock = lp.lp * env(t, 0.002, 0.018) * 2.2;
      return Math.tanh((body + h2 + knock) * 1.25) * amp;
    },
    { pan, send: 0.05, fadeIn: 0.003, fadeOut: 0.04 },
  );
}

/** Lub on the frame, dub 7 frames later and softer. */
function heartbeat(frame: number, amp: number, label: string): void {
  thump(fs(frame), amp);
  thump(fs(frame + 7), amp * 0.62);
  duckAt(fs(frame), 0.35 * Math.min(1, amp / 0.55), 0.12);
  duckAt(fs(frame + 7), 0.22 * Math.min(1, amp / 0.55), 0.1);
  mark(fs(frame), `${label} lub`);
  mark(fs(frame + 7), `${label} dub`);
}

/** Felt sub accent scaled by an IMPACTS strength. */
function subAccent(t0: number, strength: number, f0 = 58, f1 = 34, tau = 0.4): void {
  if (strength <= 0) return;
  mono(
    t0,
    tau * 5,
    (t) => {
      const f = f1 + (f0 - f1) * Math.exp(-t / 0.08);
      return Math.sin(TAU * f * t) * env(t, 0.006, tau) * 0.55 * strength;
    },
    { fadeIn: 0.006, fadeOut: 0.15 },
  );
}

/** Struck bronze bell: inharmonic partials (ratio, amp, decay multiplier). */
const BRONZE: ReadonlyArray<readonly [number, number, number]> = [
  [0.5, 0.38, 1.7], // hum
  [1.0, 1.0, 1.0], // prime
  [1.183, 0.42, 0.75], // tierce (the minor third that makes a bell sound like a bell)
  [1.506, 0.22, 0.6], // quint
  [2.0, 0.36, 0.5], // nominal
  [2.514, 0.1, 0.36],
  [2.662, 0.13, 0.32],
  [3.011, 0.07, 0.26],
  [4.166, 0.04, 0.18],
  [5.433, 0.025, 0.12],
];

function bell(t0: number, hz: number, amp: number, o: { pan?: number; send?: number; decay: number; dur: number }): void {
  // restraint: no partial above 4.5 kHz
  const parts = BRONZE.filter(([r]) => hz * r < 4500);
  const nz = noise();
  const bp = new SVF();
  mono(
    t0,
    o.dur,
    (t) => {
      let v = 0;
      for (const [r, a, dm] of parts) {
        const f = hz * r;
        const e = Math.exp(-t / (o.decay * dm));
        // a slightly detuned twin gives the slow beating of real bronze
        v += a * e * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 1.0018 * t)) * 0.77;
      }
      bp.process(nz(), hz * 2.5, 1.5);
      const strike = bp.bp * env(t, 0.001, 0.006) * 0.35;
      return (v * Math.min(1, t / 0.002) + strike) * amp;
    },
    { pan: o.pan ?? 0, send: o.send ?? 0.45, fadeIn: 0.001, fadeOut: Math.min(0.6, o.dur * 0.3) },
  );
}

// ================================================================ 1. BED: drone + air
function bed(): void {
  const D1 = mtof(26); // 36.71 Hz
  const A1 = mtof(33); // 55 Hz
  const D2 = mtof(38);
  const A2 = mtof(45);
  const lpL = new SVF();
  const lpR = new SVF();
  const nL = noise();
  const nR = noise();
  const airL = new SVF();
  const airR = new SVF();
  const airL2 = new SVF();
  const airR2 = new SVF();
  let pD1 = 0, pA1 = 0, pD2 = 0;
  let s1 = 0.13, s2 = 0.57, s3 = 0.31, s4 = 0.89;
  const level = automation([
    [0, 0.72],
    [fs(S.triad), 0.88],
    [fs(S.specimens), 0.76],
    [fs(S.page), 0.6],
    [fs(S.resolve), 0.72],
    [T_END, 0.72],
  ]);
  const recede0 = T_END - 0.6;
  mark(0, "bed: D1+A1 drone and air fade in from silence (1.2 s)");
  mark(recede0, "bed: drone recedes (last 0.6 s)");
  for (let i = 0; i < NS; i++) {
    const t = i / SR;
    const fin = smooth(t / 1.2) ** 2; // from true silence
    const rec = t > recede0 ? 1 - 0.85 * smooth((t - recede0) / 0.6) : 1;
    const breathe = 0.5 - 0.5 * Math.cos(TAU * 0.14 * t);
    const fc = 150 + 240 * breathe + 120 * smooth((t - 4.5) / 4);
    pD1 += D1 / SR;
    pA1 += A1 / SR;
    pD2 += D2 / SR;
    const sub = Math.sin(TAU * pD1) * 0.42 + Math.sin(TAU * pA1) * 0.34 + Math.sin(TAU * pD2) * 0.12;
    s1 = (s1 + (D2 * 1.0025) / SR) % 1;
    s2 = (s2 + (A2 * 0.9978) / SR) % 1;
    s3 = (s3 + (D2 * 0.9972) / SR) % 1;
    s4 = (s4 + (A2 * 1.0021) / SR) % 1;
    lpL.process(blepSaw(s1, D2 / SR) + blepSaw(s2, A2 / SR) * 0.8, fc, 0.75);
    lpR.process(blepSaw(s3, D2 / SR) + blepSaw(s4, A2 / SR) * 0.8, fc, 0.75);
    // faint air: band-limited noise that breathes like a body in the dark
    airL.process(nL(), 2600, 0.6);
    airR.process(nR(), 2600, 0.6);
    airL2.process(airL.hp, 6500, 0.6);
    airR2.process(airR.hp, 6500, 0.6);
    const breath = 0.55 + 0.45 * (0.5 - 0.5 * Math.cos(TAU * 0.23 * t));
    const g = 0.22 * level(t) * fin * rec;
    const ga = 0.018 * breath * fin * rec * (t < fs(S.page) ? 1 : 1.25);
    const l = (sub + lpL.lp * 0.3) * g + airL2.lp * ga;
    const r = (sub + lpR.lp * 0.3) * g + airR2.lp * ga;
    BED.l[i] += l;
    BED.r[i] += r;
    BED_SEND.l[i] += lpL.lp * g * 0.15 + airL2.lp * ga * 0.6;
    BED_SEND.r[i] += lpR.lp * g * 0.15 + airR2.lp * ga * 0.6;
  }
}

// ================================================================ 2. HEARTBEAT
const HB = 0.55; // heartbeat lub level (dub is 0.62x)
function heartbeats(): void {
  CUE.heartbeats.forEach((f, k) => heartbeat(f, HB, `heartbeat ${k + 1}`));
  // ghost heartbeats on every bar downbeat after the hook, about -12 dB
  for (let f = Math.ceil(S.triad / BAR) * BAR; f < S.resolve; f += BAR) {
    heartbeat(f, HB * dbToGain(-12), `ghost heartbeat (bar ${f / BAR + 1})`);
  }
}

// ================================================================ 3. WITNESS: bronze bell
function witness(): void {
  const t = fs(CUE.witness);
  bell(t, mtof(62), 0.17, { pan: -0.08, send: 0.5, decay: 1.5, dur: 6.5 });
  bell(t + 0.004, mtof(50), 0.05, { pan: 0.1, send: 0.4, decay: 1.8, dur: 6.5 }); // D3 octave body
  subAccent(t, impact(CUE.witness) * 1.6, 60, 36, 0.45);
  duckAt(t, 0.3, 0.3);
  mark(t, "WITNESS: struck bronze bell D4 + soft sub");
}

// ================================================================ 4. SEVER: cut impact + tearing sweep
function sever(): void {
  const t = fs(CUE.sever);
  const s = impact(CUE.sever);
  // low tom
  let ph = 0;
  mono(
    t,
    1.0,
    (u) => {
      const f = 74 + 96 * Math.exp(-u / 0.035);
      ph += f / SR;
      const body = Math.sin(TAU * ph) * env(u, 0.002, 0.18) + Math.sin(TAU * 1.52 * ph) * env(u, 0.002, 0.05) * 0.3;
      return Math.tanh(body * 1.5) * 0.42 * s;
    },
    { send: 0.12, fadeIn: 0.002, fadeOut: 0.1 },
  );
  // transient click (band-passed, not a hiss)
  const nc = noise();
  const fc = new SVF();
  mono(
    t,
    0.06,
    (u) => {
      fc.process(nc(), 2400, 0.9);
      return fc.bp * env(u, 0.0005, 0.0045) * 0.5 * s;
    },
    { send: 0.2, fadeIn: 0.0005, fadeOut: 0.01 },
  );
  // tearing noise sweep, high -> low over ~0.35 s, grainy, panned along the cut
  const nL = noise();
  const nR = noise();
  const bl = new SVF();
  const br = new SVF();
  const grain = mulberry32(nextSeed());
  let g = 1;
  let gTarget = 1;
  const SWEEP = 0.35;
  stereo(
    t,
    0.5,
    (u, o) => {
      const p = clamp01(u / SWEEP);
      const f = 5200 * Math.pow(240 / 5200, p);
      if (Math.floor(u * SR) % 96 === 0) gTarget = 0.35 + 0.65 * grain(); // 2 ms grains
      g += (gTarget - g) * 0.08;
      bl.process(nL(), f, 1.6);
      br.process(nR(), f * 1.03, 1.6);
      const e = Math.min(1, u / 0.006) * Math.pow(1 - p, 0.7) * (u > SWEEP ? Math.exp(-(u - SWEEP) / 0.03) : 1);
      const [gl, gr] = panGains(0.6 - 1.2 * p);
      const a = 0.32 * s * e * g;
      o[0] = bl.bp * a * gl * 1.4;
      o[1] = br.bp * a * gr * 1.4;
    },
    { send: 0.35, fadeIn: 0.002, fadeOut: 0.05 },
  );
  subAccent(t, s * 0.7, 62, 32, 0.5);
  duckAt(t, 0.6, 0.32);
  mark(t, "SEVER: cut impact (low tom + click) + sub");
  mark(t, "SEVER: tearing noise sweep 5.2 kHz -> 240 Hz (0.35 s)");
}

// ================================================================ 5. PAD (from RIPEN) + shimmer
type Seg = { t0: number; t1: number; notes: number[]; att: number; rel: number; name: string };
function pad(): void {
  const segs: Seg[] = [
    { t0: fs(CUE.ripen), t1: fs(CUE.specimensPullback), notes: [50, 53, 57, 60, 64], att: 1.3, rel: 0.4, name: "Dm9" },
    { t0: fs(CUE.specimensPullback), t1: fs(S.somanauts), notes: [46, 50, 53, 57], att: 0.4, rel: 0.4, name: "Bbmaj7" },
    { t0: fs(S.somanauts), t1: fs(CUE.resolve), notes: [50, 53, 57, 64], att: 0.4, rel: 1.4, name: "Dm(add9)" },
  ];
  for (const sg of segs) mark(sg.t0, `pad: ${sg.name}`);
  const segEnv = (t: number, sg: Seg) => {
    if (t < sg.t0) return 0;
    const up = smooth((t - sg.t0) / sg.att);
    const down = t > sg.t1 ? 1 - smooth((t - sg.t1) / sg.rel) : 1;
    return up * down;
  };
  const pitches = [...new Set(segs.flatMap((s) => s.notes))].sort((a, b) => a - b);
  const level = automation([
    [fs(CUE.ripen), 1],
    [fs(S.specimens), 0.9],
    [fs(CUE.specimensPullback), 1.0],
    [fs(S.somanauts), 0.85],
    [fs(S.page), 0.55],
    [fs(CUE.pagePush), 0.5],
    [T_END, 0.5],
  ]);
  const padL = new Float64Array(NS);
  const padR = new Float64Array(NS);
  const i0 = Math.round(fs(CUE.ripen) * SR);
  const i1 = Math.min(NS, Math.round((fs(CUE.resolve) + 1.6) * SR));
  pitches.forEach((m, pi) => {
    const hz = mtof(m);
    const pan = -0.55 + (1.1 * pi) / Math.max(1, pitches.length - 1);
    const [gl, gr] = panGains(pan);
    let p1 = rng(), p2 = rng(), p3 = rng();
    const dt = hz / SR;
    for (let i = i0; i < i1; i++) {
      const t = i / SR;
      let a = 0;
      for (const sg of segs) if (sg.notes.includes(m)) a += segEnv(t, sg);
      if (a <= 0) {
        p1 = (p1 + dt * 1.0023) % 1;
        p2 = (p2 + dt * 0.9977) % 1;
        p3 = (p3 + dt) % 1;
        continue;
      }
      p1 = (p1 + dt * 1.0023) % 1;
      p2 = (p2 + dt * 0.9977) % 1;
      p3 = (p3 + dt) % 1;
      const v = (blepSaw(p1, dt) + blepSaw(p2, dt)) * 0.5 + Math.sin(TAU * p3) * 0.6;
      const g = v * a * 0.05;
      padL[i] += g * gl;
      padR[i] += g * gr;
    }
  });
  const fl = new SVF();
  const fr = new SVF();
  const fl2 = new SVF();
  const fr2 = new SVF();
  const tR = fs(CUE.ripen);
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const open = smooth((t - tR) / 1.5);
    const breathe = 0.5 - 0.5 * Math.cos(TAU * 0.11 * (t - tR));
    const dark = t > fs(S.page) ? 0.7 : 1;
    const fc = (260 + 1000 * open + 260 * breathe) * dark;
    fl.process(padL[i], fc, 0.7);
    fr.process(padR[i], fc, 0.7);
    fl2.process(fl.lp, fc * 1.5, 0.7);
    fr2.process(fr.lp, fc * 1.5, 0.7);
    const g = level(t);
    BED.l[i] += fl2.lp * g;
    BED.r[i] += fr2.lp * g;
    BED_SEND.l[i] += fl2.lp * g * 0.4;
    BED_SEND.r[i] += fr2.lp * g * 0.4;
  }
}

function ripen(): void {
  const t = fs(CUE.ripen);
  mark(t, "RIPEN: shimmer swell (Dm9 high partials)");
  // shimmer: slow-blooming high chord tones with gentle tremolo
  const notes = [74, 81, 84, 88]; // D5 A5 C6 E6
  notes.forEach((m, k) => {
    const hz = mtof(m);
    const rate = 3.2 + rng() * 3;
    const ph0 = rng() * TAU;
    mono(
      t,
      3.4,
      (u) => {
        const e = smooth(u / 0.9) * Math.exp(-Math.max(0, u - 0.9) / 1.1);
        const trem = 0.8 + 0.2 * Math.sin(TAU * rate * u + ph0);
        return (Math.sin(TAU * hz * u) + 0.15 * Math.sin(TAU * hz * 2 * u)) * e * trem * 0.022;
      },
      { pan: -0.5 + k * 0.33, send: 0.7, fadeIn: 0.01, fadeOut: 0.5 },
    );
  });
  // sparkles: a few soft glints scattered across the bloom
  const glints = [86, 89, 93, 88, 91, 86]; // D6 F6 A6 E6 G6 D6 (D Dorian)
  glints.forEach((m, k) => {
    const tg = t + 0.15 + k * 0.24 + rng() * 0.08;
    const hz = mtof(m);
    mono(
      tg,
      1.0,
      (u) => (Math.sin(TAU * hz * u) + 0.2 * Math.sin(TAU * hz * 2.76 * u) * Math.exp(-u / 0.04)) * env(u, 0.002, 0.22) * 0.02,
      { pan: rng() * 1.4 - 0.7, send: 0.75, fadeIn: 0.002, fadeOut: 0.3 },
    );
    mark(tg, `RIPEN: shimmer glint ${k + 1}`);
  });
  // a breath of rising air into the bloom
  const nz = noise();
  const hp = new SVF();
  mono(
    t,
    1.6,
    (u) => {
      hp.process(nz(), 3200, 0.7);
      return hp.hp * smooth(u / 0.7) * Math.exp(-Math.max(0, u - 0.7) / 0.35) * 0.02;
    },
    { pan: 0, send: 0.6, fadeIn: 0.01, fadeOut: 0.3 },
  );
  subAccent(t, impact(CUE.ripen), 55, 37, 0.5);
}

// ================================================================ 6. SPECIMENS
function specimens(): void {
  CUE.specimen.forEach((f, k) => {
    const t = fs(f);
    const pan = -0.3 + k * 0.3;
    const hit = 0.32;
    // soft low thud: felt, not loud
    let ph = 0;
    const nz = noise();
    const lp = new SVF();
    mono(
      t,
      0.6,
      (u) => {
        const fr = 46 + 22 * Math.exp(-u / 0.04);
        ph += fr / SR;
        lp.process(nz(), 260, 0.7);
        return (Math.sin(TAU * ph) * env(u, 0.004, 0.1) + lp.lp * env(u, 0.002, 0.016) * 1.6) * hit;
      },
      { pan: pan * 0.4, send: 0.1, fadeIn: 0.004, fadeOut: 0.06 },
    );
    subAccent(t, impact(f), 56, 40, 0.3);
    // glassy high tick
    const gh = mtof([86, 89, 93][k]); // D6 F6 A6
    mono(
      t + 0.004,
      0.5,
      (u) => (Math.sin(TAU * gh * u) * env(u, 0.001, 0.06) + 0.3 * Math.sin(TAU * gh * 2.76 * u) * env(u, 0.001, 0.015)) * 0.055,
      { pan, send: 0.45, fadeIn: 0.001, fadeOut: 0.1 },
    );
    duckAt(t, 0.2, 0.15);
    mark(t, `SPECIMEN ${String(k + 1).padStart(2, "0")}: soft thud + glass tick`);
    // typewriter ticks while the label scrambles in (<= -24 dB relative to the hit)
    const tickAmp = hit * dbToGain(-27);
    let tt = t + 0.05;
    let n = 0;
    while (tt < t + 0.4) {
      const nt = noise();
      const bp = new SVF();
      const tp = (rng() * 2 - 1) * 0.45;
      const fcen = 2600 + rng() * 1400;
      mono(
        tt,
        0.03,
        (u) => {
          bp.process(nt(), fcen, 1.3);
          return bp.bp * env(u, 0.0006, 0.004) * tickAmp;
        },
        { pan: tp, send: 0.15, fadeIn: 0.0006, fadeOut: 0.006 },
      );
      mark(tt, `SPECIMEN ${String(k + 1).padStart(2, "0")}: label tick ${++n}`);
      tt += 0.03 + rng() * 0.035;
    }
  });
}

// ================================================================ 7. PULLBACK: riser + chord lift
function pullback(): void {
  const t1 = fs(CUE.specimensPullback);
  const dur = 0.8;
  const nz = noise();
  const bp = new SVF();
  let ph = 0;
  mono(
    t1 - dur,
    dur,
    (u) => {
      const p = u / dur;
      bp.process(nz(), 320 * Math.pow(2400 / 320, p), 1.4);
      ph += (mtof(46) * Math.pow(2, p)) / SR; // Bb2 gliding up an octave, very soft
      return (bp.bp * 0.22 + Math.sin(TAU * ph) * 0.03) * Math.pow(p, 2.4);
    },
    { pan: 0, send: 0.35, fadeIn: 0.02, fadeOut: 0.02 },
  );
  mark(t1 - dur, "PULLBACK: gentle riser");
  // the lift itself: a warm Bb1 swell under the chord change
  mono(t1, 2.0, (u) => Math.sin(TAU * mtof(34) * u) * smooth(u / 0.08) * Math.exp(-u / 0.6) * 0.16, {
    fadeIn: 0.01,
    fadeOut: 0.3,
  });
  subAccent(t1, impact(CUE.specimensPullback), 50, 36, 0.3);
  mark(t1, "PULLBACK: chord lift to Bbmaj7 + Bb1 swell");
}

// ================================================================ 8. SOMANAUTS: four character tones
function somanauts(): void {
  CUE.somanaut.forEach((f, k) => {
    const t = fs(f);
    const sm = SOMANAUTS[k];
    const hz = mtof(sm.note);
    const pan = -0.45 + k * 0.3;
    const opts = { pan, send: 0.42, fadeIn: 0.003, fadeOut: 0.08 };
    switch (sm.wave) {
      case "step": {
        // soft band-limited pulse with a quick stepped staircase A3 -> C4 -> D4
        const glide = new OnePole(mtof(sm.note - 5)); // ~0.5 ms portamento keeps the steps click-free
        const lp = new SVF();
        let ph = 0;
        mono(
          t,
          0.45,
          (u) => {
            const step = u < 0.035 ? -5 : u < 0.07 ? -2 : 0;
            const fr = glide.process(mtof(sm.note + step), 300);
            ph = (ph + fr / SR) % 1;
            let v = 0;
            const duty = 0.3;
            for (let h = 1; h * fr < 3600; h++) v += ((2 / (h * Math.PI)) * Math.sin(h * Math.PI * duty)) * Math.cos(TAU * h * ph);
            lp.process(v, 2000, 0.7);
            return lp.lp * env(u, 0.004, 0.12) * 0.16;
          },
          opts,
        );
        break;
      }
      case "sine": {
        // pure sine with gentle vibrato that blooms in
        let ph = 0;
        mono(
          t,
          0.5,
          (u) => {
            const vib = 1 + 0.008 * smooth(u / 0.15) * Math.sin(TAU * 5.5 * u);
            ph += (hz * vib) / SR;
            return Math.sin(TAU * ph) * env(u, 0.018, 0.16) * 0.15;
          },
          opts,
        );
        break;
      }
      case "guard": {
        // firm low-mid pulse (A4 over an A3 body) + a short "shield" resonance
        let p1 = 0, p2 = 0;
        const lp = new SVF();
        const nz = noise();
        const res = new SVF();
        mono(
          t,
          0.45,
          (u) => {
            p1 = (p1 + hz / SR) % 1;
            p2 = (p2 + hz / 2 / SR) % 1;
            const tri = 1 - 4 * Math.abs(p1 - Math.floor(p1 + 0.5));
            lp.process(tri * 0.6 + Math.sin(TAU * p2) * 0.7, 1500, 0.7);
            const hold = u < 0.06 ? Math.min(1, u / 0.006) : Math.exp(-(u - 0.06) / 0.08);
            res.process(nz(), hz * 3, 22);
            const shield = res.bp * env(u - 0.01, 0.004, 0.09) * 0.9;
            return (lp.lp * hold + shield) * 0.15;
          },
          opts,
        );
        break;
      }
      case "ecg": {
        // ECG monitor beep: pure tone, raised-cosine gate (crisp, click-free), one tiny echo
        const beep = (t0: number, amp: number, p: number) =>
          mono(
            t0,
            0.2,
            (u) => {
              const on = 0.004;
              const len = 0.12;
              const g = u < on ? 0.5 - 0.5 * Math.cos((Math.PI * u) / on) : u < len - on ? 1 : u < len ? 0.5 + 0.5 * Math.cos((Math.PI * (u - (len - on))) / on) : 0;
              return Math.sin(TAU * hz * u) * g * amp;
            },
            { pan: p, send: 0.42, fadeIn: 0.001, fadeOut: 0.01 },
          );
        beep(t, 0.11, pan);
        beep(t + 0.17, 0.035, -pan);
        mark(t + 0.17, `SOMANAUT ${sm.name}: ECG echo`);
        break;
      }
    }
    subAccent(t, impact(f), 52, 40, 0.25);
    mark(t, `SOMANAUT ${sm.name} (${sm.wave}, MIDI ${sm.note})`);
  });
}

// ================================================================ 9. PAGE: paper whoosh + reverse swell
function page(): void {
  const t = fs(CUE.pageRise);
  const nL = noise();
  const nR = noise();
  const bl = new SVF();
  const br = new SVF();
  const hl = new SVF();
  const hr = new SVF();
  const flutter = mulberry32(nextSeed());
  let fl = 1;
  let ft = 1;
  const dur = 0.75;
  stereo(
    t,
    dur,
    (u, o) => {
      const p = u / dur;
      const fc = 700 * Math.pow(2600 / 700, Math.sin((Math.PI * p) / 2));
      bl.process(nL(), fc, 0.8);
      br.process(nR(), fc, 0.8);
      hl.process(nL(), 4200, 0.7);
      hr.process(nR(), 4200, 0.7);
      if (Math.floor(u * SR) % 960 === 0) ft = 0.75 + 0.25 * flutter(); // paper flutter
      fl += (ft - fl) * 0.01;
      const e = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.75)), 2) * fl * 0.16;
      const [gl, gr] = panGains(-0.75 + 1.5 * p);
      o[0] = (bl.bp + hl.hp * 0.12) * e * gl;
      o[1] = (br.bp + hr.hp * 0.12) * e * gr;
    },
    { send: 0.3, fadeIn: 0.01, fadeOut: 0.02 },
  );
  mark(t, "PAGE RISE: paper whoosh L -> R");

  // reverse swell: a bell + pad rendered forward, then reversed so it rises into the downbeat
  const t0 = fs(CUE.pagePush);
  const t1 = fs(CUE.resolve);
  const n = Math.round((t1 - t0) * SR);
  const fwdL = new Float64Array(n);
  const fwdR = new Float64Array(n);
  const nz = noise();
  const smear = new SVF();
  const bellHz = [mtof(62), mtof(57)];
  for (let k = 0; k < n; k++) {
    const u = k / SR;
    let b = 0;
    for (const hz of bellHz) for (const [r, a, dm] of BRONZE.slice(0, 5)) b += a * Math.sin(TAU * hz * r * u) * Math.exp(-u / (0.22 * dm));
    const pd = (Math.sin(TAU * mtof(50) * u) + Math.sin(TAU * mtof(57) * u * 1.002)) * Math.exp(-u / 0.32);
    smear.process(nz(), 1400, 0.6);
    const sm = smear.lp * Math.exp(-u / 0.2) * 0.5;
    fwdL[k] = b * 0.06 + pd * 0.07 + sm;
    fwdR[k] = b * 0.06 + pd * 0.07 - sm;
  }
  stereo(
    t0,
    n / SR,
    (u, o) => {
      const k = Math.min(n - 1, Math.round(u * SR));
      o[0] = fwdL[n - 1 - k];
      o[1] = fwdR[n - 1 - k];
    },
    { send: 0.5, fadeIn: 0.03, fadeOut: 0.006 },
  );
  mark(t0, "PAGE PUSH: reverse bell/pad swell rising into the resolve");
}

// ================================================================ 10. RESOLVE: arrival
function resolveCue(): void {
  const t = fs(CUE.resolve);
  const chord = [50, 57, 62, 65, 76]; // D3 A3 D4 F4 E5 (D minor add9)
  const amps = [0.095, 0.08, 0.088, 0.066, 0.03];
  const remain = T_END - t;
  chord.forEach((m, k) => {
    bell(t + k * 0.011, mtof(m), amps[k], { pan: -0.4 + k * 0.2, send: 0.55, decay: 1.05, dur: remain - k * 0.011 });
  });
  subAccent(t, impact(CUE.resolve), 56, 30, 0.6);
  heartbeat(CUE.resolve, HB * 0.7, "RESOLVE final heartbeat");
  duckAt(t, 0.45, 0.4);
  mark(t, "RESOLVE: bell chord D3 A3 D4 F4 E5 + sub drop");
}

// ================================================================ compose
bed();
heartbeats();
witness();
sever();
pad();
ripen();
specimens();
pullback();
somanauts();
page();
resolveCue();

// ================================================================ reverb (Freeverb-style, stereo)
function freeverb(inL: Float64Array, inR: Float64Array, roomFb: number, damp: number): Bus {
  const out = mkBus();
  const scale = SR / 44100;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const spread = 23;
  const chans: Array<[Float64Array, Float64Array, number]> = [
    [inL, out.l, 0],
    [inR, out.r, spread],
  ];
  for (const [inp, dst, off] of chans) {
    // pre-filter the send: keep sub out of the room, soften the top
    const hp = new SVF();
    const lp = new SVF();
    const pre = new Float64Array(NS);
    for (let i = 0; i < NS; i++) {
      hp.process(inp[i], 180, 0.7);
      lp.process(hp.hp, 5500, 0.7);
      pre[i] = lp.lp;
    }
    for (const d of combT) {
      const buf = new Float64Array(Math.round((d + off) * scale));
      let p = 0;
      let store = 0;
      for (let i = 0; i < NS; i++) {
        const y = buf[p];
        store = y * (1 - damp) + store * damp;
        buf[p] = pre[i] * 0.06 + store * roomFb;
        p = p + 1 === buf.length ? 0 : p + 1;
        dst[i] += y;
      }
    }
    for (const d of apT) {
      const buf = new Float64Array(Math.round((d + off) * scale));
      let p = 0;
      for (let i = 0; i < NS; i++) {
        const b = buf[p];
        const x = dst[i];
        buf[p] = x + b * 0.5;
        dst[i] = b - x;
        p = p + 1 === buf.length ? 0 : p + 1;
      }
    }
  }
  return out;
}

const sendL = new Float64Array(NS);
const sendR = new Float64Array(NS);
for (let i = 0; i < NS; i++) {
  sendL[i] = SEND.l[i] + BED_SEND.l[i] * duck[i];
  sendR[i] = SEND.r[i] + BED_SEND.r[i] * duck[i];
}
const WET = 1.0;
const rev = freeverb(sendL, sendR, 0.84, 0.42);

// ================================================================ master bus
const L = new Float64Array(NS);
const R = new Float64Array(NS);
for (let i = 0; i < NS; i++) {
  L[i] = DRY.l[i] + BED.l[i] * duck[i] + rev.l[i] * WET;
  R[i] = DRY.r[i] + BED.r[i] * duck[i] + rev.r[i] * WET;
}

// DC / subsonic: 2nd-order 18 Hz high-pass
for (const ch of [L, R]) {
  const f = new SVF();
  for (let i = 0; i < NS; i++) {
    f.process(ch[i], 18, 0.707);
    ch[i] = f.hp;
  }
}

// head and tail: start from silence; land the tail at ~-30 dB in the last 0.15 s and zero at the end
{
  const fi = Math.round(0.05 * SR);
  const fo0 = Math.round((T_END - 0.8) * SR); // tail fade over the last 0.8 s
  for (let i = 0; i < NS; i++) {
    let g = 1;
    if (i < fi) g = (i / fi) ** 2;
    if (i >= fo0) {
      const u = (i - fo0) / (NS - 1 - fo0);
      g *= Math.pow(0.5 * (1 + Math.cos(Math.PI * u)), 1.5);
    }
    L[i] *= g;
    R[i] *= g;
  }
  L[0] = R[0] = L[NS - 1] = R[NS - 1] = 0;
}

// ================================================================ measurement (BS.1770-4)
/** K-weighting at 48 kHz (BS.1770 published coefficients). */
function kWeight(x: Float64Array): Float64Array {
  const y = new Float64Array(x.length);
  const s1 = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] };
  const s2 = { b: [1.0, -2.0, 1.0], a: [-1.99004745483398, 0.99007225036621] };
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let z1 = 0, z2 = 0, w1 = 0, w2 = 0;
  for (let i = 0; i < x.length; i++) {
    const a = s1.b[0] * x[i] + s1.b[1] * x1 + s1.b[2] * x2 - s1.a[0] * y1 - s1.a[1] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = a;
    const b = s2.b[0] * a + s2.b[1] * z1 + s2.b[2] * z2 - s2.a[0] * w1 - s2.a[1] * w2;
    z2 = z1; z1 = a; w2 = w1; w1 = b;
    y[i] = b;
  }
  return y;
}

function integratedLufs(l: Float64Array, r: Float64Array): number {
  const kl = kWeight(l);
  const kr = kWeight(r);
  const block = Math.round(0.4 * SR);
  const step = Math.round(0.1 * SR);
  const z: number[] = [];
  for (let s = 0; s + block <= NS; s += step) {
    let a = 0, b = 0;
    for (let i = s; i < s + block; i++) {
      a += kl[i] * kl[i];
      b += kr[i] * kr[i];
    }
    z.push((a + b) / block);
  }
  const lk = (e: number) => -0.691 + 10 * Math.log10(Math.max(e, 1e-20));
  const abs = z.filter((e) => lk(e) > -70);
  const rel = lk(abs.reduce((p, c) => p + c, 0) / abs.length) - 10;
  const gated = abs.filter((e) => lk(e) > rel);
  return lk(gated.reduce((p, c) => p + c, 0) / gated.length);
}

// 4x-oversampling interpolator (Blackman-windowed sinc, 24 taps per phase)
const TP_HALF = 12;
const TP_COEF: Float64Array[] = [1, 2, 3].map((p) => {
  const c = new Float64Array(2 * TP_HALF);
  for (let j = 0; j < 2 * TP_HALF; j++) {
    const m = j - TP_HALF + 1; // offsets -11..12
    const a = p / 4 - m;
    const sinc = a === 0 ? 1 : Math.sin(Math.PI * a) / (Math.PI * a);
    const w = 0.42 + 0.5 * Math.cos((Math.PI * a) / TP_HALF) + 0.08 * Math.cos((2 * Math.PI * a) / TP_HALF);
    c[j] = sinc * w;
  }
  return c;
});

/** Per-sample true-peak envelope (max over the sample and its three 4x interpolants, both channels). */
function truePeakEnvelope(l: Float64Array, r: Float64Array): Float64Array {
  const env = new Float64Array(NS);
  for (let i = 0; i < NS; i++) {
    let pk = Math.max(Math.abs(l[i]), Math.abs(r[i]));
    if (i >= TP_HALF && i < NS - TP_HALF) {
      for (const c of TP_COEF) {
        let yl = 0, yr = 0;
        for (let j = 0; j < 2 * TP_HALF; j++) {
          const k = i + j - TP_HALF + 1;
          yl += l[k] * c[j];
          yr += r[k] * c[j];
        }
        pk = Math.max(pk, Math.abs(yl), Math.abs(yr));
      }
    }
    env[i] = pk;
  }
  return env;
}

const maxOf = (a: Float64Array) => {
  let m = 0;
  for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i];
  return m;
};

// ================================================================ normalisation + look-ahead true-peak limiter
const TARGET_LUFS = -14;
const TP_LIMIT = -1.5;
const TP_AIM = -2.0; // internal ceiling, 0.5 dB margin vs ffmpeg's resampler
const tpEnv = truePeakEnvelope(L, R);
const LA = Math.round(0.005 * SR); // 5 ms look-ahead
const REL = Math.exp(-1 / (0.15 * SR)); // 150 ms release

function limit(gain: number, ceil: number): { l: Float64Array; r: Float64Array; maxGr: number } {
  // required gain per sample
  const req = new Float64Array(NS);
  for (let i = 0; i < NS; i++) {
    const p = tpEnv[i] * gain;
    req[i] = p > ceil ? ceil / p : 1;
  }
  // min over the next LA samples (monotone deque)
  const hold = new Float64Array(NS);
  const dq = new Int32Array(NS + LA + 1);
  let h = 0, tl = 0;
  // scan right-to-left; deque front holds the index of the window minimum for [j, j+LA]
  for (let j = NS - 1; j >= 0; j--) {
    while (tl > h && req[dq[tl - 1]] >= req[j]) tl--;
    dq[tl++] = j;
    while (dq[h] > j + LA) h++;
    hold[j] = req[dq[h]];
  }
  // box-average the hold over the past LA samples -> gain is at target by every peak
  const sm = new Float64Array(NS);
  let acc = 0;
  for (let i = 0; i < NS; i++) {
    acc += hold[i];
    if (i > LA) acc -= hold[i - LA - 1];
    sm[i] = acc / Math.min(i + 1, LA + 1);
    if (i < LA) sm[i] = Math.min(sm[i], hold[i]);
  }
  const ol = new Float64Array(NS);
  const or = new Float64Array(NS);
  let g = 1;
  let maxGr = 0;
  for (let i = 0; i < NS; i++) {
    const want = sm[i];
    g = want < g ? want : g + (want - g) * (1 - REL);
    if (g > want) g = want;
    maxGr = Math.max(maxGr, -gainToDb(g));
    ol[i] = L[i] * gain * g;
    or[i] = R[i] * gain * g;
  }
  return { l: ol, r: or, maxGr };
}

const t0Run = performance.now();
const lufs0 = integratedLufs(L, R);
let gain = dbToGain(TARGET_LUFS - lufs0);
let ceil = dbToGain(TP_AIM);
let res = limit(gain, ceil);
let lufs = integratedLufs(res.l, res.r);
let tp = gainToDb(maxOf(truePeakEnvelope(res.l, res.r)));
for (let pass = 0; pass < 10; pass++) {
  console.log(`pass ${pass + 1}: ${lufs.toFixed(2)} LUFS, true peak ${tp.toFixed(2)} dBTP, max GR ${res.maxGr.toFixed(1)} dB`);
  if (Math.abs(lufs - TARGET_LUFS) < 0.1 && tp <= TP_AIM + 0.1) break;
  if (tp > TP_AIM + 0.1) ceil *= dbToGain(TP_AIM - tp - 0.02);
  gain *= dbToGain(TARGET_LUFS - lufs);
  res = limit(gain, ceil);
  lufs = integratedLufs(res.l, res.r);
  tp = gainToDb(maxOf(truePeakEnvelope(res.l, res.r)));
}
if (tp > TP_LIMIT) throw new Error(`true peak ${tp.toFixed(2)} dBTP exceeds ${TP_LIMIT}`);

// ================================================================ WAV (16-bit PCM)
const pcm = new Int16Array(NS * 2);
for (let i = 0; i < NS; i++) {
  pcm[2 * i] = Math.max(-32768, Math.min(32767, Math.round(res.l[i] * 32767)));
  pcm[2 * i + 1] = Math.max(-32768, Math.min(32767, Math.round(res.r[i] * 32767)));
}
const dataSize = pcm.byteLength;
const header = new DataView(new ArrayBuffer(44));
const ascii = (o: number, s: string) => {
  for (let k = 0; k < s.length; k++) header.setUint8(o + k, s.charCodeAt(k));
};
ascii(0, "RIFF");
header.setUint32(4, 36 + dataSize, true);
ascii(8, "WAVE");
ascii(12, "fmt ");
header.setUint32(16, 16, true);
header.setUint16(20, 1, true); // PCM
header.setUint16(22, 2, true); // stereo
header.setUint32(24, SR, true);
header.setUint32(28, SR * 4, true);
header.setUint16(32, 4, true);
header.setUint16(34, 16, true);
ascii(36, "data");
header.setUint32(40, dataSize, true);

mkdirSync(OUT_DIR, { recursive: true });
const wavPath = join(OUT_DIR, "audio.wav");
await Bun.write(wavPath, new Blob([header.buffer, new Uint8Array(pcm.buffer)]));

cueLog.sort((a, b) => a.t_seconds - b.t_seconds || a.label.localeCompare(b.label));
const cuesPath = join(OUT_DIR, "audio-cues.json");
await Bun.write(
  cuesPath,
  JSON.stringify({ sampleRate: SR, frames: NS, seconds: T_END, fps: FPS, bpm: (60 * FPS) / BEAT, events: cueLog }, null, 2) + "\n",
);

// ================================================================ self-report
const peakDb = (a: number, b: number) => {
  let m = 0;
  for (let i = a; i < b; i++) m = Math.max(m, Math.abs(pcm[2 * i]), Math.abs(pcm[2 * i + 1]));
  return gainToDb(m / 32768);
};
const rmsDb = (a: number, b: number) => {
  let s = 0;
  for (let i = a; i < b; i++) s += (pcm[2 * i] / 32768) ** 2 + (pcm[2 * i + 1] / 32768) ** 2;
  return 10 * Math.log10(Math.max(s / (2 * (b - a)), 1e-20));
};
const ms10 = Math.round(0.01 * SR);
const last15 = Math.round(0.15 * SR);
console.log(`input ${lufs0.toFixed(2)} LUFS -> gain ${gainToDb(gain).toFixed(2)} dB`);
console.log(`integrated ${lufs.toFixed(2)} LUFS (internal), true peak ${tp.toFixed(2)} dBTP (internal), max GR ${res.maxGr.toFixed(1)} dB`);
console.log(`first 10 ms peak ${peakDb(0, ms10).toFixed(1)} dBFS, last 10 ms peak ${peakDb(NS - ms10, NS).toFixed(1)} dBFS`);
console.log(`last 0.15 s: peak ${peakDb(NS - last15, NS).toFixed(1)} dBFS, rms ${rmsDb(NS - last15, NS).toFixed(1)} dBFS`);
console.log(`events ${cueLog.length} -> ${cuesPath}`);
console.log(`wrote ${wavPath}: ${NS} frames, ${(NS / SR).toFixed(3)} s, ${SR} Hz stereo 16-bit (master ${((performance.now() - t0Run) / 1000).toFixed(2)} s)`);
