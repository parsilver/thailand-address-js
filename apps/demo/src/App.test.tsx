import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "./App"
import { NAV } from "./site/nav"

const pages = NAV.flatMap((g) => g.items).filter(
  (i) => !i.href.endsWith(".txt")
)

describe("every page in the sidebar renders its title", () => {
  it.each(pages)("$href", async ({ href, th }) => {
    window.history.pushState({}, "", href)
    localStorage.setItem("thailand-address-demo:locale", "th")
    render(<App />)
    const title = th === "ภาพรวม" ? "ฟอร์มที่อยู่ไทย" : th
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: title },
        { timeout: 5000 }
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute(
      "href",
      href
    )
  })

  it("an unknown path says so", async () => {
    window.history.pushState({}, "", "/nope")
    render(<App />)
    expect(
      await screen.findByRole("heading", { level: 1, name: "ไม่พบหน้านี้" })
    ).toBeInTheDocument()
  })

  it("?lang=en switches the site to English", async () => {
    window.history.pushState({}, "", "/?lang=en")
    render(<App />)
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Thai address form",
      })
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe("en")
  })
})
