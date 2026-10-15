import type { Area, Locale } from './types'

/**
 * The one-line address used in summaries, search results and announcements:
 * Bangkok `แขวง{s} เขต{d} กรุงเทพมหานคร {pc}`, elsewhere
 * `ตำบล{s} อำเภอ{d} จังหวัด{p} {pc}`, and in English `{s}, {d}, {p} {pc}`.
 * An English name DOPA does not have falls back to the Thai one.
 */
export function formatAddress(area: Area, locale: Locale, postalCode?: string | null): string {
  const { province: p, district: d, subdistrict: s } = area
  let line: string
  if (locale === 'en') {
    line = [s, d, p].map((x) => x.name.en ?? x.name.th).join(', ')
  } else {
    const bangkok = p.kind === 'special_administrative_area'
    const sp = s.kind === 'khwaeng' || (s.kind === null && bangkok) ? 'แขวง' : 'ตำบล'
    const dp = d.kind === 'khet' || (d.kind === null && bangkok) ? 'เขต' : 'อำเภอ'
    const pp = bangkok ? '' : 'จังหวัด'
    line = `${sp}${s.name.th} ${dp}${d.name.th} ${pp}${p.name.th}`
  }
  return postalCode ? `${line} ${postalCode}` : line
}
