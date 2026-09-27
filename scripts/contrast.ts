#!/usr/bin/env bun
// WCAG 2.1 contrast gate for the DESIGN.md token contract.
// Usage: bun scripts/contrast.ts        -> prints a markdown table, exits 1 on any failure
//
// Pair kinds:
//   text  — body/UI text of any size. Must reach 4.5:1 (SC 1.4.3).
//   large — marked large-display text only (>= 24px regular or >= 18.66px bold). 3:1 allowed (SC 1.4.3).
//   ui    — non-text: focus rings, borders of controls, icons, graphic strokes. 3:1 (SC 1.4.11). Never used for text.

type Kind = "text" | "large" | "ui";

// Keep in sync with the :root block in DESIGN.md and site/styles.css.
const tokens: Record<string, string> = {
  "--void": "#0A1628",
  "--void-raised": "#12233B",
  "--cream": "#F0EDE3",
  "--bronze": "#C4873B",
  "--bronze-bright": "#D9A25E",
  "--titanium": "#8A9BA8",
  "--chlorophyll": "#4A7C59",
  "--chlorophyll-bright": "#7DB38E",
};

const pairs: Array<{ fg: string; bg: string; kind: Kind; use: string }> = [
  { fg: "--cream", bg: "--void", kind: "text", use: "body copy, headings, sample text" },
  { fg: "--cream", bg: "--void-raised", kind: "text", use: "text on cards, form fields, sample panel" },
  { fg: "--bronze", bg: "--void", kind: "text", use: "links, eyebrows, chapter markers" },
  { fg: "--bronze", bg: "--void-raised", kind: "text", use: "links / labels on cards" },
  { fg: "--bronze-bright", bg: "--void", kind: "text", use: "link hover / focus text" },
  { fg: "--titanium", bg: "--void", kind: "text", use: "meta, captions, provenance, colophon" },
  { fg: "--titanium", bg: "--void-raised", kind: "text", use: "meta on cards, input placeholder" },
  { fg: "--chlorophyll-bright", bg: "--void", kind: "text", use: "living-moment labels (form success, app note)" },
  { fg: "--chlorophyll-bright", bg: "--void-raised", kind: "text", use: "living-moment labels on cards" },
  { fg: "--void", bg: "--bronze", kind: "text", use: "primary button label" },
  { fg: "--void", bg: "--bronze-bright", kind: "text", use: "primary button label, hover" },
  { fg: "--void", bg: "--cream", kind: "text", use: "skip link, inverted chip" },
  { fg: "--bronze", bg: "--void", kind: "large", use: "Cinzel display (H1/H2 accent words, >= 32px)" },
  { fg: "--bronze-bright", bg: "--void", kind: "ui", use: "focus ring (2px outline)" },
  { fg: "--titanium", bg: "--void", kind: "ui", use: "input borders, hairline dividers on controls" },
  { fg: "--chlorophyll", bg: "--void", kind: "ui", use: "graphic strokes only (ECG line, vine motif); never text" },
];

function lum(hex: string): number {
  const n = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const min: Record<Kind, number> = { text: 4.5, large: 3, ui: 3 };
let failed = 0;
const rows: string[] = [
  "| fg | bg | ratio | kind | min | result | use |",
  "|---|---|---|---|---|---|---|",
];

for (const p of pairs) {
  const fg = tokens[p.fg];
  const bg = tokens[p.bg];
  if (!fg || !bg) {
    console.error(`unknown token in pair ${p.fg} / ${p.bg}`);
    process.exit(1);
  }
  const r = ratio(fg, bg);
  const ok = r >= min[p.kind];
  if (!ok) failed++;
  rows.push(
    `| \`${p.fg}\` ${fg} | \`${p.bg}\` ${bg} | ${r.toFixed(2)}:1 | ${p.kind} | ${min[p.kind]}:1 | ${ok ? "PASS" : "FAIL"} | ${p.use} |`,
  );
}

console.log(rows.join("\n"));
console.log(`\n${pairs.length - failed}/${pairs.length} pairs pass.`);
if (failed) {
  console.error(`${failed} pair(s) below minimum.`);
  process.exit(1);
}
