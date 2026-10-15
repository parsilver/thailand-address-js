import { fireEvent, render, screen, within } from "@testing-library/react"
import { SNAPSHOT } from "@farzai/thailand-address"
import { beforeEach, describe, expect, it } from "vitest"

import App from "./App"
import { PAGES } from "./site/nav"

const HOME_TITLE = "ฟอร์มที่อยู่ไทย ที่เริ่มจากรหัสไปรษณีย์"

function open(path: string) {
  window.history.pushState({}, "", path)
  render(<App />)
}

beforeEach(() => {
  localStorage.setItem("thailand-address-demo:locale", "th")
})

describe("every docs page renders its title and marks itself in the sidebar", () => {
  it.each(PAGES)("$href", async ({ href, th }) => {
    open(href)
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: th },
        { timeout: 5000 }
      )
    ).toBeInTheDocument()
    const sidebar = screen.getByRole("navigation", { name: "เอกสาร" })
    expect(
      within(sidebar).getByRole("link", { current: "page" })
    ).toHaveAttribute("href", href)
  })
})

describe("home", () => {
  it("has the hero, the install line and no docs sidebar", async () => {
    open("/")
    expect(
      await screen.findByRole("heading", { level: 1, name: HOME_TITLE })
    ).toBeInTheDocument()
    const install = screen.getByLabelText("คำสั่งติดตั้ง")
    expect(install).toHaveTextContent(
      "npx shadcn@latest add https://thailand-address-demo.farzai.com/r/address-form.json"
    )
    expect(
      within(install.parentElement!).getByRole("button", { name: "คัดลอก" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("navigation", { name: "เอกสาร" })
    ).not.toBeInTheDocument()
  })

  it("switches the four form modes with tabs", async () => {
    open("/")
    const tabs = await screen.findByRole("tablist", { name: "รูปแบบฟอร์ม" })
    expect(
      within(tabs)
        .getAllByRole("tab")
        .map((t) => t.textContent)
    ).toEqual([
      "เริ่มจากรหัสไปรษณีย์",
      "เลือกพื้นที่ก่อน",
      "ค้นหา",
      "หลายที่อยู่",
    ])
  })
})

describe("chrome", () => {
  it("one language button names the other language and switches to it", async () => {
    open("/")
    await screen.findByRole("heading", { level: 1, name: HOME_TITLE })
    fireEvent.click(screen.getByRole("button", { name: "English" }))
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "A Thai address form that starts from the postal code",
      })
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe("en")
    expect(screen.getByRole("button", { name: "ภาษาไทย" })).toHaveTextContent(
      "ไทย"
    )
  })

  it("the top bar marks the section of the current page", async () => {
    open("/reference/core")
    await screen.findByRole("heading", { level: 1 })
    const main = screen.getByRole("navigation", { name: "เมนูหลัก" })
    expect(within(main).getByRole("link", { name: "เอกสาร" })).toHaveAttribute(
      "aria-current",
      "true"
    )
    expect(
      within(main).getByRole("link", { name: "ตัวอย่าง" })
    ).not.toHaveAttribute("aria-current")
  })

  it("every page ends with the dataset line", async () => {
    open("/docs/dataset")
    await screen.findByRole("heading", { level: 1 })
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      `ข้อมูลล็อกไว้ที่ snapshot ${SNAPSHOT} · DOPA, ไปรษณีย์ไทย, MDES (CC-BY)`
    )
  })
})

describe("prev and next", () => {
  it("links the neighbouring pages in sidebar order", async () => {
    open("/examples/postal-first")
    await screen.findByRole("heading", { level: 1 })
    const pager = screen.getByRole("navigation", { name: "ก่อนหน้าและถัดไป" })
    expect(
      within(pager).getByRole("link", { name: /ก่อนหน้า.*ชุดข้อมูล/ })
    ).toHaveAttribute("href", "/docs/dataset")
    expect(
      within(pager).getByRole("link", { name: /ถัดไป.*เลือกพื้นที่ก่อน/ })
    ).toHaveAttribute("href", "/examples/area-first")
  })

  it("the first page has no previous link", async () => {
    open("/docs/installation")
    await screen.findByRole("heading", { level: 1 })
    const pager = screen.getByRole("navigation", { name: "ก่อนหน้าและถัดไป" })
    expect(within(pager).getAllByRole("link")).toHaveLength(1)
  })
})

describe("reference tables", () => {
  it("put the default under the description, in three columns", async () => {
    open("/reference/address-form")
    const table = await screen.findByRole(
      "table",
      { name: "AddressForm props" },
      { timeout: 5000 }
    )
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3)
    const locale = within(table).getByRole("rowheader", { name: "locale" })
    expect(locale.closest("tr")).toHaveTextContent('ค่าเริ่มต้น "th"')
  })
})

describe("routing", () => {
  it("an unknown path says so", async () => {
    open("/nope")
    expect(
      await screen.findByRole("heading", { level: 1, name: "ไม่พบหน้านี้" })
    ).toBeInTheDocument()
  })

  it("?lang=en switches the site to English", async () => {
    open("/?lang=en")
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "A Thai address form that starts from the postal code",
      })
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe("en")
  })
})
