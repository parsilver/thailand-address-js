import { SNAPSHOT } from "@farzai/thailand-address"

import { CodeBlock } from "@/site/code-block"
import { useT } from "@/lib/locale"
import { DATA_BASE, DATA_DOCS, INSTALL } from "@/lib/site"

import { Page, Prose, Section } from "./page"

const USAGE = `import * as React from "react"
import { AddressForm, type AddressValue } from "@/components/address-form/address-form"

const EMPTY: AddressValue = {
  province_code: null,
  district_code: null,
  subdistrict_code: null,
  postal_code: null,
}

export function Checkout() {
  const [shipping, setShipping] = React.useState(EMPTY)
  return (
    <form action="/checkout" method="post">
      <AddressForm name="shipping" value={shipping} onChange={setShipping} required />
      <button type="submit">Place order</button>
    </form>
  )
}`

export function InstallationPage() {
  const t = useT()
  return (
    <Page
      title={String(t("ติดตั้ง", "Installation"))}
      lead={t(
        "ติดตั้งด้วย shadcn CLI ไฟล์ของคอมโพเนนต์จะอยู่ในโปรเจกต์ของคุณ แก้ได้ตามต้องการ",
        "Install with the shadcn CLI. The component's files land in your project, yours to change."
      )}
    >
      <Section title={t("shadcn CLI", "shadcn CLI")}>
        <CodeBlock label="shadcn" code={INSTALL} />
        <Prose>
          <p>
            {t(
              "คำสั่งนี้วางไฟล์ไว้ที่ components/address-form/ ติดตั้งแพ็กเกจ @farzai/thailand-address และ lucide-react และเพิ่มคอมโพเนนต์ shadcn ที่ใช้ ได้แก่ field, label, input, button, popover, command, drawer, radio-group, toggle-group, checkbox และ alert",
              "It puts the files in components/address-form/, installs @farzai/thailand-address and lucide-react, and adds the shadcn components it uses: field, label, input, button, popover, command, drawer, radio-group, toggle-group, checkbox and alert."
            )}
          </p>
          <p>
            {t(
              "ต้องใช้ React 19 และโปรเจกต์ที่ตั้งค่า shadcn/ui ไว้แล้ว (Tailwind v4)",
              "It needs React 19 and a project already set up for shadcn/ui (Tailwind v4)."
            )}
          </p>
        </Prose>
      </Section>
      <Section title={t("ใช้งาน", "Use it")}>
        <CodeBlock label="TSX" code={USAGE} />
        <Prose>
          <p>
            {t(
              "ฟอร์มส่งรหัสสี่ค่าเป็น shipping[province_code], shipping[district_code], shipping[subdistrict_code] และ shipping[postal_code] บ้านเลขที่ ถนน และชื่อผู้รับเป็นช่องของแอปคุณเอง",
              "The form posts four codes as shipping[province_code], shipping[district_code], shipping[subdistrict_code] and shipping[postal_code]. The house number, street and recipient's name stay as your app's own fields."
            )}
          </p>
        </Prose>
      </Section>
      <Section title={t("แพ็กเกจหลักบน npm", "The core package on npm")}>
        <CodeBlock label="npm" code="npm install @farzai/thailand-address" />
        <Prose>
          <p>
            {t(
              "ใช้ได้โดยไม่ต้องมี React เช่น ใน Node, Workers หรือหน้าเว็บธรรมดา ดู ",
              "It works without React too: in Node, Workers or a plain page. See "
            )}
            <a href="/reference/core">{t("เอกสารอ้างอิง", "the reference")}</a>.
          </p>
        </Prose>
      </Section>
    </Page>
  )
}

