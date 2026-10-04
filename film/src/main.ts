// Boot (fonts → covers → GL warm-up), the frame compositor, and two harness modes:
// ?render pushes raw RGBA frames to the local capture server; otherwise a scrubber
// with synced audio for live preview.
import { BOOKS, FPS, H, N, S, W } from "./timeline.ts";
import { FACES, rangeOf } from "./tokens.ts";
import { layer } from "./lib/canvas.ts";
import { Field, Quads } from "./gl.ts";
import { type Stage, backdrop, finish, hud, shake } from "./stage.ts";
import { hook } from "./scenes/hook.ts";
import { triad } from "./scenes/triad.ts";
import { specimens } from "./scenes/specimens.ts";
import { somanauts } from "./scenes/somanauts.ts";
import { page } from "./scenes/page.ts";
import { resolve } from "./scenes/resolve.ts";

const params = new URLSearchParams(location.search);
const renderMode = params.has("render");

const post = (path: string, body: BodyInit) => fetch(path, { method: "POST", body });
const log = (m: string) => (renderMode ? void post("/log", m) : console.log(m));

async function loadFonts() {
  // load in parallel, but register in a fixed order with explicit unicode ranges: two
  // subset files of one family must never compete for the same glyph (determinism)
  const faces = FACES.map((fc) => new FontFace(fc.family, `url(/fonts/${fc.file})`, { weight: fc.weight, style: fc.style, unicodeRange: rangeOf(fc.file) }));
  await Promise.all(faces.map((fc) => fc.load()));
  for (const fc of faces) document.fonts.add(fc);
  await document.fonts.ready;
  const specs = ['400 40px "Cinzel"', '700 40px "Cinzel"', '400 30px "EB Garamond"', 'italic 400 30px "EB Garamond"', '400 20px "Fira Code"', '500 20px "Fira Code"'];
  const missing = specs.filter((s) => !document.fonts.check(s, "Khalorēē ABC"));
  if (missing.length) throw new Error(`fonts missing: ${missing.join(", ")}`);
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => im.decode().then(() => res(im), rej);
    im.onerror = () => rej(new Error(`image ${src}`));
    im.src = src;
  });

function render(st: Stage, f: number) {
  const main = st.ctx;
  main.setTransform(1, 0, 0, 1, 0, 0);
  main.globalAlpha = 1;
  main.filter = "none";
  main.globalCompositeOperation = "source-over";
  backdrop(st, f);
  const [sc, sx] = layer(0);
  const view: Stage = { ...st, ctx: sx };
  if (f < S.triad) hook(sx, f);
  else if (f < S.specimens) triad(sx, f);
  else if (f < S.somanauts) specimens(view, f);
  else if (f < S.page) somanauts(sx, f);
  else if (f < S.resolve) page(view, f);
  else resolve(sx, f);
  const sh = shake(f);
  main.drawImage(sc, sh.x, sh.y);
  hud(main, f);
  finish(main, f);
}

/** Readback self-test: a browser that perturbs canvas reads (fingerprint shields) would corrupt frames. */
function selfTest(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0A1628";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#C4873B";
  ctx.fillRect(16, 16, 32, 32);
  const d = ctx.getImageData(0, 0, 64, 64).data;
  let bad = 0;
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4, inner = x >= 16 && x < 48 && y >= 16 && y < 48;
      const [r, g, b] = inner ? [196, 135, 59] : [10, 22, 40];
      if (d[i] !== r || d[i + 1] !== g || d[i + 2] !== b) bad++;
    }
  return bad;
}

async function boot() {
  const t0 = performance.now();
  await loadFonts();
  const canvas = document.getElementById("reel") as HTMLCanvasElement;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false })!;
  const st: Stage = { ctx, field: new Field(0.5), quads: new Quads(), img: {} };
  for (const [i, b] of BOOKS.entries()) {
    st.img[`book${i}`] = await loadImage(`/assets/${b.cover}`);
    st.quads.upload(`book${i}`, st.img[`book${i}`]);
  }
  render(st, 0);
  log(`boot ${((performance.now() - t0) / 1000).toFixed(1)}s`);
  (window as unknown as { __reel: unknown }).__reel = { render: (f: number) => render(st, f), N };

  if (renderMode) {
    const bad = selfTest(ctx);
    log(`readback self-test mismatches: ${bad}`);
    if (bad > 0) throw new Error(`canvas readback perturbed (${bad} px) — use plain Chromium (REEL_BROWSER)`);
    const list: number[] = await (await fetch("/frames")).json();
    for (const f of list) {
      render(st, f);
      const px = ctx.getImageData(0, 0, W, H).data;
      await fetch(`/frame?f=${f}`, { method: "POST", body: px });
    }
    await post("/done", "ok");
    return;
  }

  // ── dev: scrubber + audio
  document.body.classList.add("dev");
  const scrub = document.getElementById("scrub") as HTMLInputElement;
  const status = document.getElementById("status")!;
  const play = document.getElementById("play") as HTMLButtonElement;
  const audio = document.getElementById("audio") as HTMLAudioElement;
  let f = Number(params.get("f") ?? 0), playing = false;
  scrub.max = String(N - 1);
  const show = () => {
    render(st, f);
    scrub.value = String(f);
    status.textContent = `f ${f} · ${(f / FPS).toFixed(2)}s`;
  };
  scrub.oninput = () => { f = Number(scrub.value); if (playing) audio.currentTime = f / FPS; show(); };
  play.onclick = () => {
    playing = !playing;
    play.textContent = playing ? "pause" : "play";
    if (playing) { if (f >= N - 1) f = 0; audio.currentTime = f / FPS; void audio.play().catch(() => {}); } else audio.pause();
  };
  const tick = () => {
    if (playing) {
      const nf = Math.min(N - 1, Math.floor(audio.currentTime * FPS));
      if (nf !== f) { f = nf; show(); }
      if (audio.ended) { playing = false; play.textContent = "play"; }
    }
    requestAnimationFrame(tick);
  };
  show();
  requestAnimationFrame(tick);
}

boot().catch((e) => {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  console.error(msg);
  if (renderMode) void post("/error", msg);
});
