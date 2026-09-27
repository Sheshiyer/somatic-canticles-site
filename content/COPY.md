# COPY.md — Somatic Canticles landing page

This file holds every piece of copy the landing page uses. Builders take text from here and nowhere else.

**How to read it**
- Each block names its source file and ref.
- Text inside `VERBATIM` blocks must be copied character for character. That includes curly quotes, em dashes and the macron ē (U+0113).
- `[ORIGINAL]` marks microcopy written for this page. It is not canon, so the author reviews it before launch.
- `[TRIM]` marks canon text shortened by deleting words only. Nothing is reworded.
- `[CONDENSED]` marks a gloss shortened by deleting words only.

**Pinned refs**
- **v3 canon:** `Sheshiyer/somatic-canticles-v3-book-trilogy`, tag `v2.1-verified`, commit `ba74a874fdc43c00b3661d026cb865584b6daaa7` (short `ba74a87`). The local clone is `_sources/v3`.
- **Final blurbs (FB):** `Somatic-Canticles/00_PLANNING_AND_ROADMAP/MARKETING/final-polished-blurbs-and-logline.md`, author-locked 2026-06-03. It is a local file, not committed to v3 (see v3 issue #61).
- **Series bible (SB):** `Somatic-Canticles/01_WORLD_BIBLE/00_CORE_FOUNDATION/00_SERIES_BIBLE.md`, lines 125–166.
- **Rights:** `Somatic-Canticles/00_PLANNING_AND_ROADMAP/RIGHTS.md`.
- **Readiness:** `Somatic-Canticles/00_PLANNING_AND_ROADMAP/PUBLISHING_READINESS_GAPS.md`.
- **bm-wiki:** `_sources/bm-wiki/src/content/docs/…` (brand and voice only; no campaign copy).

**Byline:** Witness Alchemist. This is an author decision (2026-09-26) and matches the v3 covers.

---

## meta

**`<title>`** (46 chars) · from Frontmatter title + subtitle · v3 `FRONTMATTER/Frontmatter.md` @ `ba74a87`, lines 1–3

```
Somatic Canticles — A Trilogy of Consciousness
```

**`meta name="description"`** (152 chars) · [ORIGINAL]
- Assembled from canon pieces: level 1 of the FB logline, and "science-fiction trilogy" from v3 `README.md` line 22.
- The chapter count comes from the Frontmatter table of contents.

```
Witness. Sever. Ripen. Somatic Canticles is a 27-chapter science-fiction trilogy by Witness Alchemist. Read the opening of Book I. Join the reader list.
```

**`og:title` / `twitter:title`** · Frontmatter title + FB logline level 1

```
Somatic Canticles — Witness. Sever. Ripen.
```

**`og:description` / `twitter:description`** · FB, Series Logline, level 2 (verbatim)

```
The body is the last frontier; freedom is learning to author it.
```

**`og:site_name`**

```
Somatic Canticles
```

---

## hero

**Eyebrow** · VERBATIM · v3 `FRONTMATTER/Frontmatter.md` @ `ba74a87`, line 3 (`## A Trilogy of Consciousness`)

```
A Trilogy of Consciousness
```

**H1** · VERBATIM · FB, Series Logline, level 1

```
Witness. Sever. Ripen.
```

**Subhead (default)** · VERBATIM · FB, "Commercial One-Sentence Logline"

```
In 2026, when the hidden protocols of consciousness begin to fail, four Somanauts enter the living architecture of the body with the Anamnesis Engine — The Vine. The Wilt. The Witness. — to diagnose, integrate, and sever humanity from an inherited reality that was never truly free.
```

**Subhead (TRIM option)** · [TRIM] of the line above
- The only change is deleting the aside "— The Vine. The Wilt. The Witness. —" and the space before it.
- Every other word is untouched. The author should approve before use.

```
In 2026, when the hidden protocols of consciousness begin to fail, four Somanauts enter the living architecture of the body with the Anamnesis Engine to diagnose, integrate, and sever humanity from an inherited reality that was never truly free.
```

**Optional kicker / tagline** · VERBATIM · v3 `MARKETING/Back_Cover_Blurb.md` @ `ba74a87`, line 5 (bold line)

```
The Vine. The Wilt. The Witness.
```

**Warning line** · VERBATIM · FB (line 7 and Book I blurb) = v3 `MARKETING/Back_Cover_Blurb.md` last line
- The hero shows it as a standalone sentence, without the "Warning:" prefix.
- Add "Warning: " before it only if the design needs a label.

```
This book may alter how you feel in your body.
```

**Byline**

```
Witness Alchemist
```

**Email form (Buttondown, primary CTA)** · [ORIGINAL] microcopy

| Element | Text |
|---|---|
| Visible label (`<label for>`) | `Email address` |
| Input placeholder | `you@example.com` |
| Submit button | `Join the reader list` |
| Helper line under the form | `One letter when The Anamnesis Engine has a release date. No tracking on this page.` |
| Secondary link (to `#sample`) | `Read the first pages` |
| Tertiary link (to `#app`) | `Open the companion app` |

- "No tracking on this page" is true only while the ISA's no-analytics rule holds.
- Buttondown's own email open tracking is a separate setting. The author should switch it off or cut the clause.

---

## books

The series line is the same for all three cards. It is [ORIGINAL] and comes from the chapter counts in the v3 Frontmatter table of contents.

```
Three books. Twenty-seven chapters.
```

Each card has two one-liner options:
- **(a)** from v3 `MARKETING/Back_Cover_Blurb.md` @ `ba74a87`, lines 17–19;
- **(b)** from the tagline under each FB blurb.

Pick one source for all three cards so the voice stays consistent. **Recommended: (a) for all three.** Book II has a tagline conflict; see "flagged".

### Book I

- **Label:** `Book I`
- **Title:** `The Anamnesis Engine`
- **Chapters:** `Chapters 1–8`
- **One-liner (a)** · VERBATIM · v3 Back_Cover_Blurb.md line 17: `The search begins.`
- **One-liner (b)** · VERBATIM · FB Book I tagline: `A consciousness engineering manual disguised as science fiction.`
- **Blurb:** VERBATIM · FB, "Book I: The Anamnesis Engine → Back-Cover Blurb (Final Polished)". Full text; it contains no spoilers.

```
A mind is fracturing from the inside out. The protocol that was supposed to heal it has instead accelerated the Wilt.

Four Somanauts — specialists in the hidden architecture of consciousness — are dispatched with the Anamnesis Engine, a technology that lets them enter the living memory palace of a subject in crisis. Their mission: debug the redacted trauma, restore coherence, and return.

But the deeper they travel — through the choroid plexus, across the blood-brain barrier, into the Emperor's Genome and the Endocrine Dogma — the more they discover that the subject's wound is not unique. It is an echo of something older, something collective, something that has been governing human reality from the inside for generations.

Jian maps. Sona resonates. Gideon protects. Corv witnesses. One by one, the tools they brought to fix another person begin to rewrite the four of them.

The Anamnesis Engine does not simply reveal what was hidden. It demands that the team decide what they are willing to become in order to see it.
```

**Book I closing lines** · optional card footer · VERBATIM · FB

```
For readers who suspect the body is trying to tell them something they have spent their whole lives forgetting.
```

### Book II

- **Label:** `Book II`
- **Title:** `The Myocardial Chorus`
- **Chapters:** `Chapters 9–15`
- **One-liner (a)** · VERBATIM · v3 Back_Cover_Blurb.md line 18: `The heart remembers what the mind forgets.`
- **One-liner (b)** · VERBATIM · FB Book II tagline: `The heart remembers what the mind was built to survive.`
- **Blurb** · [TRIM] of FB, "Book II → Back-Cover Blurb (Final Polished)"
  - The text is cut after paragraph 4 of the source. The outcome paragraphs and everything after them are omitted.
  - Nothing is reworded. It still contains one phrase queued for author review; see "flagged" #1.

```
The first healing was only the beginning.

The team returns from their inaugural mission to discover that the redacted module they "fixed" was never unique. The same scream echoes across a lineage, a collective, a shared bio-acoustic field they now call the Myocardial Chorus.

What they once treated as a single subject's pathology is revealed as a resonant, self-perpetuating song of inherited trauma — Scar Tissue Sonnets that repeat across minds and generations.

Direct intervention fails. The system perceives healing as attack. The only path forward is Coherence Cultivation: the team must become a single, perfectly tuned instrument. Gideon the Sigil Smith, Corv the Debugger, Jian the Navigator, Sona the Breathfield Weaver — each must integrate their own fractures before they can sing with the wound rather than against it.
```

**Book II closing line** · optional · VERBATIM · FB Book II tagline 2

```
The chorus is waking up.
```

- The FB positions this line after the spoiler paragraphs.
- On its own it reveals no outcome. Use it or drop it at the author's call.

### Book III

- **Label:** `Book III`
- **Title:** `The Ripening`
- **Chapters:** `Chapters 16–27`
- **One-liner (a)** · VERBATIM · v3 Back_Cover_Blurb.md line 19: `What grows when the old world wilts?`
- **One-liner (b)** · VERBATIM · FB Book III tagline: `Freedom is not the end of the story.`
  - The FB continues this line with "It is the moment you discover you are now responsible for writing it."
- **Blurb (as specified)** · [TRIM] of FB, "Book III → Back-Cover Blurb (Final Polished)"
  - The text is cut before "The only way out is through the Severance Event". That cut also removes the corrupted phrase "Khalorēē Field Architecture".
  - The first line hints at Book II's outcome; see "flagged".

```
They healed the subject. They integrated the chorus. They shifted the Vine.

Now the Gardener has noticed.

An entity older than trauma, older than the human experiment, has been tending the deterministic cage for the predictable harvest of suffering. It does not rage. It simply makes the old patterns more comfortable, more seductive, more inevitable.
```

**Blurb (ALT, spoiler-safer)** · [TRIM]
- Same as above with the first paragraph deleted.
- **Recommended**, because the first line states Books I–II outcomes.

```
Now the Gardener has noticed.

An entity older than trauma, older than the human experiment, has been tending the deterministic cage for the predictable harvest of suffering. It does not rage. It simply makes the old patterns more comfortable, more seductive, more inevitable.
```

---

## somanauts

**Section eyebrow** · [ORIGINAL] · the term is from v3 `BACKMATTER/Glossary.md` @ `ba74a87`, entry "Somanaut"

```
The Somanauts
```

**Lead line** · VERBATIM · FB Book I blurb, paragraph 4

```
Jian maps. Sona resonates. Gideon protects. Corv witnesses.
```

**Intro line (optional)** · VERBATIM · v3 `MARKETING/Back_Cover_Blurb.md` @ `ba74a87`, line 9 (fragment)
- This is a sentence fragment. Use it as the caption.

```
scientists who navigate the somatic architecture
```

**Per-character cards**
- **Name:** first names only.
- **Role title and role line:** SB lines 127–144, VERBATIM.
- **Axiom:** SB lines 151–166, VERBATIM, inside curly quotes.
- **Verb:** FB Book I blurb.

| Order | Name | Verb (FB) | Role title (SB) | Role line (SB, verbatim) | Axiom (SB, verbatim) |
|---|---|---|---|---|---|
| 1 | Jian | maps | The Neuro-Cartographer | Maps chaotic biological environments into traversable data. | "Reality is a system." |
| 2 | Sona | resonates | The Bio-Acoustic Engineer | The team's sensor; reads the resonant frequencies of emotion, memory, and identity. | "Reality is a resonance." |
| 3 | Gideon | protects | The Systems Immunologist | The team's shield; neutralizes bio-threats and stabilizes the team's presence. | "Reality is a structure to be defended." |
| 4 | Corv | witnesses | The Psycho-Pathologist & Team Lead | The storyteller; synthesizes all data streams into a single, coherent diagnosis. | "Reality is a narrative." |

**Alternative epithets** · FB Book II blurb, VERBATIM
- Do not mix these with the SB role titles on the same card.

| Name | Epithet |
|---|---|
| Jian | the Navigator |
| Sona | the Breathfield Weaver |
| Gideon | the Sigil Smith |
| Corv | the Debugger |

---

## sample

**Section eyebrow** · [ORIGINAL]

```
Read the first pages
```

**Label**

```
Book I · The Anamnesis Engine
```

**Chapter title** · VERBATIM · v3 `CHAPTERS/book_1/Chapter-01-The-Choroid-Plexus.md` @ `ba74a87`, line 11
- The Frontmatter table of contents styles this as "Chapter 1: The Choroid Plexus". Either form is canon; the chapter file heading is below.

```
Chapter 01: The Choroid Plexus
```

**Excerpt** · VERBATIM · same file, lines 13–21: five paragraphs, 418 words

What was left out:
- lines 1–9, the `<!-- T-070 WAVE 4 REVISION … -->` editorial comment;
- line 11, the markdown heading, which is given above.

Handling notes:
- The file has no YAML front matter.
- Keep the file's curly quotes (’ “ ”).
- The two *…* spans are italics: *Vajra* and the thought line.
- **Manas Interface** is bold in the source. Keep it as `<strong>` or render it as plain text; do not restyle it.

Where it ends:
- The excerpt stops at the end of paragraph 5 (line 21), which is a natural break.
- It stops before line 33, which introduces the characters' surnames. That keeps the page to first names.

**Short cut (ALT, 343 words):**
- Lines 13–19 only, ending on the hook: "If the collapse reaches the ventricular floor, we lose the map."

--- BEGIN VERBATIM EXCERPT ---

The datascapes of the choroid plexus were screaming. Not through air, not through ear, but as a contradiction so dense it acquired force. It hit Jian first as pressure behind the eyes, a phantom migraine blooming through the immersion gel that still clung to his forearms. From the command cradle of the *Vajra* he watched the subject’s cerebrospinal architecture convulse across his display, each line of data insisting on mutually exclusive truths. The plexus should have been a disciplined estuary—capillaries, epithelial folds, a clean secretion rhythm, cerebrospinal fluid moving with lucid biological intent. Instead it resembled a flooded sanctuary. The ependymal lining flashed in arrhythmic bursts, capillary loops spasmed, and the fluid boiled, sheared, doubled back on itself as though the ventricle had forgotten what “inside” meant.

Jian’s hands tightened on the cradle’s rails. The gel—cool, faintly metallic—pressed against his forearms like the skin of something recently drowned. He felt the subject’s pulse travel through the interface, a distant drumbeat arriving in staggered waves. Somewhere beyond the sterile walls, the subject’s body lay in another facility, another life, another set of protocols that had already failed. The scream wasn’t metaphor; it was the Khalorēē field’s native tongue when it encountered something it could not fold into its living structure—a language of negation.

The room around him was dim, lit only by amber readouts and the faint bioluminescence of the panels. The air carried the sterile scent of ozone and a memory of antiseptic. This was his body, his breath, his heart rate tracking the subject’s collapse in real time. The gel cooled his skin, but his core temperature rose—sympathetic resonance, the body responding to the body’s response. A flicker of nausea rose, the first hint of vertigo on a cliff edge.

Across the field, coherent signals broke apart before they could cross the membrane. Jian locked his jaw. “This is not random noise,” he said. “The subject’s Khalorēē field is rejecting an event it cannot metabolize. System coherence is below eighty percent. If the collapse reaches the ventricular floor, we lose the map.”

Data slammed into him, too much, too fast. Then something in him stepped back—not another voice, not revelation—just training resurfacing under pressure. *You are not the stream. You are the instrument reading the stream.* His **Manas Interface** manifested at the edge of perception: not a mystic ornament, but a structured lattice of gold geometry slotting chaos into traversable relationships. The scream did not lessen, but his ability to remain inside it without being consumed did.

--- END VERBATIM EXCERPT ---

**Provenance line (required, exact)** · the form is from RIGHTS.md "Enforcement / Verification"; the ref is filled in from the pinned tag

```
Text source: Somatic-Canticles-v2 @ v2.1-verified (ba74a87). See RIGHTS.md.
```

**After-excerpt CTA** · [ORIGINAL]

```
The chapter continues in The Anamnesis Engine. Join the reader list to hear when it is ready.
```

**Preface pull-quote options** · VERBATIM · v3 `FRONTMATTER/Preface.md` @ `ba74a87`
- The source line breaks are preserved; render them as `<br>` or stack them.
- **A.** Final two lines:

```
If the book works, it will not tell you what to believe.
It will make certain inherited sentences harder to obey.
```

- **B.** Mid-preface:

```
If some passages feel bodily, read them bodily.
```

- **C.** Mid-preface:

```
Read slowly enough for the distinctions to matter.
```

**Pull-quote attribution**

```
— Preface, A Reader's Note
```

---

## app

**Section eyebrow** · [ORIGINAL]

```
The companion app
```

**Link**
- **URL:** `https://1319.tryambakam.space`
- **Link label:** `Open 1319.tryambakam.space` [ORIGINAL]

**Framing quote** · VERBATIM · RIGHTS.md line 77 (final paragraph)
- **Recommended form:** use the fragment, with "the" retained:

```
the books the stable body and the apps the living breath
```

- **Full source sentence**, for citation only:

  "This policy makes the books the stable body and the apps the living breath — exactly as intended by the Aletheia / WitnessOS core of the Work."

- **Suggested display** [ORIGINAL] framing around the verbatim fragment: `The books are the stable body; the app is the living breath.`
  - This is a paraphrase. It changes the grammar and the plural "apps".
  - Use it only if the author approves. Otherwise show the fragment in quotes.

**Alternative framing** · VERBATIM · PUBLISHING_READINESS_GAPS.md line 125

```
The portable, citable text of the transformation. The apps are where it breathes, updates, and the protocols actually run.
```

**Fact sentence** · [ORIGINAL]
- Facts come from the live app headline "Synchronize consciousness through 12 sacred chapters" and from r-canon §7.

```
The companion app offers 12 practices keyed to your biorhythm. They are separate from the 27 chapters of the books.
```

---

## lexicon

**Section eyebrow** · [ORIGINAL]

```
A short lexicon
```

All glosses come from v3 `BACKMATTER/Glossary.md` @ `ba74a87`. Each is 20 words or fewer. Glosses ending in a period are complete sentences from the source.

| Term (as in glossary) | Gloss | Status |
|---|---|---|
| Somanaut | A specialized explorer of the "soma" (body/consciousness) field. | VERBATIM (sentence 1) |
| Anamnesis Engine | The primary technological tool of the Somanauts. Its purpose is to look back to identify the original moments of concealment. | [CONDENSED] deletions only: "(Book 1)", "(anamnesis means "recollection")", "—the traumas and decisions…" |
| Khalorēē (kă-lō-rēē) | The total, bio-encoded reserve of metabolic and Field-Responsive Awareness that functions as the foundation for an Awareness. | VERBATIM (sentence 1) |
| The Vine of Determinism | The complex, self-perpetuating structure of inherited reality that conceals the true nature of Awareness. | VERBATIM (sentence 1) |
| The Gardener | The conservational maintenance intelligence that tends the Vine of Determinism. | VERBATIM (sentence 1) |
| Aletheia (The Unconcealment) | It represents the difficult, often painful process of revealing what is real through pattern-sensitive awareness. | VERBATIM (sentence 2) |
| Coherence Cultivation | The active practice of harmonizing the self ("Puṣṭivardhanam"). | VERBATIM (sentence 1) |

Font check: Khalorēē needs ē (U+0113) and the pronunciation needs ă (U+0103). Coherence Cultivation needs ṣ (U+1E63) and ṇ (U+1E47). If the display font lacks ṣ or ṇ, drop the parenthetical ("Puṣṭivardhanam") and mark it [CONDENSED].

---

## outro

**Closing line options** (pick one) · VERBATIM

- **A.** v3 `FRONTMATTER/Preface.md` @ `ba74a87`, last two lines. **Recommended if it is not already the sample pull-quote.**

```
If the book works, it will not tell you what to believe.
It will make certain inherited sentences harder to obey.
```

- **B.** v3 `FRONTMATTER/Frontmatter.md` @ `ba74a87`, Epigraph:

```
"We do not end the story. We open the door for the next one to begin."
— The Tryambakam Protocol
```

- **C.** v3 `FRONTMATTER/Frontmatter.md` @ `ba74a87`, Dedication:

```
To the Weavers, the Architects, the Alchemists, and the Guardians.
And to you, the Witness.
```

- **D.** FB, Series Logline, level 2:

```
The body is the last frontier; freedom is learning to author it.
```

**Repeat CTA:** same form as the hero.
- **Label:** `Email address`
- **Button:** `Join the reader list`
- **Helper** [ORIGINAL]: `Be first to know when Book I opens.`

**Colophon** · [ORIGINAL] (author decision)

```
Launch film made with /brag.
```

**Footer**

```
© 2026 Witness Alchemist. All rights reserved.
```

```
Text source: Somatic-Canticles-v2 @ v2.1-verified (ba74a87). See RIGHTS.md.
```

Footer link labels (optional) · [ORIGINAL]: `Sample` · `Companion app` · `Reader list`

---

## jsonld-facts

These are plain facts for a schema.org `BookSeries` graph. Every value below is sourced; do not add fields that are not listed.

| Field | Value | Source |
|---|---|---|
| `@type` | `BookSeries` | — |
| `name` | `Somatic Canticles` | v3 Frontmatter line 1 |
| `alternativeHeadline` | `A Trilogy of Consciousness` | v3 Frontmatter line 3 |
| `author` | `{ "@type": "Person", "name": "Witness Alchemist" }` | author decision 2026-09-26 (pen name; see "flagged" on Person vs Organization) |
| `inLanguage` | `en` | — |
| `genre` | `Science fiction` | v3 README line 22: "a science-fiction trilogy" |
| `description` | `The body is the last frontier; freedom is learning to author it.` | FB logline level 2 |
| `copyrightYear` | `2026` | v3 Frontmatter, "Copyright © 2026" |
| `hasPart[0]` | `{ "@type": "Book", "name": "The Anamnesis Engine", "position": 1 }` | v3 Frontmatter TOC |
| `hasPart[1]` | `{ "@type": "Book", "name": "The Myocardial Chorus", "position": 2 }` | v3 Frontmatter TOC |
| `hasPart[2]` | `{ "@type": "Book", "name": "The Ripening", "position": 3 }` | v3 Frontmatter TOC |

Excluded on purpose:
- `numberOfPages`
- `isbn` (the ISBN is `[PENDING-ISSUANCE]`)
- `datePublished`
- `offers` / price
- `bookFormat`
- `publisher`
- any license
- any length statistic
- `aggregateRating`

Each `Book` part may carry `"author"` (same Person) and `"inLanguage": "en"`.

---

## trailer-beats

These are beats the /brag film may use. They come from bm-wiki `src/content/docs/marketing/video-scripts.md`, "Launch Trailer: 45 Seconds" and "Short Social Cut". The voiceover lines below are VERBATIM. Only non-fabricated lines are kept; prefer the canon lines in the sections above for on-screen text.

| Beat | Voiceover (verbatim) | Note |
|---|---|---|
| Open | "The frontier is not outside the body." | brand line, not book canon |
| Close | "Enter the body. Read the map." | brand line, not book canon |

What was dropped, and why:
- "Three books. Thirteen systems. One map of consciousness." is kept out of on-screen copy until the author rules on it. "Thirteen systems" is not a chapter count and could be misread next to "27 chapters".
- The visual "Three volumes emerging in a Solar Bronze slipcase" describes a format with no author decision; see "flagged".
- The CTA lines "Explore the reader press kit" and "Open the NotebookLM research archive" were dropped because the press kit is out of scope and not linked.

**Canon on-screen sequence for the film (recommended):**
1. `A Trilogy of Consciousness`
2. `This book may alter how you feel in your body.`
3. The three titles
4. `Jian maps. Sona resonates. Gideon protects. Corv witnesses.`
5. `Witness. Sever. Ripen.`

---

## flagged

These items are for the author's copy review. Terms listed here are quoted only so they can be flagged. None of them appears in any block above this section, except where the note says so.

1. **Book II blurb, "a shared bio-acoustic field".**
   - The final polished blurb keeps this phrase. It is probably a substitution-script artifact ('spiritual' → 'Bio-Acoustic', `scripts/final_terminology_cleanup.js`).
   - It is still inside the Book II trim above, because the brief allows no rewording. **Author: rule on it** (for example "a shared field", or keep it).
2. **Sona's role title, "The Bio-Acoustic Engineer" (SB line 138).**
   - It is used above because it is the series bible role title.
   - v3 Glossary "Somanaut" also says "bio-acoustic engineers", so it is probably genuine. However, the SB was run through the same substitution scripts.
   - It is never used as a genre keyword. **Author: confirm.**
3. **Genre keyword "Bio-Acoustic" (FB, KDP/Keywords line).** Not used anywhere; `genre` is "Science fiction".
4. **Logline level 5 ("A bio-acoustic consciousness thriller…").** Not used.
5. **Book III blurb, "a ripened Khalorēē Field Architecture detach from the Vine".**
   - This is a substitution artifact; the original was "ripened consciousness", and the v3 Glossary says "ripened field".
   - It is excluded by the truncation. The truncation also removes the Severance Event mechanism and the ending.
6. **Book III trim opens with "They healed the subject. They integrated the chorus."**
   - That states the Book II outcome, a mild series spoiler.
   - An ALT trim that starts at "Now the Gardener has noticed." is provided and recommended.
7. **Book II tagline conflict.**
   - FB: "The heart remembers what the mind was built to survive."
   - v3 Back_Cover_Blurb.md: "The heart remembers what the mind forgets."
   - v3 is the pinned repo, so (a) is the recommended default. **Author: pick one canonical line.**
8. **Book I title on the cover art.** Per the plan, the art uses the short form without "The". All page copy uses "The Anamnesis Engine". Cover `alt` text should also use "The Anamnesis Engine".
9. **Epithet drift.** "Jian the Navigator" (FB Book II) versus "The Neuro-Cartographer" (SB). The cards use SB titles, and the FB epithets are kept as a separate list. Do not mix them on one card.
10. **"In 2026, …" (commercial logline).** It is now 2026, so the setting reads as near-present. It is kept verbatim; the author may prefer the TRIM or the level-1 H1 alone.
11. **TRIM of the commercial logline.** It deletes the aside "— The Vine. The Wilt. The Witness. —". Grammar and capitalization are unchanged. It needs the author's sign-off, because ISC-12 requires an author-approved trim.
12. **App framing, "the books the stable body and the apps the living breath".**
    - This is a mid-sentence fragment of RIGHTS.md line 77.
    - Its source sentence continues with "Aletheia / WitnessOS core of the Work", which is internal language; do not show it.
    - The display paraphrase "The books are the stable body; the app is the living breath." is [ORIGINAL] and needs approval.
13. **RIGHTS.md "MIT for the repo artifacts" (line ~50) and the v3 README MIT badge.**
    - Neither is used. There is no LICENSE file, and the page says "All rights reserved".
    - RIGHTS.md still has the placeholder "© 2026 [Author / Principal]". The footer uses "Witness Alchemist" per the author decision; RIGHTS.md should be updated to match.
14. **Provenance label.** "Somatic-Canticles-v2" is the RIGHTS.md-mandated wording, but the pinned repo is named `somatic-canticles-v3-book-trilogy`, even though it contains the v2 tree. The label is kept per RIGHTS.md.
15. **Sample surnames.** Chapter 1 line 33 introduces the house surnames Seter, Vireth and Luminth. The excerpt ends at line 21 so that only first names appear. Do not extend it past line 31.
16. **Sample, "Chapter 01" versus "Chapter 1".** The chapter file heading says "Chapter 01: The Choroid Plexus"; the Frontmatter TOC says "Chapter 1". Both are canon.
17. **bm-wiki "Solar Bronze slipcase" / "Three volumes … slipcase".** This is brand-generator output, not an author decision on format. It is not used as a claim. The film may show three books but must not state the format.
18. **"Three books. Thirteen systems. One map of consciousness."** (bm-wiki; the live site says "…One Map of the Body.") There are two variants, and "Thirteen systems" sits next to "27 chapters". It is not used; the author may approve one variant.
19. **Hero helper, "One letter when The Anamnesis Engine has a release date. No tracking on this page."** [ORIGINAL]
    - The first sentence promises how often readers will hear from the list.
    - "No tracking" depends on the Buttondown open/click tracking settings. **Author: confirm or cut.**
20. **Lexicon diacritics.** "Puṣṭivardhanam" needs ṣ/ṇ glyphs in the chosen font. If the font lacks them, drop the parenthetical.
21. **Author entity type.** Witness Alchemist is a pen name. JSON-LD uses `Person`; switch to `Organization` if the author prefers the project framing. v3 Backmatter "About the Author" names "The Why Chromosome"; this is not used.
22. **App fact "12 practices keyed to your biorhythm".** It is taken from the live app headline ("12 sacred chapters") as recorded in r-canon §7. The app does not mention the books, so the page's "separate from the 27 chapters" line is the only bridge. **Author: confirm the wording "practices".**
23. **Excluded from copy entirely:**
    - any word count;
    - the character names that are forbidden sources;
    - bm-wiki campaign-copy material;
    - the unmacroned ASCII spelling of Khalorēē;
    - Severance Event outcome lines and the other Book II/III resolution lines (see the brief).
