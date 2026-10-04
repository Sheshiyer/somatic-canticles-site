# Somatic Canticles: launch film

A deterministic 15 s, 1920×1080 @ 60 fps launch film for the trilogy, made with:

- **brag's process:** [`latent-spaces/brag`](https://github.com/latent-spaces/brag)'s plan → compose → gate → render → poster → share-copy steps. The plan is in [`../brag-output/brag-plan.md`](../brag-output/brag-plan.md).
- **The house showreel engine:** the one behind the Temperance and Cambium reels. Every frame is a pure function of its frame number, drawn with canvas + WebGL, captured by headless Chromium and streamed into ffmpeg.
- **A synthesized score:** built from the same cue list.

No Remotion, no Playwright, no npm/npx.

## Render

```bash
bun install
bun tools/audio.ts            # score → out/audio.wav (-14 LUFS, TP ≤ -1.5 dBTP, deterministic)
bun run render                # 1080p60 picture → out/video.mp4
bun tools/mux.ts              # poster + master + web cut → brag-output/, site/assets/
bun tools/verify.ts           # master: spec, loudness, strobe, poster, determinism
bun tools/verify.ts --web     # site cut: same, plus ≤ 8 MB
```

Iterate:

```bash
bun run build && bun tools/render.ts --stills 70,360,690,880   # PNG stills → out/stills/
bun run dev                                                    # scrubber + audio at http://127.0.0.1:4790/
```

Determinism: `bun tools/render.ts --hash a --frames 300-420` and `--hash b --frames 300-420` must match.

## How it is built

| Piece | File |
|---|---|
| Shared cue list (picture + score) | `src/timeline.ts` |
| Tokens, from the site's DESIGN.md | `src/tokens.ts` |
| Canon on-screen copy, from content/COPY.md | `src/copy.ts` |
| Khalorēē field shader + perspective quads | `src/gl.ts` |
| Plate chrome, HUD, ECG/vine geometry, grain | `src/stage.ts` |
| Scenes: hook · triad · specimens · somanauts · page · resolve | `src/scenes/*.ts` |
| Capture (raw RGBA → ffmpeg) | `tools/render.ts`, `tools/serve.ts` |
| Score | `tools/audio.ts` |
| Deliverables, checks | `tools/mux.ts`, `tools/verify.ts` |

The renderer prefers the plain `chrome-headless-shell` that Hyperframes provisions in `~/.cache/hyperframes` (override with `REEL_BROWSER`). It renders WebGL through SwiftShader. A readback self-test refuses any browser that perturbs canvas reads.

The fonts (Cinzel, EB Garamond, Fira Code) come from `@fontsource`, including the latin-ext subsets that carry ē.
