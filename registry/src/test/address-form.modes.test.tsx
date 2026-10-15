import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { live, pick, renderForm } from "./harness"
import { setDesktop } from "./setup"

describe("area first", () => {
  it("cascades province, district, subdistrict, each disabled with a reason until its parent is set", async () => {
    const { user, value } = renderForm({ mode: "area-first" })
    expect(screen.queryByLabelText("รหัสไปรษณีย์")).not.toBeInTheDocument()
    const district = screen.getByRole("combobox", { name: "อำเภอ/เขต" })
    expect(district).toBeDisabled()
    expect(district).toHaveAccessibleDescription("เลือกจังหวัดก่อน")
    await pick(user, "จังหวัด", "ภูเก็ต")
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "อำเภอ" })).toBeEnabled()
    )
    expect(
      screen.getByRole("combobox", { name: "ตำบล" })
    ).toHaveAccessibleDescription("เลือกอำเภอก่อน")
    await pick(user, "อำเภอ", "เมืองภูเก็ต")
    await pick(user, "ตำบล", "กะรน")
    await waitFor(() =>
      expect(value()).toEqual({
        province_code: "83",
        district_code: "8301",
        subdistrict_code: "830108",
        postal_code: "83100",
      })
    )
    expect(screen.getByText("83100")).toBeInTheDocument()
  })

  it("a split subdistrict offers its codes with none chosen: Ko Kaeo 83000 / 83200", async () => {
    const { user, value } = renderForm({ mode: "area-first" })
    await pick(user, "จังหวัด", "ภูเก็ต")
    await pick(user, "อำเภอ", "เมืองภูเก็ต")
    await pick(user, "ตำบล", "เกาะแก้ว")
    const group = await screen.findByRole("radiogroup", {
      name: "รหัสไปรษณีย์ของพื้นที่นี้",
    })
    const radios = within(group).getAllByRole("radio")
    expect(radios.map((r) => r.textContent)).toEqual(["83000", "83200"])
    expect(
      radios.every((r) => r.getAttribute("aria-checked") === "false")
    ).toBe(true)
    expect(value().postal_code).toBeNull()
    await user.click(within(group).getByRole("radio", { name: "83200" }))
    expect(value().postal_code).toBe("83200")
  })

  it("changing a parent clears the levels below it, and says what it cleared", async () => {
    const { user, value, container } = renderForm({ mode: "area-first" })
    await pick(user, "จังหวัด", "ภูเก็ต")
    await pick(user, "อำเภอ", "เมืองภูเก็ต")
    await pick(user, "ตำบล", "กะรน")
    await waitFor(() => expect(value().postal_code).toBe("83100"))
    await pick(user, "จังหวัด", "ตรัง")
    expect(value()).toEqual({
      province_code: "92",
      district_code: null,
      subdistrict_code: null,
      postal_code: null,
    })
    expect(live(container)).toHaveTextContent(
      "ล้างอำเภอ ตำบล และรหัสไปรษณีย์แล้ว"
    )
  })
})

describe("single search box", () => {
  it("finds an address in English and fills the fields, which stay editable", async () => {
    const { user, value } = renderForm({ mode: "search" })
    const box = screen.getByRole("combobox", { name: "ค้นหาที่อยู่" })
    await user.type(box, "karon")
    const option = await screen.findByRole("option", {
      name: /ตำบลกะรน อำเภอเมืองภูเก็ต จังหวัดภูเก็ต/,
    })
    expect(within(option).getByText("83100")).toBeInTheDocument()
    expect(within(option).getByText("กะรน").tagName).toBe("STRONG")
    await user.click(option)
    await waitFor(() =>
      expect(value()).toEqual({
        province_code: "83",
        district_code: "8301",
        subdistrict_code: "830108",
        postal_code: "83100",
      })
    )
    expect(screen.getByRole("combobox", { name: "ตำบล" })).toBeEnabled()
  })

  it("lists at most 8, with a hint when there are more", async () => {
    const { user } = renderForm({ mode: "search" })
    await user.type(
      screen.getByRole("combobox", { name: "ค้นหาที่อยู่" }),
      "บางรัก"
    )
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(8))
    expect(screen.getAllByRole("option")[0]).toHaveTextContent(
      "แขวงบางรัก เขตบางรัก กรุงเทพมหานคร10500"
    )
    expect(screen.getByText("พิมพ์เพิ่มเพื่อให้ผลแคบลง")).toBeInTheDocument()
  })

  it("with no match, says so and “กรอกเอง” moves focus to the province", async () => {
    const { user } = renderForm({ mode: "search" })
    await user.type(
      screen.getByRole("combobox", { name: "ค้นหาที่อยู่" }),
      "zzzz"
    )
    expect(await screen.findByText("ไม่พบ “zzzz”")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "กรอกเอง" }))
    expect(screen.getByRole("combobox", { name: "จังหวัด" })).toHaveFocus()
  })
})

