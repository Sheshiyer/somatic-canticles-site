# Web Assets Manifest

All outputs live in `site/assets/`. Source paths are relative to the repo root (`_sources/` is gitignored and read-only). Generated 2026-09-26 with ffmpeg (Homebrew), cwebp 1.6.0 and sips. Every image was checked by eye after export.

## Outputs

| Path | Source | Operation | Dimensions | Bytes | Alt text suggestion |
|---|---|---|---|---|---|
| `site/assets/cover-book1.webp` | `_sources/v3/ASSETS/book1-anamnesis--cover-v1.png` (1792x2400) | crop `1677x2355+80+15` (just inside the spine hinge and rounded corners, with the gold double frame intact), Lanczos scale to 720x1043 (about 3% horizontal squeeze), cwebp q82 m6 sharp_yuv, metadata stripped | 720x1043 | 168,954 | Cover of The Anamnesis Engine, Book I of the Somatic Canticles by Witness Alchemist: a suited figure stands on a catwalk beneath a glowing blue neural web, between rows of lit specimen tanks. |
| `site/assets/cover-book2.webp` | `_sources/v3/ASSETS/book2-myocardial--cover-v2.png` (1792x2400) | crop `1455x2126+205+144` (navy backdrop and hinge removed), scale to 720x1043 (about 2% horizontal stretch), cwebp q82 | 720x1043 | 129,100 | Cover of The Myocardial Chorus, Book II of the Somatic Canticles by Witness Alchemist: a figure in an ornate filigree visor stands inside a cavern of red, vein-like tissue. |
| `site/assets/cover-book3.webp` | `_sources/v3/ASSETS/book3-ripening--cover-v2.png` (1792x2400) | crop `1255x1876+298+265` (white backdrop and hinge removed), scale to 720x1043 (about 3% horizontal stretch), cwebp q82 | 720x1043 | 113,556 | Cover of The Ripening, Book III of the Somatic Canticles by Witness Alchemist: a helmeted face whose visor holds a cracked sphere and a star-dust human silhouette. |
| `site/assets/poster-trilogy.jpg` | `_sources/bm-wiki/public/brand-assets/trilogy/trilogy--product-hero-wide.png` (2752x1536) | Lanczos scale to 1920 wide, JPEG q4 (the hero poster, and the still frame shown when motion is off) | 1920x1072 | 150,151 | The three Somatic Canticles volumes (teal, crimson and lavender) sliding into a navy velvet slipcase stamped in gold with the series name and a triangle sigil, floating in dark smoke. |
| `site/assets/og-fallback.jpg` | same as poster | scale to 1200 wide, then centre-crop to 1200x630 (cover crop), JPEG q4 | 1200x630 | 60,814 | Somatic Canticles trilogy slipcase with three volumes against dark smoke. |
| `site/assets/trilogy-fallback.mp4` | `_sources/v3/ASSETS/trilogy-hero--video.mp4` | `-map 0:v:0 -an`: the AAC audio and the MJPEG attached_pic stream are both dropped. libx264 High, preset slow, crf 23, yuv420p, `+faststart` (moov atom at the front), metadata stripped. 24 fps, 5.04 s. It does not loop seamlessly (first/last SSIM about 0.71). | 736x400 | 440,827 | Decorative. Use `aria-hidden="true"` with the `muted playsinline` attributes; the poster supplies the meaning. |
| `site/assets/favicon.svg` | hand-written, based on the triangle-in-triangle sigil (press brand mark and the slipcase emboss) | SVG: bronze `#C4873B` outer triangle, a concentric inner triangle and a seed dot, on a transparent background. No text. | 64x64 viewBox | 337 | Somatic Canticles sigil (decorative in the tab) |
| `site/assets/apple-touch-icon.png` | same sigil, rendered from SVG with sips | sigil at about 55% of the canvas on a solid `#0A1628` square | 180x180 | 4,898 | none needed (home-screen icon) |
| `site/assets/bg-atmos.jpg` | `trilogy--product-hero-wide.png`, left textless smoke region (x 0–640, y 880–1392 native) | crop, 2x bicubic upscale, Gaussian blur σ5, light grain, JPEG q5. Not tileable: use it as a large `cover` background at low opacity. | 1280x1024 | 20,394 | decorative (CSS background, no alt) |

Every size budget is met: covers ≤ 250 KB, poster ≤ 350 KB, OG ≤ 200 KB, texture ≤ 200 KB. The ffmpeg build here has no libwebp encoder, so the covers were encoded with the standalone `cwebp`.

### Cover aspect ratio note

All three covers are **720x1043, an aspect ratio of about 0.69 (close to 2:3, not 3:4)**. The flat fronts of the source renders have different native ratios: Book I is about 0.72 including its gold frame, Book II about 0.68 and Book III about 0.65. At 3:4, Book III would lose its title or byline, and Book II would lose "THE" at the top. At 0.69, every title, series line, byline and the Book I frame stays intact. The cost is a small horizontal rescale of up to about 3% per cover, which is not visible. Use `aspect-ratio: 720 / 1043` in CSS.

## Excluded, and why

- `_sources/v3/ASSETS/book2-myocardial--cover-v1.png`: its spine carries invented text ("Kfri.Boon", "ORBIT/TASCHEN", which are real publisher names). Banned.
- `book2-myocardial--product-hero.png` (both v3 and bm-wiki copies) and `book2-myocardial--video.mp4`: they carry an invented byline. Banned.
- `book1-anamnesis--cover-v2.png`: a photo of a book standing in a room. It can't be made flat, and it lacks "The" as well.
- `book3-ripening--cover-v1.png`: usable, but its style doesn't match the v1/v2 set chosen here (B1 v1 + B2 v2 + B3 v2).
- `book1-anamnesis--video.mp4`: the spine reads "ANANESIS" in the end frame, and there is no "The" in the title.
- The per-book `*--product-hero.png` stills and clips: their cover designs don't match the gold-title hardcovers used on the page.
- `_sources/bm-wiki/public/brand-assets/heroes/book-1-anamnesis--campaign-hero.png`: it contains text ("ANAMNESIS ENGINE" without "The", a campaign code and a tagline), so it was not used as the texture. The texture was taken from the textless smoke of the trilogy hero instead.
- `_sources/bm-wiki/public/press-kit/press--brand-mark.png`: a mockup photo with construction lines and annotation labels. It was not traced; the favicon is a simplified hand-drawn sigil.
- `trilogy-boxset--front--video.mp4` and the boxset stills: small, wobbly text and an emblem that doesn't match the trilogy-hero sigil.
- The STUDIO AURORA moodboard and anything from `marketing/campaign-copy.md`: banned by project rules.
- The `*--typo-mask--*` wallpapers: text-mask posters, not covers, and one may contain a letter error ("ANA/MNE/ESIS").

## Flags for the author

1. **The Book I cover art reads "ANAMNESIS ENGINE" without "The".** All page copy and alt text must still use "The Anamnesis Engine". A regenerated or edited cover is the lasting fix.
2. The covers are crops of hardcover mockup renders, not flat print files. A light cloth or paper texture and the mockup lighting are still visible.
3. The cover aspect ratio is about 0.69, not the 3:4 requested (see the note above).
4. The fallback clip is 736x400 (soft at full width) and doesn't loop seamlessly: play it once, crossfade it, or show it inset or under an overlay.
5. The slipcase sigil on the poster is a triforce-style subdivided triangle, while the press brand mark is a triangle with an inset triangle. The favicon follows the concentric (press) form, with a seed dot added.
