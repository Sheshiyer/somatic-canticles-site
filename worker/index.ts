// Byte-range server for video. Workers static assets answer `Range:` requests with a full
// 200, and Safari / iOS will not play or seek a <video> without 206 Partial Content.
// wrangler.jsonc routes only /assets/*.mp4 through here (run_worker_first); every other
// request is served by the asset layer directly.

interface Env {
  ASSETS: { fetch(req: Request | string, init?: RequestInit): Promise<Response> };
}

const BASE_HEADERS = {
  "Content-Type": "video/mp4",
  "Accept-Ranges": "bytes",
  // URLs are content-stamped (?v=<sha256>), so a year of immutable caching is safe
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
};

/** Parse a single-range `bytes=` header against a size; null = serve the whole file. */
export function parseRange(header: string | null, size: number): { start: number; end: number } | "unsatisfiable" | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null; // multi-range or malformed: fall back to a full 200
  const [, a, b] = m;
  if (a === "" && b === "") return null;
  let start: number, end: number;
  if (a === "") {
    const n = Number(b); // suffix range: last n bytes
    if (n === 0) return "unsatisfiable";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    // ask the asset layer for the whole file (no Range), then slice it ourselves
    const asset = await env.ASSETS.fetch(new Request(req.url, { method: "GET" }));
    if (!asset.ok) return asset;
    const body = await asset.arrayBuffer();
    const size = body.byteLength;
    const etag = asset.headers.get("ETag");
    const headers: Record<string, string> = { ...BASE_HEADERS, ...(etag ? { ETag: etag } : {}) };

    if (etag && req.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });

    // If-Range with a stale validator means "send everything"
    const ifRange = req.headers.get("If-Range");
    const range = ifRange && ifRange !== etag ? null : parseRange(req.headers.get("Range"), size);

    if (range === "unsatisfiable") {
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    }
    if (range === null) {
      return new Response(req.method === "HEAD" ? null : body, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
    }
    const { start, end } = range;
    return new Response(req.method === "HEAD" ? null : body.slice(start, end + 1), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  },
};
