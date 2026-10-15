import type * as wire from './generated/schema'

export type { wire }

/** A name by language, without its administrative prefix. `en` is null when DOPA has none. */
export type LocalizedName = { th: string; en: string | null }

/** A note by language; a language no source gives is null. */
export type LocalizedNote = { th: string | null; en: string | null }

export type Locale = 'th' | 'en'

/**
 * Kinds are the values this package knows. A kind added to the dataset later
 * reads as null, so a consumer falls back to a neutral label instead of a
 * wrong one.
 */
export type ProvinceKind = 'province' | 'special_administrative_area'
export type DistrictKind = 'amphoe' | 'khet'
export type SubdistrictKind = 'tambon' | 'khwaeng'

export type Province = { code: string; name: LocalizedName; kind: ProvinceKind | null }
export type District = { code: string; province_code: string; name: LocalizedName; kind: DistrictKind | null }
export type Subdistrict = {
  code: string
  district_code: string
  province_code: string
  name: LocalizedName
  kind: SubdistrictKind | null
}

/** One subdistrict with the district and province it belongs to. */
export type Area = { province: Province; district: District; subdistrict: Subdistrict }

export type PostalKind = 'standard' | 'facility'
export type Coverage = 'full' | 'partial'

/** One active postal code of one subdistrict. */
export type PostalOption = {
  postal_code: string
  kind: PostalKind
  /** full: the subdistrict's only standard code. partial: one of several. */
  coverage: Coverage
  note: LocalizedNote | null
}

/** The four codes an address form produces. An unset level is null. */
export type AddressValue = {
  province_code: string | null
  district_code: string | null
  subdistrict_code: string | null
  postal_code: string | null
}

export type PostalLookup =
  /** Fewer than 5 digits after normalising: no lookup ran. */
  | { status: 'incomplete'; postal_code: string }
  /** No active link uses this code. */
  | { status: 'not_found'; postal_code: string }
  /** Only facility links use this code, and facility codes are hidden. */
  | { status: 'facility'; postal_code: string; facilities: { area: Area; note: LocalizedNote | null }[] }
  | {
      status: 'found'
      postal_code: string
      /**
       * single: one subdistrict, fill everything.
       * one_district: several subdistricts in one district; province and district are known.
       * several_districts: the areas span districts or provinces; one combined choice.
       */
      shape: 'single' | 'one_district' | 'several_districts'
      areas: Area[]
      provinceCount: number
      districtCount: number
    }

export type Level = 'subdistrict' | 'district' | 'province' | 'postal_code'
export type Range = [start: number, end: number]
export type NameRanges = { th?: Range; en?: Range }

export type SearchHit = Area & {
  /** One hit per postal code; null for a subdistrict with no known code. */
  postal_code: string | null
  match: {
    /** The most specific level the query matched. */
    level: Level
    quality: 'exact' | 'prefix' | 'contains'
    /** Where the query matched in each bare name, by language, for highlighting. */
    ranges: { subdistrict?: NameRanges; district?: NameRanges; province?: NameRanges; postal_code?: Range }
  }
}

export type SearchResult =
  /** Fewer than 2 letters or 3 digits: no search ran. */
  | { status: 'too_short' }
  | { status: 'ok'; hits: SearchHit[]; more: boolean }

export type ValidationError = {
  field: keyof AddressValue
  /** required: missing. unknown: no active area has this code. mismatch: it does not belong to the level above. */
  code: 'required' | 'unknown' | 'mismatch'
  /** For a postal code mismatch, the codes that do serve the subdistrict. */
  expected?: string[]
}

export type ValidationResult = { valid: boolean; errors: ValidationError[] }
