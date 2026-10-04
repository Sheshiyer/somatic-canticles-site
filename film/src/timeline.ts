// Shared cue list: the picture (src/scenes/*) and the score (tools/audio.ts) both
// read this file, so sync is exact by construction. 120 BPM, 60 fps → 1 beat = 30 frames.

export const FPS = 60;
export const N = 900; // 15.000 s
export const BEAT = 30;
export const BAR = BEAT * 4;
export const W = 1920;
export const H = 1080;

/** Scene starts (frames). Each scene runs until the next start. */
export const S = {
  hook: 0,
  triad: 150,
  specimens: 330,
  somanauts: 570,
  page: 720,
  resolve: 810,
  end: N,
} as const;

/** Frame-exact events, shared by picture and sound. */
export const CUE = {
  /** ECG spikes and heartbeats (lub; dub follows 7 frames later). */
  heartbeats: [30, 60, 90, 120],
  hookTextIn: 6,
  vineRise: 110,
  witness: 150,
  sever: 210,
  ripen: 270,
  specimen: [330, 390, 450] as const,
  specimensPullback: 510,
  somanaut: [570, 600, 630, 660] as const,
  pageRise: 720,
  pagePush: 770,
  resolve: 810,
  wordmark: 832,
  tagline: 848,
  url: 858,
  settled: 872, // everything on screen is settled from here to the end
} as const;

/** Camera/energy impacts: [frame, strength]. Picture uses them for micro-shake; score for accents. */
export const IMPACTS: ReadonlyArray<readonly [number, number]> = [
  [CUE.witness, 0.35],
  [CUE.sever, 0.9],
  [CUE.ripen, 0.3],
  [CUE.specimen[0], 0.25],
  [CUE.specimen[1], 0.25],
  [CUE.specimen[2], 0.25],
  [CUE.specimensPullback, 0.15],
  ...CUE.somanaut.map((f) => [f, 0.12] as const),
  [CUE.resolve, 0.55],
];

/** Somanaut readouts, verbatim from content/COPY.md (somanauts) with their tone in D Dorian. */
export const SOMANAUTS = [
  { name: "JIAN", verb: "MAPS", role: "THE NEURO-CARTOGRAPHER", wave: "step", note: 62 /* D4 */ },
  { name: "SONA", verb: "RESONATES", role: "THE BIO-ACOUSTIC ENGINEER", wave: "sine", note: 65 /* F4 */ },
  { name: "GIDEON", verb: "PROTECTS", role: "THE SYSTEMS IMMUNOLOGIST", wave: "guard", note: 69 /* A4 */ },
  { name: "CORV", verb: "WITNESSES", role: "THE PSYCHO-PATHOLOGIST & TEAM LEAD", wave: "ecg", note: 72 /* C5 */ },
] as const;

export const BOOKS = [
  { n: "01", title: "THE ANAMNESIS ENGINE", ch: "CH. 1–8", cover: "cover-book1.webp" },
  { n: "02", title: "THE MYOCARDIAL CHORUS", ch: "CH. 9–15", cover: "cover-book2.webp" },
  { n: "03", title: "THE RIPENING", ch: "CH. 16–27", cover: "cover-book3.webp" },
] as const;

export const sec = (f: number) => f / FPS;
