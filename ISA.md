---
task: "Brag-style Somatic Canticles landing page with brag hero video"
project: somatic-canticles-landing
effort: E4
effort_source: auto
phase: verify
progress: 43/94
mode: interactive
started: 2026-09-26T03:18:00-07:00
updated: 2026-09-26T03:25:00-07:00
---

## Problem

*Somatic Canticles* is a finished, verified 27-chapter science-fiction trilogy (canon: `Sheshiyer/somatic-canticles-v3-book-trilogy` @ `v2.1-verified`) with no public front door.

The surfaces that exist all serve people who have already arrived:
- **somatic-canticles-bm-wiki** is a press-kit wiki. It carries a fabricated press release and an image with an invented byline.
- **1319.tryambakam.space** is a gamified biorhythm app with 12 practice chapters, and it never mentions the books.
- The **Expo reader** is private.

There is no email list, no sample, no pre-order and no ISBN. A stranger who hears "Somatic Canticles" has nowhere to land, nothing to read, and no way to raise a hand.

## Vision

A stranger opens the link on a phone. Within two seconds a cinematic, bronze-on-void film is already moving: "This book may alter how you feel in your body." Three hardcovers resolve, and four names appear: Jian maps. Sona resonates. Gideon protects. Corv witnesses.

They scroll and read one real page of Book I. Then they type their email because they want to know when it ships.

Every frozen frame of the page and the film is postable. The film was made by `/brag` from the page itself, so the page and its trailer are one object.

Euphoric surprise: the author watches the hero loop and thinks "that's the trailer I would have storyboarded."

## Out of Scope

- **No commerce.** No pre-order, pricing, retailer links or Kickstarter page; none of these exist yet.
- **No full text.** No full-text reader, and no link to the free full-text GitHub repo.
- **No work on other surfaces.** No redesign or cleanup of bm-wiki, the 1319 webapp or the Expo app; these are flagged separately.
- **Nothing that requires the private repo.** No assets copied from the private `1319-somatic-canticle-app` repo.
- **No new art.** No new cover art generation; we use existing public v3 covers.
- **English only.**
- **No analytics or tracking scripts.**
- **No production deploy or public repo** without the author's explicit go.

## Principles

- **Show, don't tell.** The film, the covers and one real page do the persuading; copy stays short and specific (brag PRODUCT.md).
- **Canon is sacred.** Only verbatim text from the canonical source; drift is forbidden (RIGHTS.md).
- **Mystery sells a thriller.** Reveal the premise and never the endings.
- **Every frame postable.** Every screenshot, at any scroll position, is shareable.
- **Specific over generic.** Every word belongs to *Somatic Canticles*, never to "any sci-fi book".
- **Respect the reader's body.** Reduced motion, user-controlled sound and readable contrast.

## Constraints

**Stack and tooling**
- Zero-build static HTML/CSS/JS under `site/`, deployed by Vercel with `vercel.json` `outputDirectory: site`.
- bun/bunx only. Never npm/npx or Playwright.
- The video is made with `/brag --full` (Hyperframes), `--tone cinematic`, landscape 1920×1080 at 30fps.
- QA runs in the Claude built-in Browser pane (Interceptor waived by the author for this project).

**Copy and canon**
- All book copy is verbatim from `final-polished-blurbs-and-logline.md` or v3 repo files at `v2.1-verified`.
- The byline is "Witness Alchemist".
- The email form posts to Buttondown's embed-subscribe endpoint. The username is configurable in one place.

**Brand identity**
- Palette is limited to the bm-wiki Bioluminescent Architecture tokens.
- Fonts: Cinzel, EB Garamond and Fira Code from Google Fonts. Each must render ē (U+0113).

**Budgets**
- Initial page weight (before the video) is ≤ 1.5 MB.
- The hero video is ≤ 8 MB.
- Contrast meets WCAG 2.1 AA.

## Goal

Ship a zero-build static landing site in `Sheshiyer/somatic-canticles-landing` that meets five conditions:
1. It presents the trilogy with canonical, non-spoiler copy and a `/brag --full`-generated cinematic hero video made from the site itself.
2. It converts visitors into a Buttondown reader list.
3. It offers a canonical Book I sample.
4. It links to the companion app.
5. It passes `bun scripts/check-site.mjs`, Browser-pane visual QA at 1440px and 375px, and a canon/rights grep gate, and it is deployed to a Vercel preview for the author's go/no-go.

