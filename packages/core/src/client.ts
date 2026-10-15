import { createLoader, assertSnapshotId, normalizeBaseUrl } from './loader'
import * as parse from './parse'
import { buildSearchIndex, isSearchable, runSearch, type SearchIndex } from './search'
import { DEFAULT_BASE_URL, SNAPSHOT } from './snapshot'
import { normalizePostalInput } from './text'
import type {
  AddressValue,
  Area,
  District,
  LocalizedNote,
  PostalLookup,
  PostalOption,
  Province,
  SearchResult,
  Subdistrict,
  ValidationError,
  ValidationResult,
} from './types'

export type ThaiAddressOptions = {
  /** Defaults to https://data.farzai.com/thailand-address/v1. */
  baseUrl?: string
  /** Defaults to the snapshot this package version pins. Never "latest". */
  snapshot?: string
  /** Defaults to the global fetch. */
  fetch?: typeof fetch
  /**
   * Treat facility postal codes (mail centres, such as 10001) like ordinary
   * codes. Off by default: they are not used for ordinary addresses.
   */
  includeFacilityCodes?: boolean
}

type FacilityOption = { includeFacility?: boolean }

type ProvinceBundle = {
  province: Province
  districts: District[]
  subdistricts: Map<string, Subdistrict>
  postal: Map<string, PostalOption[]>
}

const CODE = { province: /^\d{2}$/, district: /^\d{4}$/, subdistrict: /^\d{6}$/ }
const DIGITS = { province: 2, district: 4, subdistrict: 6 }

// Codes become part of a URL (by-province/<code>.json), so anything that is
// not exactly the right number of digits is refused before a fetch.
function assertCode(level: keyof typeof CODE, code: string): void {
  if (typeof code !== 'string' || !CODE[level].test(code)) {
    throw new TypeError(`${level} code must be ${DIGITS[level]} digits, got ${JSON.stringify(code)}`)
  }
}

const thCollator = new Intl.Collator('th')

const FIELD_ORDER: (keyof AddressValue)[] = ['province_code', 'district_code', 'subdistrict_code', 'postal_code']
const done = (errors: ValidationError[]): ValidationResult => ({
  valid: errors.length === 0,
  errors: errors.sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field)),
})

export type ThaiAddress = ReturnType<typeof createThaiAddress>

/**
 * A lazy client for one pinned snapshot. Files are fetched on first use and
 * kept for the client's lifetime: the provinces list, the postal code index
 * and one by-province file per province touched. Search loads the full
 * district and subdistrict lists the first time it runs.
 */
