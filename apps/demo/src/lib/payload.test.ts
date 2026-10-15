import { describe, expect, it } from "vitest"

import { htmlFields, jsonPayload, laravelRules } from "./payload"

const karon = {
  province_code: "83",
  district_code: "8301",
  subdistrict_code: "830108",
  postal_code: "83100",
}
const empty = {
  province_code: null,
  district_code: null,
  subdistrict_code: null,
  postal_code: null,
}

describe("payload views", () => {
  it("JSON keeps codes as strings and unset levels as null", () => {
    expect(JSON.parse(jsonPayload({ shipping: karon, tax: empty }))).toEqual({
      shipping: karon,
      tax: empty,
    })
  })

  it("HTML lists the hidden inputs the form posts, empty for an unset level", () => {
    expect(htmlFields("shipping", { ...karon, postal_code: null })).toBe(
      [
        '<input type="hidden" name="shipping[province_code]" value="83">',
        '<input type="hidden" name="shipping[district_code]" value="8301">',
        '<input type="hidden" name="shipping[subdistrict_code]" value="830108">',
        '<input type="hidden" name="shipping[postal_code]" value="">',
      ].join("\n")
    )
  })

  it("Laravel uses farzai/thailand-address's string rules, each pointing at the level above", () => {
    expect(laravelRules(["shipping"])).toBe(
      [
        "$request->validate([",
        "    'shipping.province_code'    => 'required|thai_province',",
        "    'shipping.district_code'    => 'required|thai_district:shipping.province_code',",
        "    'shipping.subdistrict_code' => 'required|thai_subdistrict:shipping.district_code',",
        "    'shipping.postal_code'      => 'required|thai_postal_code:shipping.subdistrict_code',",
        "]);",
      ].join("\n")
    )
  })

  it("Laravel covers every address, e.g. shipping and tax", () => {
    const rules = laravelRules(["shipping", "tax"])
    expect(rules).toContain(
      "'tax.postal_code'           => 'required|thai_postal_code:tax.subdistrict_code',"
    )
  })

  it("escapes what it puts in an attribute", () => {
    expect(htmlFields('a"b', karon)).toContain('name="a&quot;b[province_code]"')
  })
})
