// Serves the registry item at /r/address-form.json: copies the JSON that
// `pnpm --filter @thailand-address/registry registry:build` wrote (and CI
// keeps current) into public/r before Vite runs.
import { cpSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const from = join(here, "../../../registry/public/r")
const to = join(here, "../public/r")
mkdirSync(to, { recursive: true })
cpSync(from, to, { recursive: true })
console.log(`copied ${from} -> ${to}`)
