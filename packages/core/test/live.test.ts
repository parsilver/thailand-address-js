// The issue #1 cases against the real snapshot on data.farzai.com. Skipped
// unless THAILAND_ADDRESS_LIVE=1 (`pnpm test:live`), so the default run needs
// no network.
import { describe, expect, it } from 'vitest'

import { createThaiAddress } from '../src'

describe.runIf(process.env['THAILAND_ADDRESS_LIVE'] === '1')('live snapshot', () => {
  const ta = createThaiAddress()

  it('83100 / 10200 / 13240 / 10001 / 99999', async () => {
    const r83 = await ta.lookupPostalCode('83100')
    expect(r83.status === 'found' && r83.shape).toBe('single')
    const r10 = await ta.lookupPostalCode('10200')
    expect(r10.status === 'found' && [r10.shape, r10.areas.length]).toEqual(['one_district', 12])
    const r13 = await ta.lookupPostalCode('13240')
    expect(r13.status === 'found' && [r13.shape, r13.provinceCount]).toEqual(['several_districts', 2])
    const f = await ta.lookupPostalCode('10001')
    expect(f.status === 'facility' && f.facilities[0]?.note?.en).toBe('Suvarnabhumi Mail Center')
    expect((await ta.lookupPostalCode('99999')).status).toBe('not_found')
  })

  it('area cascade and search', async () => {
    expect(await ta.provinces()).toHaveLength(77)
    expect((await ta.postalCodesOf('830103')).map((p) => p.postal_code)).toEqual(['83000', '83200'])
    const s = await ta.search('karon')
    expect(s.status === 'ok' && s.hits[0]?.subdistrict.code).toBe('830108')
  })
})
