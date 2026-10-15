import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { createThaiAddress, SNAPSHOT, type ThaiAddressOptions } from '../src'

const dir = join(import.meta.dirname, 'fixtures/snapshot')
export const BASE = 'https://data.test/thailand-address/v1'

type Hooks = {
  /** Change a file's parsed JSON before it is served, keyed by path. */
  mutate?: (path: string, body: any) => any
  /** Answer this path with a status instead of the file. */
  status?: (path: string) => number | undefined
}

/** A fetch that serves the trimmed real snapshot in test/fixtures, and records calls. */
export function fixtureFetch(hooks: Hooks = {}) {
  const calls: string[] = []
  const fn = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input)
    calls.push(url)
    const prefix = `${BASE}/${SNAPSHOT}/`
    if (!url.startsWith(prefix)) return new Response('not found', { status: 404 })
    const path = url.slice(prefix.length)
    const forced = hooks.status?.(path)
    if (forced) return new Response('forced', { status: forced })
    let body: unknown
    try {
      body = JSON.parse(readFileSync(join(dir, path), 'utf8'))
    } catch {
      return new Response('not found', { status: 404 })
    }
    if (hooks.mutate) body = hooks.mutate(path, body)
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  return { fetch: fn as typeof fetch, calls }
}

export function client(hooks: Hooks = {}, opts: Partial<ThaiAddressOptions> = {}) {
  const f = fixtureFetch(hooks)
  return { ta: createThaiAddress({ baseUrl: BASE, fetch: f.fetch, ...opts }), calls: f.calls }
}