## Criteria

### Repository and structure
- [x] ISC-1: `site/index.html` exists at the repo root
- [x] ISC-2: `site/styles.css` exists and is linked from `index.html`
- [x] ISC-3: `site/main.js` exists and is loaded with `defer`
- [x] ISC-4: `vercel.json` has `outputDirectory` = `site`
- [x] ISC-5: `scripts/check-site.mjs` exits 0 under `bun`
- [x] ISC-6: `PRODUCT.md` exists in Impeccable format (Register, Users, Product Purpose, Brand Personality, Anti-references, Design Principles, Accessibility)
- [ ] ISC-7: `DESIGN.md` lists every color and font token used in `styles.css`
- [x] ISC-8: `content/COPY.md` records the source file and pinned ref for every book-copy block
- [x] ISC-9: `README.md` documents the local preview, the check script, the Buttondown setup and the brag regeneration
- [ ] ISC-10: `.gitignore` excludes `_sources/` and `brag-output/work/`

### Hero
- [x] ISC-11: the hero H1 text is "Witness. Sever. Ripen."
- [x] ISC-12: the hero subhead is the verbatim commercial logline, or an author-approved trim of it
- [x] ISC-13: the reader warning "This book may alter how you feel in your body." is visible above the fold at 1440px
- [x] ISC-14: the hero has a `<video>` whose `src` is `assets/brag.mp4`
- [x] ISC-15: the hero video has `poster` = `assets/brag.jpg`
- [x] ISC-16: the hero video has `muted`, `loop` and `playsinline` attributes
- [x] ISC-17: the hero has a play/pause button whose `aria-label` updates with its state
- [x] ISC-18: the hero has a mute toggle with `aria-pressed`
- [x] ISC-19: the hero includes a reader-list email form (primary CTA)
- [ ] ISC-20: the hero video starts playing without user action when reduced motion is off (Browser pane)

### Reader list
- [x] ISC-21: every form `action` targets `https://buttondown.com/api/emails/embed-subscribe/<username>`
- [x] ISC-22: the Buttondown username is defined once and reused
- [x] ISC-23: the email input has `type=email`, `required` and an associated `<label>`
- [x] ISC-24: the form submits without JS (plain POST works)
- [ ] ISC-25: the outro repeats the reader-list form

### Books
- [ ] ISC-26: a books section lists exactly three books
- [ ] ISC-27: the Book I title renders as "The Anamnesis Engine"
- [ ] ISC-28: the Book II title renders as "The Myocardial Chorus"
- [ ] ISC-29: the Book III title renders as "The Ripening"
- [ ] ISC-30: Book I shows "Chapters 1–8"
- [ ] ISC-31: Book II shows "Chapters 9–15"
- [ ] ISC-32: Book III shows "Chapters 16–27"
- [ ] ISC-33: each book card shows its cover image with non-empty `alt`
- [ ] ISC-34: each book card has a verbatim canonical one-line summary or a trimmed blurb
- [ ] ISC-35: the page states the trilogy has 27 chapters

### Somanauts
- [ ] ISC-36: a Somanauts section names Jian, Sona, Gideon and Corv
- [ ] ISC-37: the line "Jian maps. Sona resonates. Gideon protects. Corv witnesses." appears verbatim

### Sample
- [ ] ISC-38: a `#sample` section contains a verbatim excerpt from v3 `v2.1-verified`
- [ ] ISC-39: the sample shows the provenance "Text source: Somatic-Canticles-v2 @ v2.1-verified"
- [ ] ISC-40: the sample contains no HTML-comment editorial headers (no `T-070`, no `WAVE`)

### Companion app
- [ ] ISC-41: a companion-app section links to `https://1319.tryambakam.space`
- [ ] ISC-42: the app copy says the app has 12 practices, distinct from the 27 chapters