export function DatasetPage() {
  const t = useT()
  const files = [
    [
      "index/postal_codes.json",
      t(
        "รหัสไปรษณีย์ไปยังตำบล โหลดเมื่อใช้รหัสไปรษณีย์ครั้งแรก",
        "Postal code to subdistricts. Loaded on the first postal code."
      ),
    ],
    [
      "by-province/<code>.json",
      t(
        "ชื่ออำเภอ ตำบล และรหัสไปรษณีย์ของจังหวัดเดียว โหลดเมื่อเลือกจังหวัดนั้น",
        "One province's districts, subdistricts and postal codes. Loaded when that province is used."
      ),
    ],
    ["provinces.json", t("77 จังหวัด", "The 77 provinces.")],
    [
      "districts.json, subdistricts.json",
      t(
        "ทุกชื่อ โหลดเฉพาะเมื่อใช้ช่องค้นหา",
        "Every name. Loaded only for the search box."
      ),
    ],
  ] as const
  return (
    <Page
      title={String(t("ชุดข้อมูล", "Dataset"))}
      lead={t(
        "ข้อมูลจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์ จากแหล่งทางการ เผยแพร่เป็น snapshot ที่ไม่เปลี่ยนแปลง",
        "Provinces, districts, subdistricts and postal codes from official sources, published as snapshots that never change."
      )}
    >
      <Section title={t("snapshot ที่ล็อกไว้", "The pinned snapshot")}>
        <Prose>
          <p>
            {t(
              "แพ็กเกจแต่ละเวอร์ชันล็อก snapshot เดียว ตอนนี้คือ ",
              "Each package version pins one snapshot, currently "
            )}
            <code>{SNAPSHOT}</code>.{" "}
            {t(
              "ไฟล์ของ snapshot ไม่เปลี่ยนเลยหลังเผยแพร่ ผลการค้นหาจึงเหมือนเดิมทุกครั้ง snapshot ใหม่มากับแพ็กเกจเวอร์ชันใหม่ อย่าใช้ latest.json ในโค้ด",
              "A snapshot's files never change once published, so a lookup gives the same answer every time. A new snapshot ships as a new package version. Never build on latest.json."
            )}
          </p>
          <p>
            <a href={DATA_BASE + "/"}>{DATA_BASE}/</a>
          </p>
        </Prose>
      </Section>
      <Section title={t("ไฟล์ที่หน้าเว็บโหลด", "The files a page loads")}>
        <ul className="flex flex-col divide-y border-b text-sm">
          {files.map(([f, d]) => (
            <li
              key={f}
              className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-4"
            >
              <code className="shrink-0 font-mono sm:w-64">{f}</code>
              <span className="text-muted-foreground">{d}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t("กติกาที่ต้องรู้", "Rules to know")}>
        <Prose>
          <ul>
            <li>
              {t(
                "รหัสเป็นสตริงเสมอ เลขศูนย์นำหน้าและความยาวมีความหมาย",
                "Codes are strings. Leading zeros and widths matter."
              )}
            </li>
            <li>
              {t(
                "อย่าเดารหัสไปรษณีย์จากรหัสอำเภอหรือจังหวัด ใช้เฉพาะความเชื่อมโยงในชุดข้อมูล",
                "Never guess a postal code from a district or province code. Use only the links in the dataset."
              )}
            </li>
            <li>
              {t(
                "ตำบลหนึ่งอาจมีหลายรหัสไปรษณีย์ (เช่น เกาะแก้ว 83000 และ 83200) ให้ผู้ใช้เลือก อย่าเลือกแทน",
                "A subdistrict can have several postal codes (Ko Kaeo: 83000 and 83200). Let the user choose; never pick one."
              )}
            </li>
            <li>
              {t(
                "รหัสหน่วยงาน (เช่น 10001 ศูนย์ไปรษณีย์สุวรรณภูมิ) ไม่ใช่รหัสของที่อยู่ทั่วไป ฟอร์มซ่อนไว้เป็นค่าเริ่มต้น",
                "Facility codes (10001, Suvarnabhumi Mail Center) are not for ordinary addresses. The form hides them by default."
              )}
            </li>
            <li>
              {t(
                "null แปลว่าไม่ทราบ ไม่ใช่ว่าง",
                "null means unknown, not empty."
              )}
            </li>
          </ul>
          <p>
            <a href={DATA_DOCS}>
              {t(
                "คำอธิบายฉบับเต็มและแหล่งที่มา",
                "The full contract and its sources"
              )}
            </a>
          </p>
        </Prose>
      </Section>
    </Page>
  )
}
