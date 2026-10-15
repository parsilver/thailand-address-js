import { describe, expect, it } from 'vitest'

import { DatasetError, SNAPSHOT } from '../src'
import { BASE, client } from './helpers'

describe('loading', () => {
  it('pins the snapshot in every URL and never asks for latest.json', async () => {
    const { ta, calls } = client()
    await ta.lookupPostalCode('83100')
    await ta.provinces()
    expect(calls.every((c) => c.startsWith(`${BASE}/${SNAPSHOT}/`))).toBe(true)
    expect(calls.some((c) => c.includes('latest'))).toBe(false)
  })

  it('fetches each file once, even for concurrent callers', async () => {
    const { ta, calls } = client()
    await Promise.all([ta.lookupPostalCode('83100'), ta.lookupPostalCode('83100'), ta.districts('83')])
    expect(calls.filter((c) => c.endsWith('by-province/83.json'))).toHaveLength(1)
    expect(calls.filter((c) => c.endsWith('index/postal_codes.json'))).toHaveLength(1)
  })

  it('a failed fetch is a DatasetError, and the next call retries', async () => {
    let fail = true
    const { ta, calls } = client({ status: (p) => (p === 'index/postal_codes.json' && fail ? 503 : undefined) })
    const err = await ta.lookupPostalCode('83100').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(DatasetError)
    expect((err as DatasetError).code).toBe('http')
    fail = false
    expect((await ta.lookupPostalCode('83100')).status).toBe('found')
    expect(calls.filter((c) => c.endsWith('index/postal_codes.json'))).toHaveLength(2)
  })

  it('refuses a file from another snapshot', async () => {
    const { ta } = client({ mutate: (_p, body) => ({ ...body, snapshot: '2026-01-01' }) })
    await expect(ta.provinces()).rejects.toMatchObject({ code: 'snapshot_mismatch' })
  })

  it('accepts a newer minor schema version and refuses a new major', async () => {
    const minor = client({ mutate: (_p, body) => ({ ...body, schema_version: '1.7.0', extra: true }) })
    expect((await minor.ta.provinces()).length).toBeGreaterThan(0)
    const major = client({ mutate: (_p, body) => ({ ...body, schema_version: '2.0.0' }) })
    await expect(major.ta.provinces()).rejects.toMatchObject({ code: 'schema_version' })
  })

  it('refuses a body that is not an envelope', async () => {
    const { ta } = client({ mutate: () => ['not', 'an', 'envelope'] })
    await expect(ta.provinces()).rejects.toMatchObject({ code: 'invalid_file' })
  })

  it('rejects a malformed province code before fetching', async () => {
    const { ta, calls } = client()
    await expect(ta.districts('8')).rejects.toThrow(/province code/)
    await expect(ta.districts('83/../x')).rejects.toThrow(/province code/)
    expect(calls).toEqual([])
  })

  it('refuses a base URL that is not http(s)', () => {
    expect(() => client({}, { baseUrl: 'javascript:alert(1)' })).toThrow(/baseUrl/)
  })

  it('refuses a snapshot id that is not a snapshot id', () => {
    expect(() => client({}, { snapshot: 'latest' })).toThrow(/snapshot/)
    expect(() => client({}, { snapshot: '../2026-10-15' })).toThrow(/snapshot/)
    expect(() => client({}, { snapshot: '2026-10-15.0' })).toThrow(/snapshot/)
    expect(() => client({}, { snapshot: '2026-10-15.01' })).toThrow(/snapshot/)
    expect(() => client({ status: () => 404 }, { snapshot: '2026-10-15.1' })).not.toThrow()
  })
})

describe('preload', () => {
  it('fetches what a mode needs ahead of the first lookup, once', async () => {
    const { ta, calls } = client()
    await ta.preload('postal')
    await ta.preload('postal')
    expect(calls.map((c) => c.split(`/${SNAPSHOT}/`)[1])).toEqual(['provinces.json', 'index/postal_codes.json'])
    await ta.preload('search')
    expect(calls.map((c) => c.split(`/${SNAPSHOT}/`)[1]).sort()).toEqual([
      'districts.json',
      'index/postal_codes.json',
      'provinces.json',
      'subdistricts.json',
    ])
  })
})

describe('hostile rows', () => {
  it('a null row in a file is skipped, not a TypeError', async () => {
    const { ta } = client({
      mutate: (path, body) => {
        if (path === 'index/postal_codes.json') body.data.unshift(null, 7, 'x')
        if (path === 'by-province/83.json') {
          body.data.subdistricts.unshift(null)
          body.data.postal_codes.unshift(null)
        }
        return body
      },
    })
    expect((await ta.lookupPostalCode('83100')).status).toBe('found')
  })
})
