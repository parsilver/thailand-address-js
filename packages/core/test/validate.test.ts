import { describe, expect, it } from 'vitest'

import { client } from './helpers'

const karon = { province_code: '83', district_code: '8301', subdistrict_code: '830108', postal_code: '83100' }

describe('validate', () => {
  it('accepts a consistent address', async () => {
    const { ta } = client()
    expect(await ta.validate(karon)).toEqual({ valid: true, errors: [] })
  })

  it('says which field is missing', async () => {
    const { ta } = client()
    const r = await ta.validate({ province_code: '83', district_code: null, subdistrict_code: null, postal_code: null })
    expect(r.valid).toBe(false)
    expect(r.errors.map((e) => [e.field, e.code])).toEqual([
      ['district_code', 'required'],
      ['subdistrict_code', 'required'],
      ['postal_code', 'required'],
    ])
  })

  it('a district outside the province is a mismatch', async () => {
    const { ta } = client()
    const r = await ta.validate({ ...karon, district_code: '1001' })
    expect(r.errors[0]).toMatchObject({ field: 'district_code', code: 'mismatch' })
  })

  it('a postal code that does not serve the subdistrict is a mismatch, with the codes that do', async () => {
    const { ta } = client()
    const r = await ta.validate({ ...karon, postal_code: '99999' })
    expect(r.errors).toEqual([{ field: 'postal_code', code: 'mismatch', expected: ['83100'] }])
  })

  it('an unknown code is unknown', async () => {
    const { ta } = client()
    const r = await ta.validate({ ...karon, province_code: '99', district_code: null, subdistrict_code: null })
    expect(r.errors[0]).toMatchObject({ field: 'province_code', code: 'unknown' })
  })

  it('a facility code that is linked to the subdistrict is valid', async () => {
    const { ta } = client()
    const r = await ta.validate({ province_code: '11', district_code: '1103', subdistrict_code: '110308', postal_code: '10001' })
    expect(r.valid).toBe(true)
  })
})
