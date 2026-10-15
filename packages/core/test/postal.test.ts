import { describe, expect, it } from 'vitest'

import { client } from './helpers'

describe('lookupPostalCode', () => {
  it('83100: one subdistrict, fills all three levels', async () => {
    const { ta } = client()
    const r = await ta.lookupPostalCode('83100')
    expect(r.status).toBe('found')
    if (r.status !== 'found') return
    expect(r.shape).toBe('single')
    expect(r.areas).toHaveLength(1)
    const a = r.areas[0]!
    expect([a.province.code, a.district.code, a.subdistrict.code]).toEqual(['83', '8301', '830108'])
    expect(a.subdistrict.name).toEqual({ th: 'กะรน', en: 'Karon' })
    expect(a.subdistrict.kind).toBe('tambon')
  })

  it('10200: twelve khwaeng in one khet, so province and district are known', async () => {
    const { ta } = client()
    const r = await ta.lookupPostalCode('10200')
    if (r.status !== 'found') throw new Error(r.status)
    expect(r.shape).toBe('one_district')
    expect(r.areas).toHaveLength(12)
    expect(new Set(r.areas.map((a) => a.district.code))).toEqual(new Set(['1001']))
    expect(r.areas.every((a) => a.subdistrict.kind === 'khwaeng' && a.district.kind === 'khet')).toBe(true)
  })

  it('13240: areas in two provinces need one combined choice', async () => {
    const { ta } = client()
    const r = await ta.lookupPostalCode('13240')
    if (r.status !== 'found') throw new Error(r.status)
    expect(r.shape).toBe('several_districts')
    expect(r.areas.map((a) => a.subdistrict.code)).toEqual(['141601', '141602', '141603', '141604', '141605', '160104'])
    expect(r.province_count).toBe(2)
    expect(r.district_count).toBe(2)
  })

  it('10001: a facility code is hidden by default, with its name from the dataset note', async () => {
    const { ta } = client()
    const r = await ta.lookupPostalCode('10001')
    expect(r.status).toBe('facility')
    if (r.status !== 'facility') return
    expect(r.facilities).toHaveLength(1)
    expect(r.facilities[0]!.note).toEqual({ th: 'ศูนย์ไปรษณีย์สุวรรณภูมิ', en: 'Suvarnabhumi Mail Center' })
    expect(r.facilities[0]!.area.subdistrict.code).toBe('110308')
  })

  it('10001 with includeFacility behaves like an ordinary code', async () => {
    const { ta } = client()
    const r = await ta.lookupPostalCode('10001', { includeFacility: true })
    if (r.status !== 'found') throw new Error(r.status)
    expect(r.shape).toBe('single')
    expect(r.areas[0]!.subdistrict.code).toBe('110308')
  })

  it('the client-wide includeFacilityCodes option applies when a call does not say', async () => {
    const { ta } = client({}, { includeFacilityCodes: true })
    expect((await ta.lookupPostalCode('10001')).status).toBe('found')
  })

  it('99999: not found, never an error', async () => {
    const { ta } = client()
    expect(await ta.lookupPostalCode('99999')).toEqual({ status: 'not_found', postal_code: '99999' })
  })

  it('fewer than 5 digits is incomplete, and fetches nothing', async () => {
    const { ta, calls } = client()
    expect(await ta.lookupPostalCode('831')).toEqual({ status: 'incomplete', postal_code: '831' })
    expect(calls).toEqual([])
  })

  it('normalizes the input first (Thai digits, spaces)', async () => {
    const { ta } = client()
    const r = await ta.lookupPostalCode('๘๓ ๑๐๐')
    expect(r.status).toBe('found')
    expect(r.postal_code).toBe('83100')
  })

  it('loads only the index and the provinces the code touches', async () => {
    const { ta, calls } = client()
    await ta.lookupPostalCode('13240')
    const paths = calls.map((c) => c.split('/2026-10-15/')[1]).sort()
    expect(paths).toEqual(['by-province/14.json', 'by-province/16.json', 'index/postal_codes.json'])
  })

  it('ignores abolished links and links with an unknown kind or status', async () => {
    const { ta } = client({
      mutate: (path, body) => {
        if (path !== 'index/postal_codes.json') return body
        for (const e of body.data) {
          if (e.postal_code === '13240') {
            e.subdistricts[5].status = 'abolished'
            e.subdistricts[4].kind = 'experimental'
            e.subdistricts[3].status = 'pending'
          }
        }
        return body
      },
    })
    const r = await ta.lookupPostalCode('13240')
    if (r.status !== 'found') throw new Error(r.status)
    expect(r.areas.map((a) => a.subdistrict.code)).toEqual(['141601', '141602', '141603'])
    expect(r.shape).toBe('one_district')
  })
})

describe('postalCodesOf', () => {
  it('one full code for an ordinary subdistrict', async () => {
    const { ta } = client()
    expect((await ta.postalCodesOf('830108')).map((p) => p.postal_code)).toEqual(['83100'])
  })

  it('several codes where a subdistrict is split: Ko Kaeo 83000 / 83200, Bang Rak 10500 / 10501', async () => {
    const { ta } = client()
    expect((await ta.postalCodesOf('830103')).map((p) => p.postal_code)).toEqual(['83000', '83200'])
    const bangRak = await ta.postalCodesOf('100404')
    expect(bangRak.map((p) => [p.postal_code, p.coverage])).toEqual([
      ['10500', 'partial'],
      ['10501', 'partial'],
    ])
  })

  it('an unknown coverage value reads as partial, never dropped and never assumed full', async () => {
    const { ta } = client({
      mutate: (path, body) => {
        if (path === 'by-province/83.json') {
          for (const l of body.data.postal_codes) if (l.subdistrict_code === '830108') l.coverage = 'village'
        }
        return body
      },
    })
    expect(await ta.postalCodesOf('830108')).toEqual([{ postal_code: '83100', kind: 'standard', coverage: 'partial', note: null }])
  })

  it('hides facility codes unless asked', async () => {
    const { ta } = client()
    const plain = await ta.postalCodesOf('110308')
    expect(plain.some((p) => p.postal_code === '10001')).toBe(false)
    const all = await ta.postalCodesOf('110308', { includeFacility: true })
    expect(all.find((p) => p.postal_code === '10001')?.kind).toBe('facility')
  })

  it('rejects a malformed code without building a URL from it', async () => {
    const { ta, calls } = client()
    await expect(ta.postalCodesOf('../../x')).rejects.toThrow(/subdistrict code/)
    expect(calls).toEqual([])
  })
})
