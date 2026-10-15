import type { AddressValue } from "@farzai/thailand-address"

const FIELDS = [
  "province_code",
  "district_code",
  "subdistrict_code",
  "postal_code",
] as const

/** The rule for each field, pointing at the field of the level above (farzai/thailand-address). */
const RULES: Record<(typeof FIELDS)[number], (name: string) => string> = {
  province_code: () => "required|thai_province",
  district_code: (n) => `required|thai_district:${n}.province_code`,
  subdistrict_code: (n) => `required|thai_subdistrict:${n}.district_code`,
  postal_code: (n) => `required|thai_postal_code:${n}.subdistrict_code`,
}

export function jsonPayload(addresses: Record<string, AddressValue>): string {
  return JSON.stringify(addresses, null, 2)
}

const attr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")

/** The hidden inputs <AddressForm name={name}> renders, as a plain form posts them. */
export function htmlFields(name: string, value: AddressValue): string {
  return FIELDS.map(
    (f) =>
      `<input type="hidden" name="${attr(name)}[${f}]" value="${attr(value[f] ?? "")}">`
  ).join("\n")
}

/** A Laravel validate() call for each named address, keys aligned. */
export function laravelRules(names: string[]): string {
  const keys = names.flatMap((n) =>
    FIELDS.map((f) => ({ key: `'${n}.${f}'`, rule: `'${RULES[f](n)}'` }))
  )
  const width = Math.max(...keys.map((k) => k.key.length))
  return [
    "$request->validate([",
    ...keys.map((k) => `    ${k.key.padEnd(width)} => ${k.rule},`),
    "]);",
  ].join("\n")
}
