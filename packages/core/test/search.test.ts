import { describe, expect, it } from 'vitest'

import { client } from './helpers'

import type { SearchHit } from '../src'

/** "sub:830108:83100", "district:8301", "province:83". */
const id = (h: SearchHit) =>
  h.level === 'subdistrict'
    ? `sub:${h.subdistrict.code}:${h.postal_code}`
    : h.level === 'district'
      ? `district:${h.district.code}`
      : `province:${h.province.code}`
const codes = (hits: SearchHit[]) => hits.map((h) => id(h).replace(/^sub:/, ''))

describe('search', () => {
  it('"บางรัก": exact subdistrict names first, then khet Bang Rak itself, then names that start with it', async () => {
    const { ta } = client()
    const r = await ta.search('บางรัก')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(r.hits.slice(0, 4).map(id)).toEqual(['sub:100404:10500', 'sub:100404:10501', 'sub:920109:92000', 'district:1004'])
    expect(r.hits.slice(4).every((h) => h.level === 'subdistrict' && h.subdistrict.name.th.startsWith('บางรัก'))).toBe(true)
  })

  it('"bang rak" as written finds Bang Rak first, not prefix matches that happen to contain "rak"', async () => {
    const { ta } = client()
    const r = await ta.search('bang rak')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(r.hits.slice(0, 4).map(id)).toEqual(['sub:100404:10500', 'sub:100404:10501', 'sub:920109:92000', 'district:1004'])
    expect(r.hits.some((h) => h.province.code === '11')).toBe(false)
  })

  it('a province name gives the province itself, and its districts, not a page of its subdistricts', async () => {
    const { ta } = client()
    const r = await ta.search('ภูเก็ต')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(id(r.hits[0]!)).toBe('province:83')
    expect(r.hits.map(id)).toContain('district:8301')
    for (const h of r.hits) {
      if (h.level === 'subdistrict') expect(h.subdistrict.name.th).toContain('ภูเก็ต')
      if (h.level === 'district') expect(h.district.name.th).toContain('ภูเก็ต')
    }
  })

  it('multi-word district and province names match as written: "Mueang Phuket", "Lop Buri"', async () => {
    const { ta } = client()
    const d = await ta.search('Mueang Phuket')
    if (d.status !== 'ok') throw new Error(d.status)
    expect(id(d.hits[0]!)).toBe('district:8301')
    const p = await ta.search('lop buri')
    if (p.status !== 'ok') throw new Error(p.status)
    expect(id(p.hits[0]!)).toBe('province:16')
  })

  it('a multi-word query scores by its weakest word', async () => {
    const { ta } = client()
    const r = await ta.search('karon phuket')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(r.hits.map(id)).toEqual(['sub:830108:83100'])
    expect(r.hits[0]!.match.quality).toBe('exact')
  })

  it('matches English, ignoring case and spaces', async () => {
    const { ta } = client()
    const r = await ta.search('KARON')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(codes(r.hits)).toEqual(['830108:83100'])
    const spaced = await ta.search('bangrak')
    if (spaced.status !== 'ok') throw new Error(spaced.status)
    expect(id(spaced.hits[0]!)).toBe('sub:100404:10500')
  })

  it('ignores the administrative prefixes', async () => {
    const { ta } = client()
    for (const q of ['ต.กะรน', 'ตำบล กะรน', 'ตำบลกะรน']) {
      const r = await ta.search(q)
      if (r.status !== 'ok') throw new Error(`${q}: ${r.status}`)
      expect(id(r.hits[0]!)).toBe('sub:830108:83100')
    }
    const khet = await ta.search('เขตบางรัก')
    if (khet.status !== 'ok') throw new Error(khet.status)
    expect(khet.hits.slice(0, 4).map(id)).toContain('district:1004')
  })

  it('still finds a name that itself starts like a prefix', async () => {
    const { ta } = client({
      mutate: (path, body) => {
        if (path === 'subdistricts.json') {
          const s = body.data.find((x: { code: string }) => x.code === '830108')
          s.name = { th: 'จ.ป.ร.', en: 'Choporo' }
        }
        return body
      },
    })
    const r = await ta.search('จ.ป.ร.')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(id(r.hits[0]!)).toBe('sub:830108:83100')
  })

  it('every word must match some level, so a second word narrows', async () => {
    const { ta } = client()
    const r = await ta.search('บางรัก ตรัง')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(codes(r.hits)).toEqual(['920109:92000'])
  })

  it('digits match postal codes by prefix, from 3 digits', async () => {
    const { ta } = client()
    const r = await ta.search('8310')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(r.hits.every((h) => h.level === 'subdistrict' && h.postal_code?.startsWith('8310'))).toBe(true)
    expect(r.hits.map(id)).toContain('sub:830108:83100')
    expect((await ta.search('83')).status).toBe('too_short')
  })

  it('starts at 2 letters', async () => {
    const { ta, calls } = client()
    expect((await ta.search('ก')).status).toBe('too_short')
    expect((await ta.search('  ')).status).toBe('too_short')
    expect(calls).toEqual([])
  })

  it('says when nothing matches', async () => {
    const { ta } = client()
    expect(await ta.search('zzzz')).toEqual({ status: 'ok', hits: [], more: false })
  })

  it('hides facility codes from results unless asked', async () => {
    const { ta } = client()
    const r = await ta.search('10001')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(r.hits).toEqual([])
    const all = await ta.search('10001', { includeFacility: true })
    if (all.status !== 'ok') throw new Error(all.status)
    expect(codes(all.hits)).toEqual(['110308:10001'])
  })

  it('marks the matched part of each name, for bold text', async () => {
    const { ta } = client()
    const r = await ta.search('รัก')
    if (r.status !== 'ok') throw new Error(r.status)
    const hit = r.hits.find((h) => h.level === 'subdistrict' && h.subdistrict.code === '100404')!
    expect(hit.match.ranges.subdistrict?.th).toEqual([3, 6])
    const en = await ta.search('karo')
    if (en.status !== 'ok') throw new Error(en.status)
    expect(en.hits[0]!.match.ranges.subdistrict?.en).toEqual([0, 4])
  })

  it('respects a smaller limit', async () => {
    const { ta } = client()
    const r = await ta.search('บาง', { limit: 3 })
    if (r.status !== 'ok') throw new Error(r.status)
    expect(r.hits).toHaveLength(3)
    expect(r.more).toBe(true)
  })
})