### Footer and metadata
- [ ] ISC-43: the footer contains "© 2026 Witness Alchemist" and "All rights reserved"
- [ ] ISC-44: the footer contains a "launch film made with /brag" colophon
- [ ] ISC-45: `<title>` contains "Somatic Canticles"
- [ ] ISC-46: `meta name=description` is present and 50–160 characters
- [ ] ISC-47: `og:image` points to an existing asset
- [ ] ISC-48: `og:video` points to `assets/brag.mp4`
- [ ] ISC-49: `twitter:card` is `summary_large_image`
- [ ] ISC-50: JSON-LD `BookSeries` with three `Book` parts parses as valid JSON
- [ ] ISC-51: a favicon is linked and exists

### Brag video
- [x] ISC-52: `brag-output/brag-plan.md` exists
- [x] ISC-53: `brag-output/brag.mp4` duration is 15–25s (ffprobe)
- [x] ISC-54: the video is 1920×1080 (ffprobe)
- [x] ISC-55: the video has an audio stream (ffprobe)
- [x] ISC-56: `site/assets/brag.mp4` is ≤ 8 MB
- [x] ISC-57: `site/assets/brag.jpg` exists and matches frame 0 of the video
- [x] ISC-58: `brag-output/share-copy.txt` exists, contains 1–3 sentences, and has no "excited to share"
- [x] ISC-59: video stills show "Somatic Canticles" text in at least one scene (frame extraction)
- [x] ISC-60: the video's first 2s contain a readable hook line (frame at t=1.5s)

### Accessibility
- [ ] ISC-61: a skip link to `#main` is the first focusable element
- [ ] ISC-62: under `prefers-reduced-motion: reduce`, the hero video is paused and shows its poster
- [ ] ISC-63: all text/background token pairs used reach AA contrast ≥ 4.5:1 (script)
- [ ] ISC-64: every `<img>` has an `alt` attribute
- [ ] ISC-65: there is exactly one `<h1>`, and headings do not skip levels
- [ ] ISC-66: all interactive elements are reachable by Tab (Browser pane)
- [ ] ISC-67: the ē glyph renders in the display font (Browser pane screenshot of "Khalorēē")

### Performance
- [ ] ISC-68: total `site/` size excluding the video is ≤ 1.5 MB
- [x] ISC-69: each cover image is ≤ 250 KB
- [ ] ISC-70: every below-fold image uses `loading="lazy"`

### Visual QA
- [ ] ISC-71: 1440px Browser pane screenshot shows no horizontal overflow (`scrollWidth` == `clientWidth`)
- [ ] ISC-72: 375px Browser pane screenshot shows no horizontal overflow
- [ ] ISC-73: the Browser pane console shows zero errors on load
- [ ] ISC-74: the Browser pane network log shows zero 404s on load

### Anti-criteria
- [ ] ISC-75: Anti: the site contains "Ava Moreno", "Rachel Kim" or "Elara Vance"
- [ ] ISC-76: Anti: the site contains "MIT" as a license claim
- [ ] ISC-77: Anti: the site contains "Khaloree" without macrons
- [ ] ISC-78: Anti: the site contains "They succeed" or "The snap occurs" (spoilers)
- [ ] ISC-79: Anti: the site references `book2-myocardial--product-hero`, `book2-myocardial--cover-v1` or `book2-myocardial--video`
- [ ] ISC-80: Anti: the site states a word count (363,077 / 220,091)
- [ ] ISC-81: Anti: the site contains "Bio-Acoustic" as a genre keyword
- [ ] ISC-82: Anti: the site loads a third-party analytics or tracking script
- [x] ISC-83: Antecedent: the hero video is visibly moving within 2s of load on desktop (Browser pane at t≈2s)

### Deploy
- [x] ISC-84: a Vercel preview URL returns 200 for `/` and for `/assets/brag.mp4`

### Launch film (added 2026-10-04 — ID-stable, appended)
- [x] ISC-85: film/out/video.mp4 renders all 900 frames at 1920x1080@60 with no page errors (render log)
- [x] ISC-86: brag-output/brag-plan.md storyboard durations sum to 15.0 s (Read)
- [x] ISC-87: film score is -14 ±1 LUFS integrated and ≤ -1.5 dBTP (ffmpeg ebur128 on out/audio.wav)
- [x] ISC-88: score is deterministic: two runs of tools/audio.ts are byte-identical (shasum)
- [x] ISC-89: picture is deterministic: two hash manifests over the same frame range match (render --hash)
- [x] ISC-90: master passes the strobe check from frame 1 (luma jump < 20% per 3 frames) (verify.ts)
- [x] ISC-91: the baked poster equals frame 0 of both cuts (PSNR ≥ 32 dB) (verify.ts)
- [x] ISC-92: every on-screen book string in film/src/copy.ts appears verbatim in content/COPY.md (rg)
- [x] ISC-93: Anti: film/ uses Remotion, Playwright, npm or npx (rg over film/package.json and film/tools)
- [x] ISC-94: the site serves the new film: site/assets/brag.mp4 duration 15.0 s and ≤ 8 MB (ffprobe/stat)

