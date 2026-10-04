// brag Step 4 deliverables: mux picture + score, pull the poster from the strongest settled
// frame, bake it as frame 0 (every platform's idle thumbnail), write a web cut under the
// site's 8 MB budget, and publish to brag-output/ and site/assets/.
//   bun tools/mux.ts [--poster <frame>]
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { FPS, N } from "../src/timeline.ts";

const FILM = resolve(import.meta.dir, "..");
const REPO = resolve(FILM, "..");
const OUT = join(FILM, "out");
const BRAG = join(REPO, "brag-output");
const SITE = join(REPO, "site", "assets");
const args = process.argv.slice(2);
const POSTER_FRAME = Number(args.includes("--poster") ? args[args.indexOf("--poster") + 1] : 548);
const SECS = N / FPS;

const video = join(OUT, "video.mp4");
const audio = join(OUT, "audio.wav");
for (const p of [video, audio]) if (!existsSync(p)) throw new Error(`missing ${p}; run render and audio first`);
mkdirSync(BRAG, { recursive: true });

const run = (label: string, cmd: string[]) => {
  const p = Bun.spawnSync(cmd, { stderr: "pipe" });
  if (p.exitCode !== 0) throw new Error(`${label}: ${p.stderr.toString()}`);
};
const COLOR = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"];
const TAIL = ["-movflags", "+faststart", "-fflags", "+bitexact", "-map_metadata", "-1", "-t", String(SECS)];

// 1. poster: the strongest settled frame, full-res, from the lossless-ish picture master
const poster = join(OUT, "brag.jpg");
run("poster", ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", video, "-vf", `select=eq(n\\,${POSTER_FRAME})`, "-frames:v", "1", "-q:v", "2", poster]);

// 2. master: poster baked as frame 0 (brag step 4), score encoded from the WAV source
const master = join(OUT, "somatic-canticles-film.mp4");
run("master", [
  "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
  "-i", video, "-i", poster, "-i", audio,
  "-filter_complex", "[0:v][1:v]overlay=0:0:enable='eq(n,0)',format=yuv420p[v]",
  "-map", "[v]", "-map", "2:a:0",
  "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "17", "-tune", "grain", ...COLOR,
  "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
  ...TAIL, master,
]);

// 3. web cut for the site hero: 1080p30, two-pass to ~7 MB total, poster still frame 0
const web = join(OUT, "somatic-canticles-film-web.mp4");
const targetBytes = 7.0 * 1024 * 1024;
const aKbps = 128;
const vKbps = Math.floor((targetBytes * 8) / SECS / 1000 - aKbps);
const webV = [
  "-filter_complex", "[0:v]fps=30[f];[f][1:v]overlay=0:0:enable='eq(n,0)',format=yuv420p[v]",
  "-map", "[v]",
  "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-b:v", `${vKbps}k`, "-maxrate", `${Math.round(vKbps * 1.6)}k`, "-bufsize", `${vKbps * 2}k`, ...COLOR,
];
const passlog = join(OUT, "x264-2pass");
run("web pass 1", ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", video, "-i", poster, ...webV, "-pass", "1", "-passlogfile", passlog, "-an", "-f", "mp4", "/dev/null"]);
run("web pass 2", [
  "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", video, "-i", poster, "-i", audio,
  ...webV, "-pass", "2", "-passlogfile", passlog, "-map", "2:a:0", "-c:a", "aac", "-b:a", `${aKbps}k`, "-ar", "48000",
  ...TAIL, web,
]);

// 4. share copy (brag: 1–3 sentences, postable as-is, cinematic tone: name + canon tagline)
const share = join(OUT, "share-copy.txt");
await Bun.write(share, "Somatic Canticles.\nThe body is the last frontier; freedom is learning to author it.\nsomatic.tryambakam.space\n");

// 5. publish
copyFileSync(master, join(BRAG, "brag.mp4"));
copyFileSync(poster, join(BRAG, "brag.jpg"));
copyFileSync(share, join(BRAG, "share-copy.txt"));
copyFileSync(web, join(SITE, "brag.mp4"));
copyFileSync(poster, join(SITE, "brag.jpg"));

const mb = (p: string) => (statSync(p).size / 1048576).toFixed(2);
console.log(`poster  f${POSTER_FRAME} -> brag.jpg (${mb(poster)} MB)`);
console.log(`master  ${mb(master)} MB -> brag-output/brag.mp4`);
console.log(`web     ${mb(web)} MB (video ${vKbps} kbps @1080p30) -> site/assets/brag.mp4`);
console.log(`share   -> brag-output/share-copy.txt`);
