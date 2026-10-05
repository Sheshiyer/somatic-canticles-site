// Cache-bust the film: /assets/* is served `immutable` for a year, so a re-rendered
// brag.mp4/brag.jpg must change URL. Stamps every reference in site/index.html with
// ?v=<first 12 hex of the file's sha256>. Idempotent; run after each film render
// (film/tools/mux.ts calls it). check-site.mjs verifies the stamps match the files.
//   bun scripts/stamp-assets.ts
import { join, resolve } from "node:path";

const SITE = resolve(import.meta.dir, "..", "site");
export const STAMPED = ["brag.mp4", "brag.jpg"];

export async function contentStamp(file: string) {
  const bytes = await Bun.file(join(SITE, "assets", file)).arrayBuffer();
  return new Bun.CryptoHasher("sha256").update(bytes).digest("hex").slice(0, 12);
}

export async function stamp() {
  const htmlPath = join(SITE, "index.html");
  let html = await Bun.file(htmlPath).text();
  const out: Record<string, string> = {};
  for (const file of STAMPED) {
    const v = await contentStamp(file);
    const re = new RegExp(`((?:https://somatic\\.tryambakam\\.space/)?assets/${file.replace(".", "\\.")})(?:\\?v=[0-9a-f]+)?`, "g");
    html = html.replace(re, `$1?v=${v}`);
    out[file] = v;
  }
  await Bun.write(htmlPath, html);
  return out;
}

if (import.meta.main) {
  const s = await stamp();
  for (const [f, v] of Object.entries(s)) console.log(`stamped ${f}?v=${v}`);
}
