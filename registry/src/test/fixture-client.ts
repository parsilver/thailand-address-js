import { readFileSync } from "node:fs"
import { join } from "node:path"

import { createThaiAddress, SNAPSHOT } from "@farzai/thailand-address"

const dir = join(
  import.meta.dirname,
  "../../../packages/core/test/fixtures/snapshot"
)
const BASE = "https://data.test/thailand-address/v1"

/**
 * A core client over the trimmed real snapshot the core tests use. `gate`
 * holds every fetch until released, to test loading states; `fail` answers
 * 503 while it returns true.
 */
export function fixtureClient(
  opts: { fail?: () => boolean; gate?: Promise<void> } = {}
) {
  const calls: string[] = []
  const fetchFn = async (input: RequestInfo | URL) => {
    const url = String(input)
    calls.push(url)
    if (opts.gate) await opts.gate
    if (opts.fail?.()) return new Response("down", { status: 503 })
    const path = url.slice(`${BASE}/${SNAPSHOT}/`.length)
    try {
      return new Response(readFileSync(join(dir, path), "utf8"), {
        status: 200,
      })
    } catch {
      return new Response("not found", { status: 404 })
    }
  }
  return {
    client: createThaiAddress({
      baseUrl: BASE,
      fetch: fetchFn as typeof fetch,
    }),
    calls,
  }
}
