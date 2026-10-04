// Design tokens: mirrored from the site's DESIGN.md :root block (no new values).
export const C = {
  void: "#0A1628",
  voidRaised: "#12233B",
  voidDeep: "#060E1B", // vignette floor only (void at 60% luminance)
  cream: "#F0EDE3",
  bronze: "#C4873B",
  bronzeBright: "#D9A25E",
  titanium: "#8A9BA8",
  chlorophyll: "#4A7C59", // strokes only, never text
  chlorophyllBright: "#7DB38E",
} as const;

export const FONT = {
  display: '"Cinzel", serif',
  body: '"EB Garamond", serif',
  mono: '"Fira Code", monospace',
} as const;

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
/** Unicode range per subset file (from @fontsource), so each glyph has exactly one source face. */
export const rangeOf = (file: string) => (file.includes("latin-ext") ? LATIN_EXT : LATIN);

/** Every face the film uses; preloaded before frame 0, added in this fixed order. */
export const FACES: ReadonlyArray<{ family: string; file: string; weight: string; style: string }> = [
  { family: "Cinzel", file: "cinzel-latin-400-normal.woff2", weight: "400", style: "normal" },
  { family: "Cinzel", file: "cinzel-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
  { family: "Cinzel", file: "cinzel-latin-700-normal.woff2", weight: "700", style: "normal" },
  { family: "Cinzel", file: "cinzel-latin-ext-700-normal.woff2", weight: "700", style: "normal" },
  { family: "EB Garamond", file: "eb-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
  { family: "EB Garamond", file: "eb-garamond-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
  { family: "EB Garamond", file: "eb-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
  { family: "EB Garamond", file: "eb-garamond-latin-ext-400-italic.woff2", weight: "400", style: "italic" },
  { family: "EB Garamond", file: "eb-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  { family: "Fira Code", file: "fira-code-latin-400-normal.woff2", weight: "400", style: "normal" },
  { family: "Fira Code", file: "fira-code-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
  { family: "Fira Code", file: "fira-code-latin-500-normal.woff2", weight: "500", style: "normal" },
];
