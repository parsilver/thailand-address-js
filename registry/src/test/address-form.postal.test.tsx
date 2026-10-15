import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { live, pick, renderForm } from "./harness"

describe("postal code first", () => {
  it("is the default mode, with the numeric postal input first", () => {
    renderForm()
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    expect(postal).toHaveAttribute("inputmode", "numeric")
    expect(postal).toHaveAttribute("autocomplete", "postal-code")
    expect(postal).toHaveAttribute("maxlength", "5")
    expect(postal).toHaveAttribute("pattern", "[0-9]*")
    expect(screen.getByRole("combobox", { name: "อำเภอ/เขต" })).toBeDisabled()
    expect(screen.getByText("เลือกจังหวัดก่อน")).toBeInTheDocument()
  })

  it("83100: fills all three, notes it, announces it, and keeps focus in the postal code", async () => {
    const { user, value, container } = renderForm()
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    await user.type(postal, "83100")
    await waitFor(() =>
      expect(value()).toEqual({
        province_code: "83",
        district_code: "8301",
        subdistrict_code: "830108",
        postal_code: "83100",
      })
    )
    expect(screen.getByText("เติมจากรหัสไปรษณีย์ 83100")).toBeInTheDocument()
    expect(live(container)).toHaveTextContent(
      "ตำบลกะรน อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83100"
    )
    expect(postal).toHaveFocus()
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "ตำบล" })).toHaveTextContent(
        "กะรน"
      )
    )
    expect(
      container.querySelector('input[name="shipping[subdistrict_code]"]')
    ).toHaveValue("830108")
    expect(
      container.querySelector('input[name="shipping[postal_code]"]')
    ).toHaveValue("83100")
  })

  it("strips spaces, converts Thai digits and drops other characters", async () => {
    const { user, value } = renderForm()
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    await user.type(postal, "๘๓ 1a00")
    expect(postal).toHaveValue("83100")
    await waitFor(() => expect(value().subdistrict_code).toBe("830108"))
  })

  it("10200: fills province and district, narrows the khwaeng to 12, and does not open or steal focus", async () => {
    const { user, value } = renderForm()
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    await user.type(postal, "10200")
    await waitFor(() =>
      expect(value()).toMatchObject({
        province_code: "10",
        district_code: "1001",
        subdistrict_code: null,
        postal_code: "10200",
      })
    )
    const sub = await screen.findByRole("combobox", { name: "แขวง" })
    expect(sub).toHaveAttribute("aria-expanded", "false")
    expect(sub).toHaveAccessibleDescription(
      "รหัส 10200 ใช้ได้ 12 แขวง เลือกแขวงของคุณ"
    )
    expect(postal).toHaveFocus()
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "เขต" })).toHaveTextContent(
        "พระนคร"
      )
    )
    await user.click(sub)
    expect(
      within(await screen.findByRole("listbox")).getAllByRole("option")
    ).toHaveLength(12)
  })

  it("13240: a labelled radio group of the 6 areas under the postal code; picking one fills all three", async () => {
    const { user, value } = renderForm()
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "13240")
    const group = await screen.findByRole("radiogroup", {
      name: /รหัส 13240 ใช้ได้ 6 พื้นที่ใน 2 จังหวัด/,
    })
    const radios = within(group).getAllByRole("radio")
    expect(radios).toHaveLength(6)
    expect(
      within(group).getByText("อ.เมืองลพบุรี › ลพบุรี")
    ).toBeInTheDocument()
    await user.click(within(group).getByRole("radio", { name: /โก่งธนู/ }))
    await waitFor(() =>
      expect(value()).toEqual({
        province_code: "16",
        district_code: "1601",
        subdistrict_code: "160104",
        postal_code: "13240",
      })
    )
  })

  it("10001: a facility code is hidden, named from the dataset note, and usable on request", async () => {
    const { user, value } = renderForm()
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "10001")
    const alert = await screen.findByRole("status", {
      name: /10001 เป็นรหัสไปรษณีย์ของหน่วยงาน/,
    })
    expect(alert).toHaveTextContent("ศูนย์ไปรษณีย์สุวรรณภูมิ")
    expect(value()).toEqual({
      province_code: null,
      district_code: null,
      subdistrict_code: null,
      postal_code: null,
    })
    expect(screen.getByRole("combobox", { name: "จังหวัด" })).toBeEnabled()
    await user.click(
      within(alert).getByRole("button", { name: "ใช้รหัสนี้ต่อ" })
    )
    await waitFor(() =>
      expect(value()).toEqual({
        province_code: "11",
        district_code: "1103",
        subdistrict_code: "110308",
        postal_code: "10001",
      })
    )
  })

  it("10001 with showFacilityCodes behaves like an ordinary code", async () => {
    const { user, value } = renderForm({ showFacilityCodes: true })
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "10001")
    await waitFor(() => expect(value().subdistrict_code).toBe("110308"))
    expect(
      screen.queryByText(/รหัสไปรษณีย์ของหน่วยงาน/)
    ).not.toBeInTheDocument()
  })

  it("99999: says so without an error, keeps manual selection, then offers the area's code as a fix", async () => {
    const { user, value } = renderForm()
    const postal = screen.getByLabelText("รหัสไปรษณีย์")
    await user.type(postal, "99999")
    const alert = await screen.findByRole("status", {
      name: /ไม่พบรหัสไปรษณีย์ 99999/,
    })
    expect(alert).toBeInTheDocument()
    expect(postal).not.toHaveAttribute("aria-invalid")
    await pick(user, "จังหวัด", "ภูเก็ต")
    await pick(user, "อำเภอ", "เมืองภูเก็ต")
    await pick(user, "ตำบล", "กะรน")
    await waitFor(() => expect(postal).toHaveAttribute("aria-invalid", "true"))
    expect(screen.getByText("ตำบลกะรนใช้รหัส 83100")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "ใช้ 83100" }))
    expect(value()).toEqual({
      province_code: "83",
      district_code: "8301",
      subdistrict_code: "830108",
      postal_code: "83100",
    })
    expect(postal).toHaveValue("83100")
  })

  it("changing the subdistrict by hand switches to that area's only code, and says so", async () => {
    const { user, value, container } = renderForm()
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "83100")
    await waitFor(() => expect(value().subdistrict_code).toBe("830108"))
    await pick(user, "ตำบล", "ตลาดใหญ่")
    await waitFor(() =>
      expect(value()).toMatchObject({
        subdistrict_code: "830101",
        postal_code: "83000",
      })
    )
    expect(live(container)).toHaveTextContent("เปลี่ยนรหัสไปรษณีย์เป็น 83000")
  })

  it("changing the subdistrict to a split area clears the code and asks which one", async () => {
    const { user, value } = renderForm()
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "83100")
    await waitFor(() => expect(value().subdistrict_code).toBe("830108"))
    await pick(user, "ตำบล", "เกาะแก้ว")
    await waitFor(() =>
      expect(value()).toMatchObject({
        subdistrict_code: "830103",
        postal_code: null,
      })
    )
    const group = screen.getByRole("radiogroup", {
      name: "รหัสไปรษณีย์ของพื้นที่นี้",
    })
    await user.click(within(group).getByRole("radio", { name: "83200" }))
    expect(value().postal_code).toBe("83200")
  })

  it("“ล้าง” clears all four values", async () => {
    const { user, value } = renderForm()
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "83100")
    await waitFor(() => expect(value().subdistrict_code).toBe("830108"))
    await user.click(screen.getByRole("button", { name: "ล้าง" }))
    expect(value()).toEqual({
      province_code: null,
      district_code: null,
      subdistrict_code: null,
      postal_code: null,
    })
    expect(screen.getByLabelText("รหัสไปรษณีย์")).toHaveValue("")
  })
})
