// Headless capture: spawn plain Chromium (the chrome-headless-shell Hyperframes
// provisioned), let the page push raw RGBA frames to the local server, and stream them
// straight into ffmpeg. No Remotion, no Playwright. Adapted from the Cambium reel.
//
//   bun tools/render.ts                         1920x1080@60 → out/video.mp4
//   bun tools/render.ts --preview               960x540@30 → out/preview.mp4 (fast)
//   bun tools/render.ts --stills 0,150,450      PNG stills → out/stills/
//   bun tools/render.ts --frames 330-569        partial range
//   bun tools/render.ts --hash a [--shuffle]    determinism manifest → out/hashes-<tag>.json
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { startServer } from "./serve.ts";
import { N } from "../src/timeline.ts";

const FILM = resolve(import.meta.dir, "..");
const OUT = join(FILM, "out");
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);

const preview = flag("--preview");
const stills = opt("--stills");
const hashTag = opt("--hash");
const shuffle = flag("--shuffle");
const step = preview ? 2 : 1;
const fps = 60 / step;
const W = 1920, H = 1080;
const outFile = opt("--out") ?? join(OUT, preview ? "preview.mp4" : "video.mp4");

let frames: number[] = [];
if (stills) frames = stills.split(",").map(Number);
else {
  const [a, b] = (opt("--frames") ?? `0-${N - 1}`).split("-").map(Number);
  for (let f = a; f <= b; f += step) frames.push(f);
}
if (shuffle) {
  let s = 1234567;
  for (let i = frames.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [frames[i], frames[j]] = [frames[j], frames[i]];
  }
}
mkdirSync(join(OUT, "stills"), { recursive: true });

function findBrowser() {
  const shellRoot = join(homedir(), ".cache", "hyperframes", "chrome", "chrome-headless-shell");
  const shells = existsSync(shellRoot)
    ? readdirSync(shellRoot).sort().reverse().map((v) => join(shellRoot, v, "chrome-headless-shell-mac-arm64", "chrome-headless-shell"))
    : [];
  const c = [process.env.REEL_BROWSER, ...shells, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"].filter(Boolean) as string[];
  const b = c.find((p) => existsSync(p));
  if (!b) throw new Error("No Chromium-family browser found; set REEL_BROWSER");
  return b;
}

// ── ffmpeg sink
let ff: ReturnType<typeof Bun.spawn> | null = null;
if (!stills && !hashTag) {
  const vf = preview
    ? "scale=960:540:flags=lanczos,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
    : "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p";
  const codec = preview
    ? ["-c:v", "h264_videotoolbox", "-b:v", "10M", "-profile:v", "high"]
    : ["-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "14", "-tune", "grain"];
  ff = Bun.spawn(
    [
      "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
      "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(fps), "-i", "-",
      "-vf", `${vf},setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`,
      ...codec,
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
      "-movflags", "+faststart", "-fflags", "+bitexact", "-map_metadata", "-1",
      outFile,
    ],
    { stdin: "pipe", stdout: "inherit", stderr: "inherit" },
  );
}

async function writeStill(f: number, data: Uint8Array) {
  // via a temp file: a pipe hands ffmpeg's rawvideo demuxer partial packets
  const raw = join(OUT, "stills", `.f${f}.rgba`);
  await Bun.write(raw, data);
  const p = Bun.spawn(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", raw, "-frames:v", "1", join(OUT, "stills", `f${String(f).padStart(4, "0")}.png`)]);
  await p.exited;
  await Bun.file(raw).delete();
}

const hashes: Record<number, string> = {};
let booted = false, received = 0;
const t0 = performance.now();
let finish!: () => void, fail!: (e: Error) => void;
const done = new Promise<void>((res, rej) => { finish = res; fail = rej; });

const server = startServer({
  async onFrame(f, data) {
    if (data.length !== W * H * 4) throw new Error(`frame ${f}: got ${data.length} bytes`);
    if (frames[received] !== f) throw new Error(`out-of-order frame ${f}, expected ${frames[received]}`);
    received++;
    if (hashTag) hashes[f] = new Bun.CryptoHasher("sha256").update(data).digest("hex");
    if (stills) await writeStill(f, data);
    if (ff) {
      (ff.stdin as import("bun").FileSink).write(data);
      await (ff.stdin as import("bun").FileSink).flush();
    }
    if (received % 60 === 0 || received === frames.length) {
      const s = (performance.now() - t0) / 1000;
      console.log(`  ${received}/${frames.length} frames  ${((s / received) * 1000).toFixed(0)} ms/frame`);
    }
  },
  onDone: () => finish(),
  onError: (m) => fail(new Error(m)),
  onLog: (m) => { booted = true; console.log("[page]", m); },
  frames,
});

const browserPath = findBrowser();
const browser = Bun.spawn(
  [
    browserPath,
    "--headless",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-accelerated-2d-canvas",
    "--force-color-profile=srgb",
    "--force-device-scale-factor=1",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--no-first-run",
    "--no-default-browser-check",
    "--mute-audio",
    "--hide-scrollbars",
    `--window-size=${W},${H}`,
    `--user-data-dir=${join(OUT, ".profile")}`,
    `http://127.0.0.1:${server.port}/?render=1`,
  ],
  { stdout: "ignore", stderr: process.env.REEL_DEBUG ? "inherit" : "ignore" },
);
console.log(`render: ${frames.length} frames @ ${W}x${H} (${fps}fps) via ${browserPath.split("/").pop()} -> ${stills ? "stills" : hashTag ? "hash manifest" : outFile}`);
const timeout = setTimeout(() => fail(new Error("render timed out")), Math.max(20 * 60, frames.length * 2) * 1000);
const watchdog = setTimeout(() => { if (!booted) fail(new Error("page did not boot within 90 s")); }, 90_000);
try {
  await done;
} catch (e) {
  console.error("render failed:", (e as Error).message);
  browser.kill();
  ff?.kill();
  server.stop(true);
  process.exit(1);
}
clearTimeout(timeout);
clearTimeout(watchdog);
browser.kill();
if (ff) {
  await (ff.stdin as import("bun").FileSink).end();
  await ff.exited;
}
if (hashTag) await Bun.write(join(OUT, `hashes-${hashTag}.json`), JSON.stringify(hashes));
server.stop(true);
console.log(`done in ${((performance.now() - t0) / 1000).toFixed(1)}s (${received} frames)`);
process.exit(0);
