import { fold, queryTokens, type Folded } from './text'
import type { Area, District, NameRanges, Province, Range, SearchHit, SearchResult } from './types'

type Names = [th: Folded, en: Folded | null]
const LEVELS = ['subdistrict', 'district', 'province'] as const
type NameLevel = (typeof LEVELS)[number]

/**
 * One searchable row: a province, a district, or a subdistrict with one of
 * its postal codes. `own` is the level the row stands for; a row only
 * matches when the query matches its own name (or, for a subdistrict, its
 * postal code), so "ลำปาง" gives the province once instead of every tambon
 * in Lampang.
 */
type Entry = {
  own: NameLevel
  hit: { province: Province; district?: District; area?: Area; postal_code?: string | null }
  names: Partial<Record<NameLevel, Names>>
  facility: boolean
}

export type SearchIndex = Entry[]

const QUALITY = ['exact', 'prefix', 'contains'] as const
type Quality = (typeof QUALITY)[number]

const names = (n: { th: string; en: string | null }): Names => [fold(n.th), n.en ? fold(n.en) : null]

export function buildSearchIndex(
  provinces: Province[],
  districts: District[],
  areas: Area[],
  postal: Map<string, { postal_code: string; facility: boolean }[]>,
): SearchIndex {
  const out: SearchIndex = []
  const provinceNames = new Map(provinces.map((p) => [p.code, names(p.name)]))
  const districtNames = new Map(districts.map((d) => [d.code, names(d.name)]))
  for (const p of provinces) out.push({ own: 'province', hit: { province: p }, names: { province: provinceNames.get(p.code)! }, facility: false })
  const byCode = new Map(provinces.map((p) => [p.code, p]))
  for (const d of districts) {
    const province = byCode.get(d.province_code)
    if (!province) continue
    out.push({
      own: 'district',
      hit: { province, district: d },
      names: { district: districtNames.get(d.code)!, province: provinceNames.get(province.code)! },
      facility: false,
    })
  }
  for (const area of areas) {
    const n = {
      subdistrict: names(area.subdistrict.name),
      district: districtNames.get(area.district.code) ?? names(area.district.name),
      province: provinceNames.get(area.province.code) ?? names(area.province.name),
    }
    const codes = postal.get(area.subdistrict.code) ?? []
    const rows = codes.length ? codes : [{ postal_code: null, facility: false }]
    for (const c of rows) {
      out.push({ own: 'subdistrict', hit: { province: area.province, area, postal_code: c.postal_code }, names: n, facility: c.facility })
    }
  }
  return out
}

function matchIn(f: Folded, form: string): { q: number; range: Range } | null {
  const at = f.text.indexOf(form)
  if (at < 0) return null
  const q = f.text === form ? 0 : at === 0 ? 1 : 2
  return { q, range: [f.map[at]!, f.map[at + form.length - 1]! + 1] }
}

export function isSearchable(query: string): boolean {
  const text = queryTokens(query)
    .map((t) => t[0])
    .join('')
  if (!text) return false
  return /^\d+$/.test(text) ? text.length >= 3 : text.length >= 2
}

type Scored = { q: number; ownHit: boolean; ranges: SearchHit['match']['ranges'] }

/** How well one form matches this entry: best quality over its levels, and whether its own level matched. */
function scoreForm(e: Entry, form: string, ranges: Scored['ranges']): { q: number; own: boolean } | null {
  if (/^\d+$/.test(form)) {
    const pc = e.hit.postal_code
    if (e.own !== 'subdistrict' || !pc?.startsWith(form)) return null
    ranges.postal_code = [0, form.length]
    return { q: form.length === 5 ? 0 : 1, own: true }
  }
  let best: { q: number; own: boolean } | null = null
  for (const level of LEVELS) {
    const n = e.names[level]
    if (!n) continue
    const langs: [keyof NameRanges, Folded | null][] = [
      ['th', n[0]],
      ['en', n[1]],
    ]
    for (const [lang, f] of langs) {
      const m = f && matchIn(f, form)
      if (!m) continue
      ;(ranges[level] ??= {})[lang] ??= m.range
      const own = level === e.own
      // Prefer a match on the entry's own level, then the better quality.
      if (!best || (own && !best.own) || (own === best.own && m.q < best.q)) best = { q: m.q, own }
    }
  }
  return best
}

/**
 * Every word must match some level of the entry, and the entry scores by its
 * weakest word, so "bang rak" is not ranked by "bang" alone. The whole query
 * without spaces is tried too, so a name typed as written ("bang rak",
 * "Mueang Phuket") scores as the exact match it is.
 */
function score(e: Entry, tokens: string[][], whole: string | null): Scored | null {
  let result: Scored | null = null
  if (whole) {
    const ranges: Scored['ranges'] = {}
    const s = scoreForm(e, whole, ranges)
    if (s?.own) result = { q: s.q, ownHit: true, ranges }
  }
  const ranges: Scored['ranges'] = {}
  let worst = -1
  let own = false
  for (const forms of tokens) {
    let bestForToken: { q: number; own: boolean } | null = null
    for (const form of forms) {
      const s = scoreForm(e, form, ranges)
      if (s && (!bestForToken || s.q < bestForToken.q || (s.own && !bestForToken.own))) bestForToken = s
    }
    if (!bestForToken) return result
    worst = Math.max(worst, bestForToken.q)
    own ||= bestForToken.own
  }
  if (own && (!result || worst < result.q)) result = { q: worst, ownHit: true, ranges }
  return result
}

const LEVEL_RANK: Record<NameLevel, number> = { subdistrict: 0, district: 1, province: 2 }

export function runSearch(
  index: SearchIndex,
  query: string,
  opts: { limit: number; includeFacility: boolean; collator: Intl.Collator },
): SearchResult {
  const tokens = queryTokens(query)
  const whole = tokens.length > 1 ? tokens.map((t) => t[t.length - 1]!).join('') : null
  const scored: { e: Entry; s: Scored }[] = []
  for (const e of index) {
    if (e.facility && !opts.includeFacility) continue
    const s = score(e, tokens, whole)
    if (s) scored.push({ e, s })
  }
  const nameOf = (e: Entry) => (e.hit.area?.subdistrict ?? e.hit.district ?? e.hit.province).name.th
  const codeOf = (e: Entry) => (e.hit.area?.subdistrict ?? e.hit.district ?? e.hit.province).code
  // How well it matched, then the more specific level, then by name, then
  // by code and postal code so the order is stable.
  scored.sort(
    (a, b) =>
      a.s.q - b.s.q ||
      LEVEL_RANK[a.e.own] - LEVEL_RANK[b.e.own] ||
      opts.collator.compare(nameOf(a.e), nameOf(b.e)) ||
      codeOf(a.e).localeCompare(codeOf(b.e)) ||
      (a.e.hit.postal_code ?? '').localeCompare(b.e.hit.postal_code ?? ''),
  )
  const hits = scored.slice(0, opts.limit).map(({ e, s }): SearchHit => {
    const match = { quality: QUALITY[s.q] as Quality, ranges: s.ranges }
    if (e.own === 'subdistrict') return { ...e.hit.area!, level: 'subdistrict', postal_code: e.hit.postal_code ?? null, match }
    if (e.own === 'district') return { level: 'district', province: e.hit.province, district: e.hit.district!, match }
    return { level: 'province', province: e.hit.province, match }
  })
  return { status: 'ok', hits, more: scored.length > opts.limit }
}
