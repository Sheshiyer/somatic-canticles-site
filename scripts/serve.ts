// Local static preview: bun scripts/serve.ts [root=.] [port=4321]
import { join, normalize } from "node:path";

const root = normalize(process.argv[2] ?? ".");
const port = Number(process.argv[3] ?? 4321);

Bun.serve({
  port,
  async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = Bun.file(join(root, normalize(path)));
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return new Response(file);
  },
});
console.log(`serving ${root} at http://localhost:${port}`);