export function createThaiAddress(options: ThaiAddressOptions = {}) {
  const snapshot = options.snapshot ?? SNAPSHOT
  assertSnapshotId(snapshot)
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
  const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis)
  const defaultFacility = options.includeFacilityCodes ?? false
  const loader = createLoader(baseUrl, snapshot, fetchFn)
  const facility = (o?: FacilityOption) => o?.includeFacility ?? defaultFacility

  let provincesP: Promise<Province[]> | undefined
  const bundles = new Map<string, Promise<ProvinceBundle>>()
  let searchP: Promise<SearchIndex> | undefined

  function provinces(): Promise<Province[]> {
    provincesP ??= loader
      .load('provinces.json')
      .then((d) => parse.rows(d).filter(parse.isActive).map(parse.province))
    provincesP.catch(() => (provincesP = undefined))
    return provincesP
  }

  function bundle(code: string): Promise<ProvinceBundle> {
    assertCode('province', code)
    let p = bundles.get(code)
    if (!p) {
      p = loader.load(`by-province/${code}.json`).then((d) => {
        const data = (d ?? {}) as Record<string, unknown>
        const subs = new Map<string, Subdistrict>()
        for (const r of parse.rows(data['subdistricts'])) if (parse.isActive(r)) subs.set(String(r['code']), parse.subdistrict(r))
        const postal = new Map<string, PostalOption[]>()
        for (const r of parse.rows(data['postal_codes'])) {
          const o = parse.postalOption(r)
          if (!o) continue
          const { subdistrict_code, ...opt } = o
          const list = postal.get(subdistrict_code) ?? []
          list.push(opt)
          postal.set(subdistrict_code, list)
        }
        for (const list of postal.values()) list.sort((a, b) => a.postal_code.localeCompare(b.postal_code))
        return {
          province: parse.province((data['province'] ?? {}) as Record<string, unknown>),
          districts: parse.rows(data['districts']).filter(parse.isActive).map(parse.district),
          subdistricts: subs,
          postal,
        }
      })
      bundles.set(code, p)
      p.catch(() => bundles.delete(code))
    }
    return p
  }

  async function districts(provinceCode: string): Promise<District[]> {
    return (await bundle(provinceCode)).districts
  }

  async function subdistricts(districtCode: string): Promise<Subdistrict[]> {
    assertCode('district', districtCode)
    const b = await bundle(districtCode.slice(0, 2))
    return [...b.subdistricts.values()].filter((s) => s.district_code === districtCode)
  }

  async function resolve(subdistrictCode: string): Promise<Area | null> {
    assertCode('subdistrict', subdistrictCode)
    const b = await bundle(subdistrictCode.slice(0, 2))
    const subdistrict = b.subdistricts.get(subdistrictCode)
    const district = subdistrict && b.districts.find((d) => d.code === subdistrict.district_code)
    return subdistrict && district ? { province: b.province, district, subdistrict } : null
  }

  async function postalCodesOf(subdistrictCode: string, o?: FacilityOption): Promise<PostalOption[]> {
    assertCode('subdistrict', subdistrictCode)
    const b = await bundle(subdistrictCode.slice(0, 2))
    const list = b.postal.get(subdistrictCode) ?? []
    return facility(o) ? list : list.filter((p) => p.kind !== 'facility')
  }

  type IndexLink = { code: string; kind: 'standard' | 'facility' }
  let indexP: Promise<Map<string, IndexLink[]>> | undefined
  function postalIndex(): Promise<Map<string, IndexLink[]>> {
    indexP ??= loader.load('index/postal_codes.json').then((d) => {
      const m = new Map<string, IndexLink[]>()
      for (const e of parse.rows(d)) {
        const links: IndexLink[] = []
        for (const s of parse.rows(e['subdistricts'])) {
          const o = parse.postalOption({ ...s, postal_code: e['postal_code'] })
          if (o && CODE.subdistrict.test(o.subdistrict_code)) links.push({ code: o.subdistrict_code, kind: o.kind })
        }
        if (links.length) m.set(String(e['postal_code']), links)
      }
      return m
    })
    indexP.catch(() => (indexP = undefined))
    return indexP
  }

  async function areasOf(codes: string[]): Promise<Area[]> {
    const out = await Promise.all(codes.map((c) => resolve(c)))
    return out.filter((a): a is Area => a !== null)
  }

  async function lookupPostalCode(input: string, o?: FacilityOption): Promise<PostalLookup> {
    const postal_code = normalizePostalInput(input)
    if (postal_code.length < 5) return { status: 'incomplete', postal_code }
    const links = (await postalIndex()).get(postal_code) ?? []
    const standard = links.filter((l) => l.kind === 'standard' || facility(o))
    if (standard.length === 0) {
      const facilities = links.filter((l) => l.kind === 'facility')
      if (facilities.length === 0) return { status: 'not_found', postal_code }
      const found = await Promise.all(
        facilities.map(async (l) => {
          const area = await resolve(l.code)
          if (!area) return null
          const opts = await postalCodesOf(l.code, { includeFacility: true })
          const note: LocalizedNote | null = opts.find((x) => x.postal_code === postal_code)?.note ?? null
          return { area, note }
        }),
      )
      const list = found.filter((x): x is NonNullable<typeof x> => x !== null)
      return list.length ? { status: 'facility', postal_code, facilities: list } : { status: 'not_found', postal_code }
    }
    const areas = await areasOf(standard.map((l) => l.code))
    if (areas.length === 0) return { status: 'not_found', postal_code }
    const districtCount = new Set(areas.map((a) => a.district.code)).size
    const provinceCount = new Set(areas.map((a) => a.province.code)).size
    const shape = areas.length === 1 ? 'single' : districtCount === 1 ? 'one_district' : 'several_districts'
    return { status: 'found', postal_code, shape, areas, provinceCount, districtCount }
  }

  function searchIndex(): Promise<SearchIndex> {
    searchP ??= Promise.all([
      provinces(),
      loader.load('districts.json'),
      loader.load('subdistricts.json'),
      postalIndex(),
    ]).then(([ps, ds, ss, idx]) => {
      const pm = new Map(ps.map((p) => [p.code, p]))
      const dm = new Map(parse.rows(ds).filter(parse.isActive).map((r) => [String(r['code']), parse.district(r)]))
      const areas: Area[] = []
      for (const r of parse.rows(ss)) {
        if (!parse.isActive(r)) continue
        const subdistrict = parse.subdistrict(r)
        const district = dm.get(subdistrict.district_code)
        const province = pm.get(subdistrict.province_code)
        if (district && province) areas.push({ province, district, subdistrict })
      }
      const postal = new Map<string, { postal_code: string; facility: boolean }[]>()
      for (const [pc, links] of idx) {
        for (const l of links) {
          const list = postal.get(l.code) ?? []
          list.push({ postal_code: pc, facility: l.kind === 'facility' })
          postal.set(l.code, list)
        }
      }
      return buildSearchIndex(areas, postal)
    })
    searchP.catch(() => (searchP = undefined))
    return searchP
  }

  async function search(query: string, o?: FacilityOption & { limit?: number }): Promise<SearchResult> {
    if (!isSearchable(query)) return { status: 'too_short' }
    const limit = Math.max(1, Math.min(o?.limit ?? 8, 50))
    return runSearch(await searchIndex(), query, { limit, includeFacility: facility(o), collator: thCollator })
  }

  async function validate(value: AddressValue): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const { province_code: p, district_code: d, subdistrict_code: s, postal_code: pc } = value
    const req = (field: keyof AddressValue, v: string | null) => {
      if (!v) errors.push({ field, code: 'required' })
      return Boolean(v)
    }
    const hasP = req('province_code', p)
    const hasD = req('district_code', d)
    const hasS = req('subdistrict_code', s)
    const hasPc = req('postal_code', pc)
    if (hasP && !(CODE.province.test(p!) && (await provinces()).some((x) => x.code === p))) {
      errors.push({ field: 'province_code', code: 'unknown' })
      return done(errors)
    }
    if (hasP && hasD) {
      if (!CODE.district.test(d!)) errors.push({ field: 'district_code', code: 'unknown' })
      else if (d!.slice(0, 2) !== p) errors.push({ field: 'district_code', code: 'mismatch' })
      else if (!(await districts(p!)).some((x) => x.code === d)) errors.push({ field: 'district_code', code: 'unknown' })
    }
    if (hasD && hasS && errors.length === 0) {
      const area = CODE.subdistrict.test(s!) ? await resolve(s!) : null
      if (!area) errors.push({ field: 'subdistrict_code', code: 'unknown' })
      else if (area.district.code !== d) errors.push({ field: 'subdistrict_code', code: 'mismatch' })
    }
    if (hasS && hasPc && errors.length === 0) {
      const serving = (await postalCodesOf(s!, { includeFacility: true })).map((x) => x.postal_code)
      if (!serving.includes(pc!)) {
        const expected = (await postalCodesOf(s!)).map((x) => x.postal_code)
        errors.push({ field: 'postal_code', code: 'mismatch', expected })
      }
    }
    return done(errors)
  }

  return {
    snapshot,
    baseUrl,
    provinces,
    districts,
    subdistricts,
    resolve,
    postalCodesOf,
    lookupPostalCode,
    search,
    validate,
  }
}
