// Wire rows to the package's own types. The dataset contract says to ignore
// unknown fields, name languages and enum values, so each row is copied field
// by field: nothing unknown leaks through, an unknown kind becomes null, and a
// row with an unknown status or link kind is treated as not active.
import type {
  District,
  DistrictKind,
  LocalizedName,
  LocalizedNote,
  PostalOption,
  Province,
  ProvinceKind,
  Subdistrict,
  SubdistrictKind,
} from './types'

type Row = Record<string, unknown>

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  allowed.includes(v as T) ? (v as T) : null

export const isActive = (row: Row): boolean => row['status'] === 'active'

function name(v: unknown): LocalizedName {
  const n = (v ?? {}) as Row
  return { th: str(n['th']) ?? '', en: str(n['en']) }
}

function note(v: unknown): LocalizedNote | null {
  if (v == null || typeof v !== 'object') return null
  const n = v as Row
  return { th: str(n['th']), en: str(n['en']) }
}

export function province(r: Row): Province {
  return {
    code: String(r['code']),
    name: name(r['name']),
    kind: oneOf<ProvinceKind>(r['kind'], ['province', 'special_administrative_area']),
  }
}

export function district(r: Row): District {
  return {
    code: String(r['code']),
    province_code: String(r['province_code']),
    name: name(r['name']),
    kind: oneOf<DistrictKind>(r['kind'], ['amphoe', 'khet']),
  }
}

export function subdistrict(r: Row): Subdistrict {
  return {
    code: String(r['code']),
    district_code: String(r['district_code']),
    province_code: String(r['province_code']),
    name: name(r['name']),
    kind: oneOf<SubdistrictKind>(r['kind'], ['tambon', 'khwaeng']),
  }
}

/** An active link with a known kind and coverage, or null. */
export function postalOption(r: Row): (PostalOption & { subdistrict_code: string }) | null {
  const kind = oneOf(r['kind'], ['standard', 'facility'] as const)
  const coverage = oneOf(r['coverage'], ['full', 'partial'] as const)
  if (!isActive(r) || !kind || !coverage) return null
  return {
    subdistrict_code: String(r['subdistrict_code'] ?? r['code']),
    postal_code: String(r['postal_code']),
    kind,
    coverage,
    note: note(r['note']),
  }
}

/** The array's object rows; anything else in it (null, a number) is skipped. */
export const rows = (v: unknown): Row[] =>
  Array.isArray(v) ? v.filter((r): r is Row => typeof r === 'object' && r !== null && !Array.isArray(r)) : []
