# Brag Plan: Somatic Canticles

## What is this app?
*Somatic Canticles* is a 27-chapter science-fiction trilogy in which four Somanauts enter the living architecture of the body to debug an inherited reality. The project is its launch page at somatic.tryambakam.space.

## The angle
**The film is a dissection plate that comes alive.** The site already presents everything as a numbered anatomical atlas: plates, specimens, registration marks and an ECG spine. The film takes that literally. A heartbeat trace becomes a vine. The vine becomes the trilogy's three verbs. The verbs become three catalogued specimens (the real covers). The Somanauts appear as live instrument readouts. The first page of Book I rises like a printed plate, and its drop cap becomes the sigil.

Every frame is drawn from the site's own design system: tokens, fonts, plate chrome and covers, so the trailer and the page read as one object.

## Hook (first 2 seconds)
A single ECG trace crosses the void. On the first two beats it spikes into a heartbeat. Over it, in large Cinzel, the line **THE BODY IS THE LAST FRONTIER.** rises letter by letter. It is the canon logline (level 2, first clause, truncated only) and is fully settled by 0.6 s.

## Key moments (the middle)
- **WITNESS. SEVER. RIPEN.**: one word per beat-pair, each with its own motion idea.
  - WITNESS: a compass-drawn vesica eye opens.
  - SEVER: a diagonal cut splits the vine and the word itself.
  - RIPEN: a bloom of seed particles.
- **Specimens 01–03.** The real covers swing in on perspective quads with a specular sheen. Each is catalogued with a Fira Code specimen label and chapter range, then the camera pulls back to "THREE BOOKS. TWENTY-SEVEN CHAPTERS.", the site's own headline.
- **The Somanauts as instruments.** Four readout panels land on four beats: JIAN · MAPS (stepped trace), SONA · RESONATES (sine), GIDEON · PROTECTS (guarded pulse), CORV · WITNESSES (ECG). Each panel sounds its own tone in the key of D.

## Outro / punchline
The cream first page of Book I ("Chapter 01: The Choroid Plexus", verbatim text) rises as a printed plate. The camera pushes into its drop cap T, which match-cuts into the triangle sigil. The SOMATIC CANTICLES wordmark resolves from the centre outward, then A TRILOGY OF CONSCIOUSNESS and somatic.tryambakam.space. The last 0.5 s holds.

## User flow worth showing
The page is landing-only, so there is no product flow to show. The equivalent is the reader's path the site sells: arrive (the hook) → meet the books (specimens) → meet the crew (readouts) → read the first page (sample plate) → the name and URL. Only real canon copy and real covers appear.

## Tone
- Preset: `cinematic`
- Creative direction: "a dissection plate that comes alive: clinical mysticism, an archive from a future monastery"
- Interpretation: trailer scale and big type, but the energy comes from precise motion (draw-ons, registration, beat-locked reveals), not flashes. Restraint over spectacle: no neon, no bloom blow-outs, no full-frame flashes.

## Format: landscape — 1920x1080 @ 60 fps
## Duration: 15.0 s (900 frames)

The user asked for 15 s. That is brag's minimum, and it works because the pacing is beat-locked at 120 BPM (one idea per beat or beat-pair).

## Visual identity (from the project)
- Background: Void Teal `#0A1628` (raised `#12233B`)
- Accent: Solar Bronze `#C4873B` (bright `#D9A25E`)
- Text: Phosphor Cream `#F0EDE3`; meta Titanium `#8A9BA8`
- Living strokes: Chlorophyll `#4A7C59` (strokes only), text-safe `#7DB38E`
- Display font: Cinzel (400/700)
- Body font: EB Garamond (sample page); labels in Fira Code
- Strongest visual elements: the Atlas plate chrome (registration marks, rulers, specimen labels, ECG spine), the three covers, the cream printed sample page, and the concentric-triangle sigil.

## Share copy (draft)
Somatic Canticles. The body is the last frontier; freedom is learning to author it.

## Audio direction
- Role: cinematic support with a bodily pulse. The heartbeat is the clock.
- Music: an original synthesized score, not the bundled ende.app tracks. Those are upbeat corporate beds, a poor tonal fit. brag allows skipping the bundled music when that is the stronger creative move. The picture and the score are generated from one shared cue list (`film/src/timeline.ts`).
- Music treatment: a D-minor drone (D1/A1) fades in from silence, with a heartbeat on the beat grid. A Dm9 pad opens at RIPEN, a chord lift into the specimens, and a bell chord with sub at the resolve. The tail rings out.
- Music cue guidance: 120 BPM, 1 beat = 30 frames. Strong cues fall at 2.5 s (WITNESS), 3.5 s (SEVER), 4.5 s (RIPEN), 5.5/6.5/7.5 s (specimens), 9.5–11.0 s (readouts) and 13.5 s (resolve).
- Audio-reactive treatment: none. The visuals are keyed to the same cue list, so sync is exact by construction.
- SFX posture: moderate and motion-matched, all in D Dorian so effects sit in the score's key.
- Audio-coupled moments:
  - ECG spikes = heartbeats.
  - WITNESS = bronze bell.
  - SEVER = cut impact plus a tearing noise sweep.
  - RIPEN = shimmer swell.
  - Specimen landings = soft low thuds plus glass ticks.
  - Four readouts = four character tones (D, F, A, C).
  - The page rise = a paper whoosh.
  - The resolve = bell chord plus sub.
