import { SNAPSHOT } from "@farzai/thailand-address"

import { CodeBlock } from "@/site/code-block"
import { useT } from "@/lib/locale"
import { laravelRules } from "@/lib/payload"
import { LARAVEL_PACKAGE } from "@/lib/site"

import { Page, Prose, Section } from "./page"

type Row = [name: string, type: string, def: string, th: string, en: string]

function PropsTable({ rows, caption }: { rows: Row[]; caption: string }) {
  const t = useT()
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b bg-muted/40">
          <tr>
            <th scope="col" className="p-3 font-medium">
              {t("พร็อพ", "Prop")}
            </th>
            <th scope="col" className="p-3 font-medium">
              {t("ชนิด", "Type")}
            </th>
            <th scope="col" className="p-3 font-medium">
              {t("ค่าเริ่มต้น", "Default")}
            </th>
            <th scope="col" className="p-3 font-medium">
              {t("ทำอะไร", "What it does")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(([name, type, def, th, en]) => (
            <tr key={name} className="align-top">
              <th
                scope="row"
                className="p-3 font-mono font-normal whitespace-nowrap"
              >
                {name}
              </th>
              <td className="p-3 font-mono text-[13px] text-muted-foreground">
                {type}
              </td>
              <td className="p-3 font-mono text-[13px] text-muted-foreground">
                {def}
              </td>
              <td className="min-w-64 p-3">{t(th, en)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const FORM_PROPS: Row[] = [
  [
    "name",
    "string",
    "—",
    "นำหน้าชื่อ hidden input เช่น shipping[province_code] ฟอร์ม HTML ธรรมดาจึงส่งรหัสได้",
    "Prefixes the hidden inputs, e.g. shipping[province_code], so a plain HTML form posts the codes.",
  ],
  [
    "value",
    "AddressValue",
    "—",
    "รหัสสี่ค่า ระดับที่ยังไม่ได้เลือกเป็น null",
    "The four codes. An unset level is null.",
  ],
  [
    "onChange",
    "(value) => void",
    "—",
    "เรียกทุกครั้งที่รหัสเปลี่ยน",
    "Called whenever a code changes.",
  ],
  [
    "defaultValue",
    "AddressValue",
    "all null",
    "ค่าเริ่มต้นเมื่อไม่ได้ควบคุมจากภายนอก",
    "The starting value when uncontrolled.",
  ],
  [
    "locale",
    '"th" | "en"',
    '"th"',
    "ภาษาของป้าย ชื่อ และข้อความประกาศ เปลี่ยนแล้วรหัสไม่หาย",
    "Language of labels, names and announcements. Switching keeps the codes.",
  ],
  [
    "mode",
    '"postal-first" | "area-first" | "search"',
    '"postal-first"',
    "เริ่มจากรหัสไปรษณีย์ เลือกพื้นที่ก่อน หรือช่องค้นหาเดียว",
    "Postal code first, area first, or one search box.",
  ],
  [
    "showFacilityCodes",
    "boolean",
    "false",
    "ใช้รหัสหน่วยงาน เช่น 10001 เหมือนรหัสทั่วไป",
    "Treats facility codes such as 10001 like ordinary codes.",
  ],
  [
    "required",
    "boolean",
    "false",
    "ต้องกรอกครบจึงส่งได้ ถ้าไม่ required ฟอร์มว่างส่งได้ แต่ที่อยู่ครึ่งๆ กลางๆ ส่งไม่ได้",
    "Every field is needed to submit. Otherwise an empty address submits and a partial one does not.",
  ],
  [
    "legend",
    "ReactNode",
    "ที่อยู่จัดส่ง",
    "หัวข้อ legend ของ fieldset",
    "The fieldset's legend.",
  ],
  ["disabled", "boolean", "false", "ปิดทุกช่อง", "Disables every control."],
  [
    "id",
    "string",
    "generated",
    "ฐานของ id ในฟอร์ม รหัสไปรษณีย์คือ {id}-postal",
    "Base for element ids; the postal code is {id}-postal.",
  ],
  [
    "client",
    "ThaiAddress",
    "shared",
    "client จาก createThaiAddress() เช่น เพื่อใช้โฮสต์ข้อมูลอื่น",
    "A createThaiAddress() client, e.g. for another data host.",
  ],
]

const SAME_AS_PROPS: Row[] = [
  [
    "source",
    "AddressValue",
    "—",
    "ที่อยู่ที่จะใช้ตาม เช่น ที่อยู่จัดส่ง",
    "The address to follow, e.g. shipping.",
  ],
  [
    "value, onChange",
    "AddressValue",
    "—",
    "ที่อยู่ที่สอง ขณะติ๊กไว้จะเท่ากับ source เสมอ",
    "The second address. While ticked it equals source.",
  ],
  [
    "name",
    "string",
    "—",
    "ส่ง hidden input ของรหัสขณะติ๊กไว้",
    "Posts the codes as hidden inputs while ticked.",
  ],
  [
    "children",
    "(field) => ReactNode",
    "—",
    "ฟอร์มที่จะแสดงเมื่อเลิกติ๊ก กระจาย field ลงใน <AddressForm>",
    "The form to show when unticked. Spread field onto an <AddressForm>.",
  ],
  ["defaultChecked, label, description, locale, client", "", "true", "", ""],
]

export function AddressFormReferencePage() {
  const t = useT()
  return (
    <Page
      title="<AddressForm>"
      lead={t(
        "พร็อพของ <AddressForm> และ <AddressSameAs>",
        "Props of <AddressForm> and <AddressSameAs>."
      )}
    >
      <Section title="<AddressForm>">
        <PropsTable caption="AddressForm props" rows={FORM_PROPS} />
      </Section>
      <Section title="<AddressSameAs>">
        <PropsTable caption="AddressSameAs props" rows={SAME_AS_PROPS} />
      </Section>
      <Section title={t("การตรวจตอนส่งฟอร์ม", "Validation on submit")}>
        <Prose>
          <p>
            {t(
              "ฟอร์มตรวจเฉพาะตอนส่ง ไม่ตรวจระหว่างพิมพ์ ถ้าไม่ผ่าน ฟอร์มจะหยุดการส่ง แสดงข้อความ ใส่ aria-invalid และย้ายโฟกัสไปช่องแรกที่ผิด ใช้ได้ทั้งฟอร์ม HTML และ react-hook-form",
              "It checks on submit only, never mid-typing. An invalid address stops the submit, shows its messages, sets aria-invalid and focuses the first invalid field. It works for a plain form and for react-hook-form."
            )}
          </p>
        </Prose>
      </Section>
    </Page>
  )
}

const CORE_EXAMPLE = `import { createThaiAddress, formatAddress } from "@farzai/thailand-address"

const ta = createThaiAddress() // pinned to snapshot ${SNAPSHOT}

const r = await ta.lookupPostalCode("10200")
// { status: "found", shape: "one_district", areas: [...12 khwaeng], ... }

const hits = await ta.search("บางรัก")
const codes = await ta.postalCodesOf("830103") // Ko Kaeo: 83000, 83200
const check = await ta.validate({
  province_code: "83", district_code: "8301", subdistrict_code: "830108", postal_code: "83100",
}) // { valid: true, errors: [] }`

const CORE_API: [string, string, string][] = [
  ["provinces()", "77 จังหวัดที่ใช้อยู่", "The 77 active provinces."],
  [
    "districts(provinceCode)",
    "อำเภอหรือเขตของจังหวัด",
    "A province's districts.",
  ],
  [
    "subdistricts(districtCode)",
    "ตำบลหรือแขวงของอำเภอ",
    "A district's subdistricts.",
  ],
  [
    "resolve(subdistrictCode)",
    "ตำบลพร้อมอำเภอและจังหวัด",
    "A subdistrict with its district and province.",
  ],
  [
    "postalCodesOf(subdistrictCode)",
    "รหัสไปรษณีย์ทั้งหมดของตำบล พร้อม coverage",
    "Every postal code of a subdistrict, with its coverage.",
  ],
  [
    "lookupPostalCode(input)",
    "incomplete, not_found, facility หรือ found พร้อม shape",
    "incomplete, not_found, facility, or found with a shape.",
  ],
  [
    "search(query)",
    "ค้นหาไทยหรืออังกฤษ ได้สูงสุด 8 รายการ",
    "Thai or English, up to 8 hits.",
  ],
  [
    "validate(value)",
    "required, unknown หรือ mismatch ต่อฟิลด์",
    "required, unknown or mismatch per field.",
  ],
  ["preload(what)", "โหลดข้อมูลไว้ก่อน", "Fetch the data ahead of use."],
  [
    "formatAddress(area, locale)",
    "ที่อยู่บรรทัดเดียว",
    "The one-line address.",
  ],
]

export function CoreReferencePage() {
  const t = useT()
  return (
    <Page
      title="@farzai/thailand-address"
      lead={t(
        "แพ็กเกจ TypeScript ที่ฟอร์มใช้ ไม่ขึ้นกับเฟรมเวิร์ก ไม่มี dependency และโหลดข้อมูลเฉพาะที่ต้องใช้",
        "The TypeScript package the form is built on. Framework-agnostic, no dependencies, and it loads only the data a call needs."
      )}
    >
      <CodeBlock label="TypeScript" code={CORE_EXAMPLE} />
      <Section title="API">
        <ul className="flex flex-col divide-y rounded-xl border text-sm">
          {CORE_API.map(([sig, th, en]) => (
            <li
              key={sig}
              className="flex flex-col gap-0.5 p-3 sm:flex-row sm:gap-4"
            >
              <code className="shrink-0 font-mono sm:w-72">{sig}</code>
              <span className="text-muted-foreground">{t(th, en)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  )
}

const RULE_OBJECTS = `use Illuminate\\Validation\\Rule;

$request->validate([
    'shipping.province_code'    => ['required', Rule::thaiProvince()],
    'shipping.district_code'    => ['required', Rule::thaiDistrict()->inProvince('shipping.province_code')],
    'shipping.subdistrict_code' => ['required', Rule::thaiSubdistrict()->inDistrict('shipping.district_code')],
    'shipping.postal_code'      => ['required', Rule::thaiPostalCode()->forSubdistrict('shipping.subdistrict_code')],
]);`

export function LaravelPage() {
  const t = useT()
  return (
    <Page
      title={String(t("ตรวจใน Laravel", "Validate in Laravel"))}
      lead={t(
        "ตรวจรหัสที่ฟอร์มส่งมาด้วยแพ็กเกจ farzai/thailand-address ซึ่งเช็กว่าแต่ละระดับอยู่ในระดับที่สูงกว่าจริง",
        "Check the codes the form posts with the farzai/thailand-address package, which also checks that each level sits inside the one above."
      )}
    >
      <CodeBlock
        label="composer"
        code="composer require farzai/thailand-address"
      />
      <Section title={t("กฎแบบสตริง", "String rules")}>
        <CodeBlock label="PHP" code={laravelRules(["shipping"])} />
      </Section>
      <Section title={t("กฎแบบออบเจกต์", "Rule objects")}>
        <CodeBlock label="PHP" code={RULE_OBJECTS} />
      </Section>
      <Section
        title={t(
          "ตำบลที่ไม่มีรหัสไปรษณีย์",
          "Subdistricts with no postal code"
        )}
      >
        <Prose>
          <p>
            {t(
              "ราว 50 ตำบลในชุดข้อมูลยังไม่มีรหัสไปรษณีย์ที่ทราบ ฟอร์มยอมให้รหัสไปรษณีย์ว่างได้สำหรับตำบลเหล่านี้ แต่กฎด้านบนใช้ required กับ postal_code จึงจะปฏิเสธที่อยู่นั้น ถ้าต้องการรับที่อยู่แบบนี้ ให้เปลี่ยน required เป็น nullable สำหรับ postal_code แล้วตรวจเองว่าตำบลนั้นไม่มีรหัสจริง",
              "About 50 subdistricts in the dataset have no known postal code. The form accepts an empty postal code for them, but the rules above put required on postal_code, so the server rejects that address. To accept it, use nullable instead of required for postal_code, and check yourself that the subdistrict really has no code."
            )}
          </p>
        </Prose>
      </Section>
      <Section
        title={t("ข้อความของฟอร์มกับกฎ", "The form's messages and the rules")}
      >
        <Prose>
          <p>
            {t(
              "“รหัสไปรษณีย์นี้ไม่ตรงกับตำบล/แขวงที่เลือก” ในฟอร์มคือความหมายเดียวกับ thai_postal_code:…subdistrict_code ฝั่งเซิร์ฟเวอร์ ฟอร์มช่วยผู้ใช้ เซิร์ฟเวอร์ยังต้องตรวจเสมอ",
              "The form's “This postal code doesn't serve the selected subdistrict” means the same as thai_postal_code:…subdistrict_code on the server. The form helps the user; the server must still check."
            )}
          </p>
          <p>
            <a href={LARAVEL_PACKAGE}>farzai/thailand-address</a>
          </p>
        </Prose>
      </Section>
    </Page>
  )
}