## Test Strategy

| isc | type | check | threshold | tool |
|---|---|---|---|---|
| ISC-1..10 | file | exists / content grep | present | Read/Grep |
| ISC-11..19, 25..51, 61, 64, 65, 70 | markup | grep / DOM query on `site/index.html` | exact match | Grep / check-site.mjs |
| ISC-20, 62, 66, 67, 71..74, 83 | live UI | Browser pane navigate + JS eval + screenshot | as stated | mcp__Claude_Browser__* |
| ISC-21..24 | form | grep action; curl `-I` endpoint | 2xx/3xx | Grep/curl |
| ISC-52..60 | media | ffprobe / ffmpeg frame extract + visual Read | as stated | ffprobe/ffmpeg/Read |
| ISC-63 | a11y | contrast script over tokens | ≥ 4.5:1 | bun script |
| ISC-68, 69 | perf | `du` / `stat` | ≤ budget | Bash |
| ISC-75..82 | anti | `rg` over `site/` | 0 matches | rg |
| ISC-84 | deploy | curl preview URL | 200 | curl |

## Features

| name | description | satisfies | depends_on | parallelizable |
|---|---|---|---|---|
| assets | Fetch public v3/bm-wiki assets, crop covers B1v1/B2v2/B3v2, compress, favicon | ISC-33, 47, 51, 69 | — | true |
| copy | `content/COPY.md`: verbatim canon, non-spoiler trims, sample excerpt, flagged phrases | ISC-8, 11–13, 27–42 | — | true |
| design-docs | `PRODUCT.md` + `DESIGN.md` tokens, fonts, contrast pairs | ISC-6, 7, 63, 67 | — | true |
| directions | 3 independent full-page directions (one by Forge), judge, synthesize | ISC-1–3, 11–51, 61–74 | assets, copy, design-docs | true |
| check-script | Port brag `check-docs.mjs` to `check-site.mjs` + anti grep gate | ISC-5, 75–82 | directions | false |
| brag | Install Hyperframes (bunx), run `/brag --full --tone cinematic` on the repo, review stills, embed | ISC-14–16, 52–60, 83 | directions | false |
| review | Adversarial review (canon/rights, a11y, perf/meta) + verify + fix; Cato audit | all | brag, check-script | true |
| ship | Private GitHub repo, Vercel preview, verify; production needs the author's go | ISC-84 | review | false |

## Decisions

