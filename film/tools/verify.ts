// Deliverable checks (ported from the Cambium reel): stream spec, exact frame count,
// colour tags, faststart, loudness/true peak/DC, strobe safety, poster == frame 0,
// determinism manifests when present, and the site budget for the web cut.
//   bun tools/verify.ts                 master: out/somatic-canticles-film.mp4 (1080p60)
//   bun tools/verify.ts --web           web cut: site/assets/brag.mp4 (1080p30, ≤ 8 MB)
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { N } from "../src/timeline.ts";

const FILM = resolve(import.meta.dir, "..");
const OUT = join(FILM, "out");
const webMode = process.argv.includes("--web");
const file = webMode ? join(FILM, "..", "site", "assets", "brag.mp4") : join(OUT, "somatic-canticles-film.mp4");
const fps = webMode ? 30 : 60;
const frames = webMode ? N / 2 : N;
const SECS = N / 60;
let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
};
const probe = (a: string[], f = file) => JSON.parse(Bun.spawnSync(["ffprobe", "-v", "error", "-of", "json", ...a, f]).stdout.toString());
console.log(`verify ${file}\n`);

const v = probe(["-count_frames", "-select_streams", "v:0", "-show_entries", "stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_read_frames,color_primaries,color_transfer,color_space,color_range"]).streams[0];
check(v.codec_name === "h264" && v.profile === "High", "video h264 High", `${v.codec_name} ${v.profile}`);
check(v.width === 1920 && v.height === 1080, "1920x1080", `${v.width}x${v.height}`);
check(v.pix_fmt === "yuv420p", "yuv420p", v.pix_fmt);
check(v.r_frame_rate === `${fps}/1`, `${fps} fps`, v.r_frame_rate);
check(Number(v.nb_read_frames) === frames, `${frames} frames`, v.nb_read_frames);
check(v.color_primaries === "bt709" && v.color_transfer === "bt709" && v.color_space === "bt709" && v.color_range === "tv", "bt709 tv tags", `${v.color_primaries}/${v.color_transfer}/${v.color_space}/${v.color_range}`);

const a = probe(["-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels"]).streams[0];
check(a?.codec_name === "aac" && a.sample_rate === "48000" && a.channels === 2, "audio aac 48k stereo", a ? `${a.codec_name} ${a.sample_rate} ${a.channels}ch` : "none");
const dur = Number(probe(["-show_entries", "format=duration"]).format.duration);
check(Math.abs(dur - SECS) <= 1 / fps + 0.03, `duration ${SECS.toFixed(3)} s`, String(dur));

const head = readFileSync(file).subarray(0, 1 << 20).toString("latin1");
const moov = head.indexOf("moov"), mdat = head.indexOf("mdat");
check(moov >= 0 && (mdat < 0 || moov < mdat), "faststart (moov before mdat)", `moov@${moov} mdat@${mdat}`);

const lo = Bun.spawnSync(["ffmpeg", "-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { stderr: "pipe" }).stderr.toString();
const I = Number(lo.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
const TP = Number(lo.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
check(Math.abs(I + 14) <= 1, "integrated -14 ±1 LUFS", String(I));
check(TP <= -1, "true peak <= -1 dBTP", String(TP));
const st = Bun.spawnSync(["ffmpeg", "-hide_banner", "-nostats", "-i", file, "-af", "astats=metadata=0", "-f", "null", "-"], { stderr: "pipe" }).stderr.toString();
const dc = Math.max(...[...st.matchAll(/DC offset:\s+(-?[\d.]+)/g)].map((m) => Math.abs(Number(m[1]))));
check(dc < 0.001, "no DC offset", String(dc));

// strobe: no full-frame luma jump > 20% within 3 frames (scaled to the cut's fps).
// Frame 0 is the baked poster (brag Step 4); it is checked separately below.
const sig = [...Bun.spawnSync(["ffmpeg", "-hide_banner", "-v", "error", "-i", file, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-", "-f", "null", "-"]).stdout.toString().matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
check(sig.length === frames, "luma samples for every frame", String(sig.length));
const span = webMode ? 2 : 3;
let maxJump = 0, at = 0;
for (let i = 1 + span; i < sig.length; i++) {
  const j = Math.abs(sig[i] - sig[i - span]);
  if (j > maxJump) { maxJump = j; at = i; }
}
check(maxJump / 219 < 0.2, `no strobe (luma jump < 20% / ${span} frames, from frame 1)`, `${((maxJump / 219) * 100).toFixed(1)}% at f${at}`);
const posterJump = Math.abs(sig[0] - sig[Math.min(span, sig.length - 1)]) / 219;
check(posterJump < 0.2, "baked poster frame 0 → intro luma step < 20%", `${(posterJump * 100).toFixed(1)}%`);

// poster == frame 0
const poster = join(FILM, "..", "brag-output", "brag.jpg");
if (existsSync(poster)) {
  const ps = Bun.spawnSync(["ffmpeg", "-hide_banner", "-i", file, "-i", poster, "-filter_complex", "[0:v]select=eq(n\\,0)[a];[a][1:v]psnr", "-frames:v", "1", "-f", "null", "-"], { stderr: "pipe" }).stderr.toString();
  const psnr = Number(ps.match(/average:([\d.inf]+)/)?.[1] ?? 0);
  check(psnr >= 32 || ps.includes("average:inf"), "frame 0 matches brag.jpg (PSNR ≥ 32 dB)", `${psnr} dB`);
}

if (webMode) {
  const mb = statSync(file).size / 1048576;
  check(mb <= 8, "web cut ≤ 8 MB", `${mb.toFixed(2)} MB`);
} else {
  // Gate: two sequential runs must be bit-exact. A shuffled-order run is informational only:
// Skia glyph-cache state can move isolated text pixels by ±1 code value (measured: ≤ 2 values/frame).
const runs = ["a", "b"].map((t) => join(OUT, `hashes-${t}.json`)).filter(existsSync);
  if (runs.length >= 2) {
    const ref = JSON.parse(readFileSync(runs[0], "utf8"));
    for (const r of runs.slice(1)) {
      const other = JSON.parse(readFileSync(r, "utf8"));
      const keys = Object.keys(ref);
      const diff = keys.filter((k) => ref[k] !== other[k]);
      check(diff.length === 0 && keys.length === Object.keys(other).length, `deterministic vs ${r.split("/").pop()}`, `${keys.length} frames, ${diff.length} differ`);
    }
  } else console.log("SKIP  determinism (run render --hash a / --hash b --frames …)");
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