- Restraint rule: no harsh highs, no clipping, no beat-matching gimmicks. -14 LUFS integrated, true peak ≤ -1.5 dBTP.

## Storyboard (900 frames @ 60 fps; scenes snap to the 120 BPM beat grid)

### Scene 1 — Hook: the last frontier — 2.5 s (f0–149)
An ECG trace sweeps the void with heartbeats at f30 and f60. "THE BODY IS / THE LAST FRONTIER." rises letter by letter (f6–40) and holds. A faint Khalorēē field breathes behind it. From f110 the flatline peels up into a vine stem.
Sequential/interaction: yes. The letters rise one by one and the trace draws on.
Audio intent: a body waking in the dark.
Audio-coupled idea: heartbeat = ECG spike.
Transition mood: soft → the vine carries into Scene 2.

### Scene 2 — Witness. Sever. Ripen. — 3.0 s (f150–329)
- f150 WITNESS: compass arcs draw a vesica eye with seed-of-life rosettes, and the word tracks in from wide.
- f210 SEVER: a diagonal cut slashes the vine. The word splits along the same line, its halves slide apart and then settle.
- f270 RIPEN: seed particles bloom and leaves unfurl along the vine; the word warms toward bronze.

Each word is settled for at least 0.8 s.
Sequential/interaction: yes. One word per beat-pair.
Audio intent: three struck truths.
Audio-coupled idea: bell / cut / shimmer.
Transition mood: hard cut on the beat → plates.

### Scene 3 — Specimens 01–03 — 4.0 s (f330–569)
The Atlas plate chrome draws in (grid, rulers, crop marks, "PLATE II · SPECIMENS"). The covers swing in on perspective quads, one per second (f330, f390, f450). Each gets a scrambled-in specimen label:
- SPECIMEN 01 — THE ANAMNESIS ENGINE — CH. 1–8
- SPECIMEN 02 — THE MYOCARDIAL CHORUS — CH. 9–15
- SPECIMEN 03 — THE RIPENING — CH. 16–27

At f510 the camera pulls back to all three and "THREE BOOKS. TWENTY-SEVEN CHAPTERS." lands.
Sequential/interaction: yes. Three cards arrive one by one.
Audio intent: weight and catalogue precision.
Audio-coupled idea: a thud per card landing, ticks under the label scramble.
Transition mood: clean wipe along a ruler → readouts.

### Scene 4 — The Somanauts — 2.5 s (f570–719)
Four instrument panels slide in on beats f570/600/630/660: JIAN · MAPS, SONA · RESONATES, GIDEON · PROTECTS, CORV · WITNESSES. Each waveform scrolls live. The caption "scientists who navigate the somatic architecture" is set small.
Sequential/interaction: yes. Four panels arrive one per beat.
Audio intent: a crew coming online.
Audio-coupled idea: four character tones.
Transition mood: dramatic → the page rises.

### Scene 5 — The first page — 1.5 s (f720–809)
The cream page rises in perspective. Running heads read SOMATIC CANTICLES · THE ANAMNESIS ENGINE, then CHAPTER 01: THE CHOROID PLEXUS, a drop cap T, and verbatim body lines revealed top to bottom. From f770 the camera pushes into the drop cap.
Sequential/interaction: yes. The lines reveal in sequence.
Audio intent: intimacy; paper and breath.
Audio-coupled idea: paper whoosh, then a reverse swell into the resolve.
Transition mood: match cut (T → sigil).

### Scene 6 — Resolve — 1.5 s (f810–899)
The sigil completes, the SOMATIC CANTICLES wordmark resolves from the centre outward, and A TRILOGY OF CONSCIOUSNESS and somatic.tryambakam.space land. Everything is settled by f865 and held to the end (the poster candidate).
Audio intent: arrival.
Audio-coupled idea: bell chord plus sub on f810; the tail decays.

**Durations:** 2.5 + 3.0 + 4.0 + 2.5 + 1.5 + 1.5 = **15.0 s** ✓
**Music mood for this video:** cinematic
**Audio summary:** a heartbeat in the dark grows into a D-minor score that strikes three truths, catalogues three books, brings four instruments online, turns a page and lands on a bell.

## Composition note (deviation from /brag --full, by author direction)
brag's Step 3 hands off to Hyperframes. At the author's direction this film instead uses the proven house showreel system from the Temperance and Cambium reels:
- **Engine:** a TypeScript canvas/WebGL engine where every frame is a pure function of the frame number.
- **Capture:** headless Chromium (the Hyperframes-provisioned chrome-headless-shell) pushes raw RGBA frames straight into ffmpeg.
- **Score:** a synthesized soundtrack built from the same cue list.
- **QA gate:** in place of `hyperframes check`: stills review, cambium's verify suite (spec, loudness, strobe, determinism) and the site's contrast tokens.

No Remotion. brag's plan, creative laws, poster bake and share-copy deliverables are followed as written.
