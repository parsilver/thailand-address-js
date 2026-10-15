import { describe, expect, it } from 'vitest'

import { client } from './helpers'

describe('area cascade', () => {
  it('lists active provinces only, from provinces.json', async () => {
    const { ta } = client({
      mutate: (path, body) => {
        if (path === 'provinces.json') body.data[0].status = 'abolished'
        return body
      },
    })
    const provinces = await ta.provinces()
    expect(provinces.map((p) => p.code)).toEqual(['11', '12', '14', '16', '83', '92'])
  })

  it('lists active districts of a province, then subdistricts of a district', async () => {
    const { ta } = client()
    const districts = await ta.districts('83')
    expect(districts.map((d) => d.code)).toEqual(['8301', '8302', '8303'])
    const subs = await ta.subdistricts('8301')
    expect(subs.map((s) => s.name.th)).toContain('กะรน')
    expect(subs.every((s) => s.district_code === '8301')).toBe(true)
  })

  it('leaves out abolished areas', async () => {
    const { ta } = client()
    const districts = await ta.districts('10')
    expect(districts).toHaveLength(50)
  })

  it('resolves a subdistrict code to its three levels', async () => {
    const { ta } = client()
    const a = await ta.resolve('100101')
    expect(a?.province.kind).toBe('special_administrative_area')
    expect(a?.district.code).toBe('1001')
    expect(a?.subdistrict.name.th).toBe('พระบรมมหาราชวัง')
    expect(await ta.resolve('839999')).toBeNull()
  })

  it('an unknown kind value becomes null instead of a wrong label', async () => {
    const { ta } = client({
      mutate: (path, body) => {
        if (path === 'by-province/83.json') body.data.districts[0].kind = 'nakhon'
        return body
      },
    })
    const d = await ta.districts('83')
    expect(d[0]!.kind).toBeNull()
  })

  it('ignores unknown fields and name languages', async () => {
    const { ta } = client({
      mutate: (path, body) => {
        if (path === 'by-province/83.json') {
          body.data.subdistricts[0].population = 1
          body.data.subdistricts[0].name.zh = '某'
        }
        return body
      },
    })
    const s = (await ta.subdistricts('8301'))[0]!
    expect(Object.keys(s).sort()).toEqual(['code', 'district_code', 'kind', 'name', 'province_code'])
    expect(Object.keys(s.name).sort()).toEqual(['en', 'th'])
  })
})

describe('formatAddress', () => {
  it('uses the Bangkok, province and English forms', async () => {
    const { ta } = client()
    const { formatAddress } = await import('../src')
    const bkk = (await ta.resolve('100401'))!
    expect(formatAddress(bkk, 'th', '10500')).toBe('แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500')
    const pkt = (await ta.resolve('830108'))!
    expect(formatAddress(pkt, 'th', '83100')).toBe('ตำบลกะรน อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83100')
    expect(formatAddress(pkt, 'en', '83100')).toBe('Karon, Mueang Phuket, Phuket 83100')
    expect(formatAddress(pkt, 'en')).toBe('Karon, Mueang Phuket, Phuket')
  })
})
