export type NavItem = { href: string; th: string; en: string }
export type NavGroup = { th: string; en: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    th: "เริ่มต้น",
    en: "Getting started",
    items: [
      { href: "/docs/installation", th: "ติดตั้ง", en: "Installation" },
      { href: "/docs/dataset", th: "ชุดข้อมูล", en: "Dataset" },
    ],
  },
  {
    th: "ตัวอย่าง",
    en: "Examples",
    items: [
      {
        href: "/examples/postal-first",
        th: "เริ่มจากรหัสไปรษณีย์",
        en: "Postal code first",
      },
      {
        href: "/examples/area-first",
        th: "เลือกพื้นที่ก่อน",
        en: "Area first",
      },
      {
        href: "/examples/search",
        th: "ช่องค้นหาเดียว",
        en: "Single search box",
      },
      {
        href: "/examples/multiple",
        th: "หลายที่อยู่",
        en: "Multiple addresses",
      },
      {
        href: "/examples/facility-unknown",
        th: "รหัสหน่วยงานและรหัสที่ไม่พบ",
        en: "Facility and unknown codes",
      },
      {
        href: "/examples/react-hook-form",
        th: "ใช้กับ react-hook-form",
        en: "With react-hook-form",
      },
    ],
  },
  {
    th: "อ้างอิง",
    en: "Reference",
    items: [
      {
        href: "/reference/address-form",
        th: "<AddressForm>",
        en: "<AddressForm>",
      },
      {
        href: "/reference/core",
        th: "@farzai/thailand-address",
        en: "@farzai/thailand-address",
      },
      {
        href: "/reference/laravel",
        th: "ตรวจใน Laravel",
        en: "Validate in Laravel",
      },
      { href: "/llms.txt", th: "llms.txt", en: "llms.txt" },
    ],
  },
]

/** The docs pages in reading order: every sidebar link except llms.txt. */
export const PAGES: NavItem[] = NAV.flatMap((g) => g.items).filter(
  (i) => !i.href.endsWith(".txt")
)

/** The pages before and after `path` in reading order. */
export function neighbours(path: string): {
  prev: NavItem | null
  next: NavItem | null
} {
  const i = PAGES.findIndex((p) => p.href === path)
  if (i < 0) return { prev: null, next: null }
  return { prev: PAGES[i - 1] ?? null, next: PAGES[i + 1] ?? null }
}

/** The sidebar group `path` belongs to, if it is a docs page. */
export const groupOf = (path: string): NavGroup | undefined =>
  NAV.find((g) => g.items.some((i) => i.href === path))
