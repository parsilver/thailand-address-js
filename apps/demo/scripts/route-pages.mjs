// After `vite build`: writes dist/<route>/index.html for every page in the
// sidebar, and dist/404.html, so Cloudflare serves known routes with 200
// and anything else (a mistyped /r/*.json included) with a real 404. That
// keeps the site assets-only, without an SPA fallback that answers every
// unknown path with index.html.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, "../dist")
const nav = readFileSync(join(here, "../src/site/nav.ts"), "utf8")
const routes = [...nav.matchAll(/href: "(\/[^"]*)"/g)]
  .map((m) => m[1])
  .filter((r) => r !== "/" && !r.endsWith(".txt"))
if (routes.length < 10) throw new Error(`expected the sidebar routes in nav.ts, found ${routes.length}`)

const index = join(dist, "index.html")
for (const route of routes) {
  mkdirSync(join(dist, route), { recursive: true })
  copyFileSync(index, join(dist, route, "index.html"))
}
copyFileSync(index, join(dist, "404.html"))
console.log(`wrote ${routes.length} route pages and 404.html`)
