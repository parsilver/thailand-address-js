import { describe, expect, it } from "vitest"
import type { Area, PostalLookup } from "@farzai/thailand-address"

import {
  initialPostalState,
  postalReducer,
  type PostalState,
} from "@/registry/address-form/address-form-state"

const area = (s: string, d: string): Area =>
  ({
    province: {
      code: d.slice(0, 2),
      name: { th: "", en: null },
      kind: "province",
    },
    district: {
      code: d,
      province_code: d.slice(0, 2),
      name: { th: "", en: null },
      kind: "amphoe",
    },
    subdistrict: {
      code: s,
      district_code: d,
      province_code: d.slice(0, 2),
      name: { th: "", en: null },
      kind: "tambon",
    },
  }) as Area
const found = (
  shape: "single" | "one_district" | "several_districts",
  areas: Area[]
): PostalLookup => ({
  status: "found",
  postal_code: "13240",
  shape,
  areas,
  province_count: 1,
  district_count: 1,
})

const afterChoice = (): PostalState =>
  postalReducer(initialPostalState("13240"), {
    type: "lookup_done",
    pc: "13240",
    facility: false,
    result: found("several_districts", [
      area("141601", "1416"),
      area("160104", "1601"),
    ]),
  })

describe("postalReducer", () => {
  it("a lookup sets exactly what its shape implies", () => {
    const single = postalReducer(initialPostalState("83100"), {
      type: "lookup_done",
      pc: "83100",
      facility: false,
      result: {
        ...found("single", [area("830108", "8301")]),
        postal_code: "83100",
      },
    })
    expect([single.autofilledFrom, single.narrowed, single.choice]).toEqual([
      "83100",
      null,
      null,
    ])
    const one = postalReducer(initialPostalState("10200"), {
      type: "lookup_done",
      pc: "10200",
      facility: false,
      result: {
        ...found("one_district", [
          area("100101", "1001"),
          area("100102", "1001"),
        ]),
        postal_code: "10200",
      },
    })
    expect(one.narrowed).toHaveLength(2)
    expect(afterChoice().choice).toHaveLength(2)
    expect(afterChoice().autofilledFrom).toBeNull()
  })

  it("reset and typing clear everything the last code implied", () => {
    expect(postalReducer(afterChoice(), { type: "reset", input: "" })).toEqual(
      initialPostalState("")
    )
    expect(postalReducer(afterChoice(), { type: "typed", input: "1" })).toEqual(
      initialPostalState("1")
    )
  })

  it("picking a province clears the choice and, unless an unknown code is kept, the code too", () => {
    const s = postalReducer(afterChoice(), {
      type: "area_picked",
      level: "province",
      code: "83",
      keepTyped: false,
    })
    expect([s.choice, s.input, s.lookup]).toEqual([null, "", null])
    const kept = postalReducer(afterChoice(), {
      type: "area_picked",
      level: "province",
      code: "83",
      keepTyped: true,
    })
    expect([kept.input, kept.lookup?.status]).toEqual(["13240", "done"])
  })

  it("picking a district keeps a narrowed list only if the district is in it", () => {
    const narrowed: PostalState = {
      ...initialPostalState("10200"),
      narrowed: [area("100101", "1001")],
    }
    expect(
      postalReducer(narrowed, {
        type: "area_picked",
        level: "district",
        code: "1001",
        keepTyped: true,
      }).narrowed
    ).toHaveLength(1)
    expect(
      postalReducer(narrowed, {
        type: "area_picked",
        level: "district",
        code: "1002",
        keepTyped: true,
      }).narrowed
    ).toBeNull()
  })

  it("a hand-picked subdistrict drops a lookup still in flight, but keeps a finished one", () => {
    const loading = postalReducer(initialPostalState("83100"), {
      type: "lookup_start",
      pc: "83100",
      facility: false,
    })
    expect(
      postalReducer(loading, { type: "subdistrict_picked" }).lookup
    ).toBeNull()
    expect(
      postalReducer(afterChoice(), { type: "subdistrict_picked" }).lookup
        ?.status
    ).toBe("done")
  })
})
