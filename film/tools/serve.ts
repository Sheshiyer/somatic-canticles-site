// Local server: the reel page, its bundle, fonts, site assets (read in place), the
// synthesized score, and the frame sink used by tools/render.ts.
//   bun tools/serve.ts           dev scrubber at http://127.0.0.1:4790/
import { existsSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

const FILM = resolve(import.meta.dir, "..");
const ROOTS: Record<string, string> = {
  "/dist/": join(FILM, "dist"),
  "/assets/": join(FILM, "..", "site", "assets"),
};
const FONT_DIRS = ["cinzel", "eb-garamond", "fira-code"].map((p) => join(FILM, "node_modules", "@fontsource", p, "files"));

const safeJoin = (root: string, rel: string) => {
  const p = normalize(join(root, decodeURIComponent(rel)));
  return p.startsWith(root) ? p : null;
};

export interface Sink {
  onFrame?: (f: number, data: Uint8Array) => Promise<void> | void;
  onDone?: () => void;
  onError?: (m: string) => void;
  onLog?: (m: string) => void;
  frames?: number[];
}

export function startServer(h: Sink = {}, port = 0) {
  return Bun.serve({
    port,
    hostname: "127.0.0.1",
    maxRequestBodySize: 64 * 1024 * 1024,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      if (req.method === "POST") {
        if (path === "/frame") {
          await h.onFrame?.(Number(url.searchParams.get("f")), new Uint8Array(await req.arrayBuffer()));
          return new Response("ok");
        }
        const body = await req.text();
        if (path === "/done") h.onDone?.();
        else if (path === "/error") h.onError?.(body);
        else if (path === "/log") h.onLog?.(body);
        return new Response("ok");
      }
      if (path === "/" || path === "/index.html") return new Response(Bun.file(join(FILM, "index.html")));
      if (path === "/frames") return Response.json(h.frames ?? []);
      if (path === "/audio.wav") {
        const p = join(FILM, "out", "audio.wav");
        return existsSync(p) ? new Response(Bun.file(p)) : new Response("no audio yet", { status: 404 });
      }
      if (path.startsWith("/fonts/")) {
        const name = path.slice(7);
        for (const d of FONT_DIRS) {
          const p = safeJoin(d, name);
          if (p && existsSync(p)) return new Response(Bun.file(p), { headers: { "Content-Type": "font/woff2" } });
        }
        return new Response("font missing", { status: 404 });
      }
      for (const [prefix, root] of Object.entries(ROOTS)) {
        if (path.startsWith(prefix)) {
          const p = safeJoin(root, path.slice(prefix.length));
          if (p && existsSync(p)) return new Response(Bun.file(p));
          return new Response("not found", { status: 404 });
        }
      }
      return new Response("not found", { status: 404 });
    },
  });
}

if (import.meta.main) {
  const s = startServer({ onLog: (m) => console.log("[page]", m), onError: (m) => console.error("[page error]", m) }, Number(process.env.PORT ?? 4790));
  console.log(`film dev server: http://127.0.0.1:${s.port}/`);
}
