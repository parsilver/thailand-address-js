const THAI_ZERO = 0x0e50

/** Thai digits ๐-๙ become 0-9; everything else is unchanged. */
export function toAsciiDigits(s: string): string {
  return s.replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - THAI_ZERO))
}

/**
 * What a postal code field should hold for any typed or pasted text: Thai
 * digits converted, every other non-digit dropped, at most 5 digits.
 */
export function normalizePostalInput(input: string): string {
  return toAsciiDigits(input).replace(/\D/g, '').slice(0, 5)
}

/** A string folded for matching, with where each folded character came from. */
export type Folded = { text: string; map: number[] }

/**
 * Lowercase, drop whitespace and the dots and hyphens people type or omit.
 * `map[i]` is the index in the original of folded character i, so a match
 * can be highlighted in the original text.
 */
export function fold(s: string): Folded {
  let text = ''
  const map: number[] = []
  const src = toAsciiDigits(s)
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!
    if (/[\s.\-,()]/.test(ch)) continue
    text += ch.toLowerCase()
    map.push(i)
  }
  return { text, map }
}

// Administrative prefixes a user may type before a name. The dataset stores
// names without them. Longest first, so ตำบล is not read as ต + ำบล.
const PREFIXES = ['จังหวัด', 'อำเภอ', 'ตำบล', 'แขวง', 'เขต', 'จ.', 'อ.', 'ต.', 'กิ่งอำเภอ']
  .sort((a, b) => b.length - a.length)
const EN_PREFIXES = ['province', 'district', 'subdistrict', 'khwaeng', 'khet', 'amphoe', 'tambon']

/**
 * The query words, each with its prefix-free form. Both forms are tried, so a
 * name that itself starts like a prefix (จ.ป.ร.) is still found.
 */
export function queryTokens(query: string): string[][] {
  const words = toAsciiDigits(query).trim().split(/[\s,]+/).filter(Boolean)
  const out: string[][] = []
  for (const w of words) {
    const lower = w.toLowerCase()
    if (PREFIXES.includes(w) || EN_PREFIXES.includes(lower)) continue
    const forms = new Set<string>()
    const raw = fold(w).text
    if (raw) forms.add(raw)
    const p = PREFIXES.find((x) => w.startsWith(x) && w.length > x.length)
    if (p) {
      const stripped = fold(w.slice(p.length)).text
      if (stripped) forms.add(stripped)
    }
    if (forms.size) out.push([...forms])
  }
  return out
}
