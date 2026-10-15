import { DatasetError } from './errors'
import { SCHEMA_MAJOR } from './snapshot'

const SNAPSHOT_ID = /^\d{4}-\d{2}-\d{2}(\.[1-9]\d*)?$/

export type Loader = {
  /** The envelope's `data`, once per path; a failure is not cached. */
  load(path: string): Promise<unknown>
}

export function assertSnapshotId(snapshot: string): void {
  if (!SNAPSHOT_ID.test(snapshot)) {
    throw new TypeError(`snapshot must be a snapshot id such as 2026-10-15, got ${JSON.stringify(snapshot)}`)
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    throw new TypeError(`baseUrl must be an absolute http(s) URL, got ${JSON.stringify(baseUrl)}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TypeError(`baseUrl must be an absolute http(s) URL, got ${JSON.stringify(baseUrl)}`)
  }
  return url.href.replace(/\/+$/, '')
}

export function createLoader(baseUrl: string, snapshot: string, fetchFn: typeof fetch): Loader {
  const cache = new Map<string, Promise<unknown>>()

  async function get(path: string): Promise<unknown> {
    const url = `${baseUrl}/${snapshot}/${path}`
    let res: Response
    try {
      res = await fetchFn(url, { headers: { accept: 'application/json' } })
    } catch (e) {
      throw new DatasetError('http', `could not fetch ${url}: ${(e as Error).message ?? e}`, url)
    }
    if (!res.ok) throw new DatasetError('http', `${url} answered ${res.status}`, url, res.status)
    let body: unknown
    try {
      body = await res.json()
    } catch {
      throw new DatasetError('invalid_file', `${url} is not JSON`, url)
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new DatasetError('invalid_file', `${url} is not a dataset envelope`, url)
    }
    const env = body as { schema_version?: unknown; snapshot?: unknown; data?: unknown }
    if (typeof env.schema_version !== 'string' || typeof env.snapshot !== 'string' || env.data == null) {
      throw new DatasetError('invalid_file', `${url} is not a dataset envelope`, url)
    }
    if (env.snapshot !== snapshot) {
      throw new DatasetError('snapshot_mismatch', `${url} is snapshot ${env.snapshot}, expected ${snapshot}`, url)
    }
    if (Number(env.schema_version.split('.')[0]) !== SCHEMA_MAJOR) {
      throw new DatasetError(
        'schema_version',
        `${url} has schema ${env.schema_version}; this package reads ${SCHEMA_MAJOR}.x`,
        url,
      )
    }
    return env.data
  }

  return {
    load(path) {
      let p = cache.get(path)
      if (!p) {
        p = get(path)
        cache.set(path, p)
        p.catch(() => cache.delete(path))
      }
      return p
    },
  }
}
