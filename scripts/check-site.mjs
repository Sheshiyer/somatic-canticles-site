#!/usr/bin/env bun
// Site sanity gate for site/index.html. Port of latent-spaces/brag scripts/check-docs.mjs.
// Zero dependencies. Usage: bun scripts/check-site.mjs   (exit 1 on any failure)

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "site");
const indexPath = path.join(siteDir, "index.html");
const html = readFileSync(indexPath, "utf8");

const BUTTONDOWN = "https://buttondown.com/api/emails/embed-subscribe/";
const ORIGIN = "https://somatic.tryambakam.space/";
const TEXT_EXT = new Set([".html", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".md", ".xml", ".webmanifest"]);
const SITE_BUDGET = 1.5 * 1024 * 1024;
const COVER_BUDGET = 250 * 1024;

const results = [];
function check(name, failures) {
  results.push({ name, failures });
}

// same-origin absolute URLs (og:image, og:video) are checked as local files
const sameOrigin = (value) => (value && value.startsWith(ORIGIN) ? value.slice(ORIGIN.length) : value);
function isLocalReference(value) {
  value = sameOrigin(value);
  return value && !value.startsWith("#") && !value.startsWith("//") && !/^[a-z][a-z0-9+.-]*:/i.test(value);
}
function localPathFor(value) {
  return path.join(siteDir, sameOrigin(value).split(/[?#]/, 1)[0]);
}
const stampOf = (rel) => createHash("sha256").update(readFileSync(path.join(siteDir, rel))).digest("hex").slice(0, 12);
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1] : null;
}
function hasBoolAttr(tag, name) {
  return new RegExp(`\\s${name}(?=[\\s>=/])`, "i").test(tag);
}
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const siteFiles = walk(siteDir);

// (1) every local src/href/poster and og:image/og:video exists on disk
{
  const failures = [];
  const refs = [...html.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g)].map((m) => m[1]);
  for (const m of html.matchAll(/<meta\b[^>]*property=["']og:(?:image|video)["'][^>]*>/gi)) {
    const content = attr(m[0], "content");
    if (content) refs.push(content);
  }
  for (const ref of refs) {
    if (!isLocalReference(ref)) continue;
    if (!existsSync(localPathFor(ref))) failures.push(`missing local reference: ${ref}`);
  }
  check(`local references exist (${refs.filter(isLocalReference).length} checked)`, failures);
}

// (1b) film URLs carry ?v=<sha256 prefix of the file>; /assets/* is cached immutable for a year
{
  const failures = [];
  for (const file of ["brag.mp4", "brag.jpg"]) {
    const want = stampOf(path.join("assets", file));
    const refs = [...html.matchAll(new RegExp(`assets/${file.replace(".", "\\.")}(\\?v=([0-9a-f]+))?`, "g"))];
    if (!refs.length) failures.push(`no reference to assets/${file}`);
    for (const r of refs) if (r[2] !== want) failures.push(`assets/${file} stamped ${r[2] ?? "(none)"}, file is ${want}; run bun scripts/stamp-assets.ts`);
  }
  check("film URLs stamped with current content hash", failures);
}

// (2) exactly 3 book cover <img> and 3 book titles
{
  const failures = [];
  const covers = [...html.matchAll(/<img\b[^>]*class=["'][^"']*\bbook-cover\b[^"']*["'][^>]*>/gi)];
  const titles = [...html.matchAll(/<h3\b[^>]*class=["'][^"']*\bbook-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/gi)].map((m) => m[1].trim());
  if (covers.length !== 3) failures.push(`expected 3 book covers, found ${covers.length}`);
  const expected = ["The Anamnesis Engine", "The Myocardial Chorus", "The Ripening"];
  if (titles.length !== 3 || expected.some((t, i) => titles[i] !== t)) {
    failures.push(`expected titles ${JSON.stringify(expected)}, found ${JSON.stringify(titles)}`);
  }
  for (const c of covers) {
    if (attr(c[0], "width") !== "720" || attr(c[0], "height") !== "1043") failures.push(`cover missing width/height 720x1043: ${attr(c[0], "src")}`);
  }
  for (const range of ["Chapters 1–8", "Chapters 9–15", "Chapters 16–27"]) {
    if (!html.includes(range)) failures.push(`missing chapter range "${range}"`);
  }
  check("3 book covers and 3 exact book titles", failures);
}

// (3) hero video has src, poster, muted, loop, playsinline
{
  const failures = [];
  const video = html.match(/<video\b[^>]*\bid=["']hero-vid["'][^>]*>/i);
  if (!video) failures.push("no <video id=hero-vid>");
  else {
    const tag = video[0];
    if (!/^assets\/brag\.mp4\?v=[0-9a-f]{12}$/.test(attr(tag, "src") ?? "")) failures.push(`hero src is ${attr(tag, "src")}, expected assets/brag.mp4?v=<stamp>`);
    if (!/^assets\/brag\.jpg\?v=[0-9a-f]{12}$/.test(attr(tag, "poster") ?? "")) failures.push(`hero poster is ${attr(tag, "poster")}, expected assets/brag.jpg?v=<stamp>`);
    for (const a of ["muted", "loop", "playsinline"]) if (!hasBoolAttr(tag, a)) failures.push(`hero video missing ${a}`);
  }
  check("hero video src/poster/muted/loop/playsinline", failures);
}

// (4) every <form> action starts with the Buttondown embed endpoint
{
  const failures = [];
  const forms = [...html.matchAll(/<form\b[^>]*>/gi)].map((m) => m[0]);
  if (forms.length < 2) failures.push(`expected hero + outro forms, found ${forms.length}`);
  for (const f of forms) {
    const action = attr(f, "action") || "";
    if (!action.startsWith(BUTTONDOWN)) failures.push(`form action not Buttondown: ${action}`);
    if ((attr(f, "method") || "").toLowerCase() !== "post") failures.push(`form method is not post: ${action}`);
  }
  for (const input of html.matchAll(/<input\b[^>]*type=["']email["'][^>]*>/gi)) {
    const id = attr(input[0], "id");
    if (!hasBoolAttr(input[0], "required")) failures.push(`email input ${id} not required`);
    if (!id || !html.includes(`for="${id}"`)) failures.push(`email input ${id} has no <label for>`);
  }
  check(`form actions target Buttondown (${forms.length} forms)`, failures);
}

// (5) exactly one <h1>; every <img> has alt
{
  const failures = [];
  const h1s = html.match(/<h1\b/gi) || [];
  if (h1s.length !== 1) failures.push(`expected 1 <h1>, found ${h1s.length}`);
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  levels.forEach((lvl, i) => {
    if (i > 0 && lvl > levels[i - 1] + 1) failures.push(`heading level skip h${levels[i - 1]} -> h${lvl}`);
  });
  for (const img of html.matchAll(/<img\b[^>]*>/gi)) {
    const alt = attr(img[0], "alt");
    if (alt === null) failures.push(`<img> without alt: ${attr(img[0], "src")}`);
  }
  check("one <h1>, no heading skips, every <img> has alt", failures);
}

// (6) JSON-LD parses
{
  const failures = [];
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!blocks.length) failures.push("no JSON-LD block");
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1]);
      if (data["@type"] !== "BookSeries") failures.push(`JSON-LD @type is ${data["@type"]}`);
      const parts = Array.isArray(data.hasPart) ? data.hasPart.filter((p) => p["@type"] === "Book") : [];
      if (parts.length !== 3) failures.push(`JSON-LD has ${parts.length} Book parts`);
      if (data.author?.name !== "Witness Alchemist") failures.push("JSON-LD author is not Witness Alchemist");
    } catch (err) {
      failures.push(`JSON-LD does not parse: ${err.message}`);
    }
  }
  check("JSON-LD BookSeries parses with 3 Book parts", failures);
}

// (7) ANTI grep over site/ text files
{
  const failures = [];
  const anti = [
    ["Ava Moreno", /Ava Moreno/i],
    ["Rachel Kim", /Rachel Kim/i],
    ["Elara Vance", /Elara Vance/i],
    ["MIT", /\bMIT\b/],
    ["363,077", /363,077/],
    ["220,091", /220,091/],
    ["Khaloree (unmacroned)", /khaloree/i],
    ["STUDIO AURORA", /studio aurora/i],
    ["book2-myocardial--product-hero", /book2-myocardial--product-hero/],
    ["book2-myocardial--cover-v1", /book2-myocardial--cover-v1/],
    ["book2-myocardial--video", /book2-myocardial--video/],
    ["They succeed", /They succeed/i],
    ["The snap occurs", /The snap occurs/i],
    ["T-070", /T-070/],
    ["WAVE 4", /WAVE \d/],
  ];
  const textFiles = siteFiles.filter((f) => TEXT_EXT.has(path.extname(f).toLowerCase()));
  for (const file of textFiles) {
    const text = readFileSync(file, "utf8");
    const rel = path.relative(root, file);
    for (const [label, re] of anti) if (re.test(text)) failures.push(`${rel}: contains "${label}"`);
    // "Bio-Acoustic" is allowed only in Sona's role title "The Bio-Acoustic Engineer".
    const stray = text.replaceAll("The Bio-Acoustic Engineer", "");
    if (/Bio-Acoustic/.test(stray)) failures.push(`${rel}: "Bio-Acoustic" outside "The Bio-Acoustic Engineer"`);
  }
  check(`anti-string grep (${textFiles.length} text files)`, failures);
}

// (8) size budget: site/ excluding *.mp4 <= 1.5 MB; each cover <= 250 KB
{
  const failures = [];
  const total = siteFiles.filter((f) => !f.endsWith(".mp4")).reduce((sum, f) => sum + statSync(f).size, 0);
  if (total > SITE_BUDGET) failures.push(`site/ without video is ${(total / 1024).toFixed(0)} KB (> 1536 KB)`);
  for (const f of siteFiles.filter((f) => /cover-book\d/.test(path.basename(f)))) {
    const size = statSync(f).size;
    if (size > COVER_BUDGET) failures.push(`${path.basename(f)} is ${(size / 1024).toFixed(0)} KB (> 250 KB)`);
  }
  check(`size budget (site/ w/o mp4 = ${(total / 1024).toFixed(0)} KB)`, failures);
}

// (9) no <script src> except same-origin main.js
{
  const failures = [];
  for (const s of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    if (s[1] !== "main.js") failures.push(`unexpected script src: ${s[1]}`);
  }
  if (!/<script\b[^>]*src=["']main\.js["'][^>]*\bdefer\b/i.test(html)) failures.push("main.js is not loaded with defer");
  check("only same-origin main.js (deferred)", failures);
}

let failed = 0;
for (const { name, failures } of results) {
  const ok = failures.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  for (const f of failures) console.log(`      - ${f}`);
}
console.log(`\n${results.length - failed}/${results.length} checks pass.`);
process.exit(failed ? 1 : 0);
