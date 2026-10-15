import { screen, waitFor } from "@testing-library/react"
import axe from "axe-core"
import { describe, expect, it } from "vitest"

import { pick, renderForm } from "./harness"

async function violations(container: HTMLElement) {
  // jsdom cannot compute colour contrast; the host theme's tokens own it.
  const r = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  })
  return r.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`
  )
}

describe("axe", () => {
  it("empty, postal first", async () => {
    const { container } = renderForm()
    expect(await violations(container)).toEqual([])
  })

  it("13240 area choice and 10001 facility notice", async () => {
    const { container, user } = renderForm()
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    await user.type(postal, "13240")
    await screen.findByRole("radiogroup")
    expect(await violations(container)).toEqual([])
    await user.clear(postal)
    await user.type(postal, "10001")
    await screen.findByRole("status", { name: /รหัสไปรษณีย์ของหน่วยงาน/ })
    expect(await violations(container)).toEqual([])
  })

  it("area first with a postal code choice, and submit errors", async () => {
    const { container, user } = renderForm({
      mode: "area-first",
      required: true,
    })
    await pick(user, "จังหวัด", "ภูเก็ต")
    await pick(user, "อำเภอ", "เมืองภูเก็ต")
    await pick(user, "ตำบล", "เกาะแก้ว")
    await screen.findByRole("radiogroup")
    await user.click(screen.getByRole("button", { name: "submit" }))
    await waitFor(() =>
      expect(screen.getByText("กรุณากรอกรหัสไปรษณีย์")).toBeInTheDocument()
    )
    expect(await violations(container)).toEqual([])
  })

  it("search results", async () => {
    const { container, user } = renderForm({ mode: "search" })
    await user.type(
      screen.getByRole("combobox", { name: "ค้นหาที่อยู่" }),
      "บางรัก"
    )
    await screen.findAllByRole("option")
    expect(await violations(container)).toEqual([])
  })
})