describe("labels and language", () => {
  it("labels follow kind: เขต and แขวง in Bangkok", async () => {
    const { user } = renderForm()
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "10200")
    expect(
      await screen.findByRole("combobox", { name: "เขต" })
    ).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "แขวง" })).toBeInTheDocument()
  })

  it("English labels, names and lang, with the same codes", async () => {
    const { user, value, container } = renderForm({ locale: "en" })
    expect(container.querySelector("fieldset")).toHaveAttribute("lang", "en")
    await user.type(screen.getByLabelText("Postal code"), "10200")
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "District (khet)" })
      ).toHaveTextContent("Phra Nakhon")
    )
    expect(
      screen.getByRole("combobox", { name: "Subdistrict (khwaeng)" })
    ).toBeInTheDocument()
    expect(value().district_code).toBe("1001")
  })
})

describe("states", () => {
  it("a failed load shows a destructive alert with retry, and keeps what was typed", async () => {
    let down = true
    const { user, value } = renderForm({}, { fail: () => down })
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    await user.type(postal, "83100")
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("โหลดข้อมูลที่อยู่ไม่สำเร็จ")
    expect(postal).toHaveValue("83100")
    down = false
    await user.click(within(alert).getByRole("button", { name: "ลองอีกครั้ง" }))
    await waitFor(() => expect(value().subdistrict_code).toBe("830108"))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("shows busy while loading and never blocks typing", async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const { user, container, value } = renderForm({}, { gate })
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    await user.type(postal, "83100")
    expect(postal).toHaveValue("83100")
    expect(container.querySelector("fieldset")).toHaveAttribute(
      "aria-busy",
      "true"
    )
    release()
    await waitFor(() => expect(value().subdistrict_code).toBe("830108"))
    await waitFor(() =>
      expect(container.querySelector("fieldset")).toHaveAttribute(
        "aria-busy",
        "false"
      )
    )
  })
})

describe("validation on submit", () => {
  it("says what is missing, marks it invalid and focuses the first, without submitting", async () => {
    const { user, submitted } = renderForm({ required: true })
    await user.click(screen.getByRole("button", { name: "submit" }))
    expect(submitted.count).toBe(0)
    expect(screen.getByText("กรุณาเลือกจังหวัด")).toBeInTheDocument()
    expect(screen.getByLabelText("รหัสไปรษณีย์")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(screen.getByLabelText("รหัสไปรษณีย์")).toHaveFocus()
  })

  it("is silent before submit, and an optional empty address submits", async () => {
    const { user, submitted } = renderForm()
    expect(screen.queryByText(/กรุณา/)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "submit" }))
    expect(submitted.count).toBe(1)
  })

  it("a postal code that does not serve the subdistrict is a mismatch on submit", async () => {
    const { user, submitted } = renderForm({
      initial: {
        province_code: "83",
        district_code: "8301",
        subdistrict_code: "830108",
        postal_code: "99999",
      },
    })
    await user.click(screen.getByRole("button", { name: "submit" }))
    await waitFor(() =>
      expect(
        screen.getByText("รหัสไปรษณีย์นี้ไม่ตรงกับตำบล/แขวงที่เลือก")
      ).toBeInTheDocument()
    )
    expect(submitted.count).toBe(0)
  })

  it("a complete address submits", async () => {
    const { user, submitted } = renderForm({
      required: true,
      initial: {
        province_code: "83",
        district_code: "8301",
        subdistrict_code: "830108",
        postal_code: "83100",
      },
    })
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "ตำบล" })).toHaveTextContent(
        "กะรน"
      )
    )
    await user.click(screen.getByRole("button", { name: "submit" }))
    expect(submitted.count).toBe(1)
  })
})

describe("mobile", () => {
  it("below 640px a picker opens a bottom drawer with its own search and tall rows", async () => {
    setDesktop(false)
    try {
      const { user } = renderForm({ mode: "area-first" })
      await user.click(screen.getByRole("combobox", { name: "จังหวัด" }))
      const dialog = await screen.findByRole("dialog", { name: "จังหวัด" })
      expect(
        within(dialog).getByPlaceholderText("ค้นหาจังหวัด…")
      ).toBeInTheDocument()
      const first = (await within(dialog).findAllByRole("option"))[0]!
      expect(first.className).toContain("min-h-11")
    } finally {
      setDesktop(true)
    }
  })
})
