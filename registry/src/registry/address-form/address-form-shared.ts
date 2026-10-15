import type {
  Area,
  District,
  LocalizedName,
  Province,
  Subdistrict,
} from "@farzai/thailand-address"

import type { CopyKey, Locale, Translate } from "./address-form-copy"

export const nameIn = (n: LocalizedName, locale: Locale) =>
  locale === "en" ? (n.en ?? n.th) : n.th

/** The Bangkok kinds (khet, khwaeng) or the provincial ones; null when no province is known yet. */
export function levelKinds(
  province: Pick<Province, "kind"> | null | undefined,
  district?: Pick<District, "kind"> | null,
  subdistrict?: Pick<Subdistrict, "kind"> | null
): { district: CopyKey; subdistrict: CopyKey } {
  if (!province) return { district: "district", subdistrict: "subdistrict" }
  const bangkok = province.kind === "special_administrative_area"
  const d: CopyKey =
    district?.kind ??
    (province.kind === null ? "district" : bangkok ? "khet" : "amphoe")
  const s: CopyKey =
    subdistrict?.kind ??
    (province.kind === null ? "subdistrict" : bangkok ? "khwaeng" : "tambon")
  return { district: d, subdistrict: s }
}

/** "อ.บ้านแพรก › พระนครศรีอยุธยา" / "Ban Phraek › Phra Nakhon Si Ayutthaya", the second line of an area choice. */
export function areaContext(a: Area, locale: Locale): string {
  if (locale === "en")
    return `${nameIn(a.district.name, "en")} › ${nameIn(a.province.name, "en")}`
  const prefix = a.district.kind === "khet" ? "เขต" : "อ."
  return `${prefix}${a.district.name.th} › ${a.province.name.th}`
}

/** "อำเภอ ตำบล และรหัสไปรษณีย์" / "District, subdistrict and postal code". */
export function joinList(items: string[], locale: Locale): string {
  if (items.length <= 1) return items.join("")
  const last = items[items.length - 1]
  const head = items.slice(0, -1)
  if (locale === "en") {
    const s = `${head.join(", ")} and ${last}`
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  }
  return `${head.join(" ")} และ${last}`
}

export const sortByName = <T extends { name: LocalizedName }>(
  items: T[],
  locale: Locale
): T[] => {
  const collator = new Intl.Collator(locale)
  return [...items].sort((a, b) =>
    collator.compare(nameIn(a.name, locale), nameIn(b.name, locale))
  )
}

export type { Translate }
