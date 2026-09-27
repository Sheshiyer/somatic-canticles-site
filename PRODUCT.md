# Product

## Register

brand

## Users

Readers of metaphysical and medical-thriller science fiction: people who pick up a novel for mythic scale and stay for the precision. The comparison that finds them is "The Matrix meets The Body Keeps the Score." They read slowly, reread, notice when a world is built rather than decorated, and distrust anything that smells like a wellness funnel. Many have an embodiment practice of their own and want fiction that treats the body as seriously as it treats consciousness.

Primary arrival path: a shared link to the launch film, in a group chat, on X, on LinkedIn, in a newsletter. They land on a phone with the film already moving and give the page two seconds to prove it is a real book by a real author. If the first frame is generic, they leave.

Secondary audience: reviewers, booksellers and potential backers checking whether *Somatic Canticles* exists as a finished work (it does: three books, 27 chapters) and where to follow it.

## Product Purpose

This site is the public front door for *Somatic Canticles*, a finished, unpublished trilogy by Witness Alchemist: *The Anamnesis Engine*, *The Myocardial Chorus* and *The Ripening*. There is no pre-order, retailer or price yet, so the page does three things only:

1. Convert visitors to the reader list. The form sits beside the film and again at the close; it is the one action that matters.
2. Give one real page. A verbatim excerpt of Book I, with its provenance, so a stranger can judge the prose for themselves.
3. Point to the companion app. A separate practice with 12 practices, framed as a companion to the 27-chapter trilogy, never as the book.

Success looks like: a visitor watches the film, reads the sample, and leaves an email because they want to know when the book ships.

## Brand Personality

An archive from a future monastery: technical, botanical, luminous, and meticulously made. Precise, luminous and grounded. Embodied before cosmic: every line starts in body, breath, material and threshold before it widens into consciousness. Premium but not ornamental; elevated language only where it sharpens the world. It carries mystery without drifting into vague spiritual abstraction, and it names its systems without drowning in jargon. When an idea is already complex, the sentence stays clean and one image carries it.

Three words: **precise, luminous, grounded.**

Voice references in the right lane: the reader-first calm of the bm-wiki voice guide, the restraint of a literary imprint's catalogue page, the object-first confidence of a well-made slipcase edition, and the slow cinematic briefing of the launch-trailer direction (slow parallax, sparse large type, bronze and phosphor accents).

## Anti-references

What this should NOT look like:

- Generic book-launch templates: cover on the left, "Buy now" on the right, a row of review stars, a countdown timer.
- New-age or wellness clipart: generic chakra wheels, low-detail mandalas, lotus icons, stock meditation photography.
- Neon cyberpunk: magenta and cyan glow, glitch text, rain-slicked city overlays.
- Gamified HUD: the look of the 1319 biorhythm web app, with RTS panels, power-number neons, "Mission Brief" boxes and unlock counters. The companion app is linked, not imitated.
- AI-startup gradient blobs, glowing meshes and abstract "intelligence" graphics.
- Fake social proof: invented testimonials, reader counts, star ratings, "as seen in" logos or practitioner metrics. Nothing on the page may be fabricated.

## Design Principles

1. **Show, don't tell.** The film, the three covers and one real page do the persuading. Copy stays short, specific and verbatim from canon.
2. **Canon is sacred.** Every line of book copy is verbatim from the pinned canonical source. Titles, names and the macron in Khalorēē are exact; nothing is paraphrased, invented or borrowed from marketing drafts.
3. **Mystery sells a thriller.** Reveal the premise, the stakes and the four Somanauts. Never reveal an ending, an outcome or a turn.
4. **Every frame postable.** Any screenshot at any scroll position, and any frozen frame of the film, should look like it belongs in the book's own press kit.
5. **Respect the reader's body.** A book about the body should not assault one: no autoplaying sound, motion that yields to reduced-motion settings, generous measure and contrast for long reading.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast minimums for every text/background pair, checked by `bun scripts/contrast.ts`.
- Respect `prefers-reduced-motion`: the hero film does not autoplay when the user has reduced motion set; show the poster frame and a play button instead. Parallax and reveal animations are disabled.
- Sound is always the user's choice: the film starts muted, with a visible mute toggle (`aria-pressed`) and a play/pause button whose label follows its state.
- Keyboard navigable: every link, button, form field and video control is reachable and operable via keyboard, in a logical order, with a visible focus ring.
- Semantic HTML (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<button>`, `<label>`); one `<h1>`, no skipped heading levels; a skip-to-content link as the first focusable element.
- Every image has meaningful `alt` text; the email form works as a plain HTML POST without JavaScript.
- No analytics, no tracking scripts, no third-party cookies.
