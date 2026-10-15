import { describe, expect, it } from 'vitest'

import { client } from './helpers'

const codes = (hits: { subdistrict: { code: string }; postal_code: string | null }[]) =>
  hits.map((h) => `${h.subdistrict.code}:${h.postal_code}`)

describe('search', () => {
  it('"บางรัก": exact subdistrict names first, then the khwaeng of khet Bang Rak, before partial names', async () => {
    const { ta } = client()
    const r = await ta.search('บางรัก')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(codes(r.hits).slice(0, 3)).toEqual(['100404:10500', '100404:10501', '920109:92000'])
    const next = r.hits.slice(3, 7)
    expect(next.every((h) => h.district.code === '1004' && h.match.level === 'district')).toBe(true)
    expect(r.hits).toHaveLength(8)
    expect(r.more).toBe(true)
  })

  it('matches English, ignoring case and spaces', async () => {
    const { ta } = client()
    const r = await ta.search('KARON')
    if (r.status !== 'ok') throw new Error(r.status)
    expect(codes(r.hits)).toEqual(['830108:83100'])
    const spaced = await ta.search('bangrak')
    if (spaced.status !== 'ok') throw new Error(spaced.status)
    expect(spaced.hits[0]!.subdistrict.code).toBe('100404')
  })

  it('ignores the administrative prefixes', async () => {
    const { ta } = client()
    for (const q of ['ต.กะรน', 'ตำบล กะรน', 'ตำบลกะรน']) {
      const r = await ta.search(q)
      if (r.status !== 'ok') throw new Error(`${q}: ${r.status}`)
      expect(r.hits[0]!.subdistrict.code).toBe('830108')
    }
    const khet = await ta.search('เขตบางรัก')
    if (khet.status !== 'ok') throw new Error(khet.status)
    expect(khet.hits[0]!.district.code).toBe('1004')
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
    expect(r.hits[0]!.subdistrict.code).toBe('830108')
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
    expect(r.hits.every((h) => h.postal_code?.startsWith('8310'))).toBe(true)
    expect(r.hits.map((h) => h.subdistrict.code)).toContain('830108')
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
    const hit = r.hits.find((h) => h.subdistrict.code === '100404')!
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
