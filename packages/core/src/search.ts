import { fold, queryTokens, type Folded } from './text'
import type { Area, Level, NameRanges, Range, SearchHit, SearchResult } from './types'

type Entry = {
  area: Area
  postal_code: string | null
  postalFacility: boolean
  folded: { subdistrict: [Folded, Folded | null]; district: [Folded, Folded | null]; province: [Folded, Folded | null] }
}

export type SearchIndex = Entry[]

const LEVELS = ['subdistrict', 'district', 'province'] as const
const QUALITY = { exact: 0, prefix: 1, contains: 2 } as const
type Quality = keyof typeof QUALITY

/** One entry per (subdistrict, postal code), names folded once up front. */
export function buildSearchIndex(
  areas: Area[],
  postal: Map<string, { postal_code: string; facility: boolean }[]>,
): SearchIndex {
  const out: SearchIndex = []
  const f = (n: { th: string; en: string | null }): [Folded, Folded | null] => [fold(n.th), n.en ? fold(n.en) : null]
  for (const area of areas) {
    const folded = {
      subdistrict: f(area.subdistrict.name),
      district: f(area.district.name),
      province: f(area.province.name),
    }
    const codes = postal.get(area.subdistrict.code) ?? []
    if (codes.length === 0) out.push({ area, postal_code: null, postalFacility: false, folded })
    for (const c of codes) out.push({ area, postal_code: c.postal_code, postalFacility: c.facility, folded })
  }
  return out
}

function matchIn(f: Folded, form: string): { quality: Quality; range: Range } | null {
  const at = f.text.indexOf(form)
  if (at < 0) return null
  const quality: Quality = f.text === form ? 'exact' : at === 0 ? 'prefix' : 'contains'
  const end = f.map[at + form.length - 1]! + 1
  return { quality, range: [f.map[at]!, end] }
}

export function isSearchable(query: string): boolean {
  const tokens = queryTokens(query)
  const text = tokens.map((t) => t[0]).join('')
  if (!text) return false
  return /^\d+$/.test(text) ? text.length >= 3 : text.length >= 2
}

export function runSearch(
  index: SearchIndex,
  query: string,
  opts: { limit: number; includeFacility: boolean; collator: Intl.Collator },
): SearchResult {
  const tokens = queryTokens(query)
  const scored: { hit: SearchHit; q: number; l: number }[] = []

  for (const e of index) {
    if (e.postalFacility && !opts.includeFacility) continue
    let best: { q: number; l: number } | null = null
    const ranges: SearchHit['match']['ranges'] = {}
    let all = true
    for (const forms of tokens) {
      let tokenHit = false
      for (const form of forms) {
        if (/^\d+$/.test(form)) {
          if (e.postal_code?.startsWith(form)) {
            tokenHit = true
            ranges.postal_code = [0, form.length]
            const q = QUALITY[form.length === 5 ? 'exact' : 'prefix']
            const l = 3
            if (!best || q < best.q || (q === best.q && l < best.l)) best = { q, l }
          }
          continue
        }
        LEVELS.forEach((level, l) => {
          const [th, en] = e.folded[level]
          const langs: [keyof NameRanges, Folded | null][] = [['th', th], ['en', en]]
          for (const [lang, f] of langs) {
            if (!f) continue
            const m = matchIn(f, form)
            if (!m) continue
            tokenHit = true
            ;(ranges[level] ??= {})[lang] ??= m.range
            const q = QUALITY[m.quality]
            if (!best || q < best.q || (q === best.q && l < best.l)) best = { q, l }
          }
        })
      }
      if (!tokenHit) {
        all = false
        break
      }
    }
    if (!all || !best) continue
    const level: Level = best.l === 3 ? 'postal_code' : LEVELS[best.l]!
    const quality = (Object.keys(QUALITY) as Quality[])[best.q]!
    scored.push({
      hit: { ...e.area, postal_code: e.postal_code, match: { level, quality, ranges } },
      q: best.q,
      l: best.l,
    })
  }

  // How well it matched first, then how specific the matched level is, then
  // by subdistrict name, then by code so the order is stable.
  scored.sort(
    (a, b) =>
      a.q - b.q ||
      a.l - b.l ||
      opts.collator.compare(a.hit.subdistrict.name.th, b.hit.subdistrict.name.th) ||
      a.hit.subdistrict.code.localeCompare(b.hit.subdistrict.code) ||
      (a.hit.postal_code ?? '').localeCompare(b.hit.postal_code ?? ''),
  )
  return {
    status: 'ok',
    hits: scored.slice(0, opts.limit).map((s) => s.hit),
    more: scored.length > opts.limit,
  }
}