- 2026-09-26 03:20: E4 auto-selected; the classifier line was absent in the desktop app session. Tier is justified by cross-cutting design, video pipeline and deploy.
- 2026-09-26 03:20: ISC count is 84, below the soft E4 floor of 128. Show-your-math: each ISC is already one probe. Padding to 128 would split the anti-grep and meta checks into near-duplicates with no added falsification power.
- 2026-09-26 03:20: author chose `/brag --full` + Hyperframes over the recommended Remotion. The bundled ende.app music is upbeat corporate. Plan: use `--no-music` if no cue fits cinematic, or pick vol-12, and let Hyperframes' composition carry tone. Record the choice at the brag step.
- 2026-09-26 03:20: author waived Interceptor for this project; QA runs in the built-in Browser pane.
- 2026-09-26 03:20: hero H1 "Witness. Sever. Ripen." is a default, overridable at the copy-review checkpoint.
- 2026-09-26 03:30: ApertureOscillation. The list is the strategic asset and the film earns the signup: put a form beside the film and repeat it in the outro. "Start reading" = a Chapter 1 sample, not the free full-text repo. The app is framed as a companion practice. Keep the CTA label/endpoint in one config so it can swap to a Kickstarter notify later.
- 2026-09-26 03:34: Advisor (Inference.ts --mode advisor) failed twice with exit 1, probably because the nested claude subprocess is blocked in the desktop session. Proceeded on my own judgement. Ordering: brag film AFTER design synthesis (brag reads the final index.html/styles.css). Biggest risk: Hyperframes under bunx. Fallback: existing trilogy-hero clip + poster.
- 2026-09-26 03:50: Hyperframes 0.8.77 runs via bunx (HYPERFRAMES_NO_TELEMETRY=1). Chrome Headless Shell 152.0.7977.30 downloaded to ~/.cache/hyperframes (author-approved). Did NOT run `hyperframes skills` because it installs globally into every AI tool. The brag agent reads the bundled domain skills from ~/.bun/install/cache/hyperframes@0.8.77@@@1/dist/skills/ (hyperframes, hyperframes-cli, media-use), which supersede the names in brag SKILL.md. Doctor warns: 8 GB RAM with 1.5 GB free, so render only after the parallel agents finish.
- 2026-09-26 04:10: W1 done. Covers are cropped to 720x1043, not 3:4, because 3:4 cuts titles; CSS uses aspect-ratio 720/1043. ffmpeg has no libwebp, so cwebp was used. Chlorophyll is restricted to strokes (3.73:1). Copy pinned at ba74a87.
- 2026-09-26 04:10: refined: Book III uses the ALT trim starting "Now the Gardener has noticed." because the original first line spoils Book II.
- 2026-09-26 04:12: W2 produced folio (Designer), atlas (Forge), descent (Engineer). The workflow errored because one agent skipped StructuredOutput, but all files and screenshots were written. Judging runs via a 3-lens judge panel workflow (wf_1bcc1030-164).
- 2026-09-27 14:30: The judge+synthesize workflow failed its StructuredOutput return twice, but both times the files had already been written to disk before the failure — a reporting failure, not a build failure. Verified via check-site.mjs (9/9 pass) and Browser-pane inspection at 1440px and 375px (zero console errors, zero 404s, no horizontal overflow) rather than re-running the expensive agent a third time. Judge panel: Atlas won on all 3 lenses.
- 2026-09-27 14:35: wrote README.md and vercel.json by hand (the synthesize agent's final turn was consumed by the failed StructuredOutput call before it reached these two files).
- 2026-09-27 14:40: created public repo Sheshiyer/somatic-canticles-site (author chose public-now over private-then-flip). Pushing first commit now with placeholder brag.mp4/brag.jpg (copies of the existing trilogy trailer) — the real /brag film has not been generated yet.
- 2026-10-04 21:55: refined: hosting moved from Vercel to Cloudflare at the author's request. Deployed as a static-assets Worker `somatic-canticles-site` (wrangler profile 9d9d, account 9d9d23b2…) with Workers custom domain somatic.tryambakam.space. Chose a Worker over Pages because the OAuth token lacks DNS scopes and Workers custom domains create DNS + cert automatically. The name avoids collision with the existing `somatic-canticles` Worker on khaloree.tryambakam.space. Headers ported from vercel.json to site/_headers. vercel.json kept but unused.
- 2026-10-04 21:58: fixed 4px horizontal overflow at 320px (decorative crop marks) with html,body{overflow-x:clip}. Verified clean at 320/375/600/800/1024/1440.
- 2026-10-04 22:30: refined: the film follows brag's process (plan, laws, poster bake, share copy), but the composition and render use the house showreel engine from the Temperance (2D canvas, frame-pure, headless capture, TS synth) and Cambium (raw RGBA → ffmpeg, verify suite) reels, at the author's direction ("using brag as a base system… without using remotion"). This replaces /brag --full's Hyperframes composition. Hyperframes' chrome-headless-shell is reused as the renderer; it is plain Chromium, so there is no Brave canvas farbling.
- 2026-10-04 22:30: the score was handed to Forge per the E3+ coding rule, but Forge could not start: the ForgeProgress.ts preflight looks only in ~/.bun/bin/codex, while codex lives in /opt/homebrew/bin. The Engineer agent type needs a git worktree (session cwd is not a repo). The score went to a general-purpose agent with the same objective spec; all specs were measured as passing.
- 2026-10-04 22:35: page→resolve match cut: the page fades over 16 frames to stay under the strobe limit, while the bronze drop cap T is held as a 2D overlay and dissolves into the sigil, which starts at the T's size (both fill a ~360–720 px box).
- 2026-10-04 23:40: determinism root cause: FontFace subsets registered via Promise.all without unicode-range raced per process, so glyphs present in both latin and latin-ext files (·) came from either. Fixed with explicit unicodeRange and fixed-order registration. Sequential runs are now bit-exact over 900 frames.
- 2026-10-04 23:40: page fade lengthened to 24 linear frames after the web cut failed strobe (25% per 2 frames at f800); now 10.6% / 11.9%.
- 2026-10-05: film deployed. Found and fixed three loading defects: (1) Workers static assets answer Range with a full 200, which breaks Safari/iOS video, so worker/index.ts now serves 206 for /assets/*.mp4 (run_worker_first); (2) /assets/* is immutable for a year but brag.mp4 kept its name, so a stale placeholder was served on first request; URLs now carry a content-hash ?v= stamp, enforced by check-site; (3) og:image/og:video were relative, which crawlers ignore; they are now absolute with dimensions and twitter:image. The edge had cached a range-less response for the first ?v= URL, which cannot be purged with this token's scopes, so stamps were lengthened to 12 hex to issue fresh URLs.

## Verification

- ISC-6: Grep: PRODUCT.md has Register, Users, Product Purpose, Brand Personality, Anti-references, Design Principles, Accessibility & Inclusion headings
- ISC-8: Grep: COPY.md pins v3 @ ba74a874 (short ba74a87) with per-block source lines (15 "source" refs)
- ISC-69: stat: cover-book1 168954 B, cover-book2 129100 B, cover-book3 113556 B (all ≤ 250 KB)
- ISC-84: curl: https://somatic.tryambakam.space/ -> 200 text/html, /assets/brag.mp4 -> 200 video/mp4, /nope -> 404; CSP/nosniff/referrer headers present; Browser pane: fonts loaded (Cinzel, EB Garamond, Fira Code), video playing, 0 console errors. (Criterion was written for a Vercel preview; satisfied on Cloudflare production instead.)
- ISC-52, 86: Read: brag-output/brag-plan.md storyboard durations 2.5+3.0+4.0+2.5+1.5+1.5 = 15.0 s
- ISC-53..55, 85: verify.ts on master: 900 frames, 1920x1080, 60/1, duration 15.000 s, AAC 48k stereo; render log 900/900 frames, no page errors
- ISC-56: verify.ts --web: site/assets/brag.mp4 7.15 MB (≤ 8 MB), 1920x1080, 30/1, 450 frames
- ISC-57, 91: verify.ts: frame 0 vs brag.jpg PSNR 47.1 dB (master), 40.9 dB (web)
- ISC-58: Read: brag-output/share-copy.txt has 3 lines (name, canon logline level 2, URL); no "excited to share"
- ISC-59, 60: stills f70 (hook line fully settled at 1.17 s) and f880 (SOMATIC CANTICLES wordmark) reviewed visually
- ISC-87: ffmpeg ebur128 on out/audio.wav: I -14.0 LUFS, true peak -2.0 dBFS; muxed master -14.1 LUFS / -1.7 dBTP
- ISC-88: shasum of two tools/audio.ts runs: b07e3703395fb877… both
- ISC-89: render --hash a vs --hash b over all 900 frames: 0 differ (shuffled-order run: ≤ 2 values/frame at ±1 from Skia glyph-cache state; documented, not gated)
- ISC-90: verify.ts: max luma jump 10.6% at f724 per 3 frames (master), 11.9% per 2 frames (web)
- ISC-92: bun check: SAMPLE_P1 verbatim substring of content/COPY.md; chapter title, eyebrow, roles, logline present
- ISC-93: rg over film/: only "No Remotion" comments; no Remotion/Playwright/npm/npx usage
- ISC-94: curl https://somatic.tryambakam.space/assets/brag.mp4?v=6016638495e7: sha256 matches site/assets/brag.mp4 (6016638495e716ce…), 7,498,677 B, 15.000 s; Range 0-1023 → 206 Content-Range bytes 0-1023/7498677 (3 repeats, and after full GETs)
- ISC-83: Browser pane on live site: hero video currentTime 5.49 s ~5 s after load (autoplay, muted); readyState 4; network brag.mp4 → 206; 0 console errors
