import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import type { AddressValue } from "@farzai/thailand-address"

import { AddressForm } from "@/registry/address-form/address-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { CodeBlock } from "@/site/code-block"
import { LiveDemo } from "@/site/live-demo"
import { useLocale, useT } from "@/lib/locale"

import { Page, Prose, Section } from "./page"

const SNIPPETS = {
  postal: `<AddressForm name="shipping" value={shipping} onChange={setShipping} required />`,
  area: `<AddressForm name="shipping" mode="area-first" value={shipping} onChange={setShipping} />`,
  search: `<AddressForm name="shipping" mode="search" value={shipping} onChange={setShipping} />`,
  multiple: `<AddressForm name="shipping" value={shipping} onChange={setShipping} required />

<AddressSameAs name="tax" source={shipping} value={tax} onChange={setTax}>
  {(field) => <AddressForm name="tax" legend="ที่อยู่ใบกำกับภาษี" {...field} />}
</AddressSameAs>`,
  facility: `<AddressForm name="shipping" showFacilityCodes value={shipping} onChange={setShipping} />`,
  rhf: `import { Controller, useForm } from "react-hook-form"

type Values = { shipping: AddressValue }

const { control, handleSubmit } = useForm<Values>({ defaultValues: { shipping: EMPTY } })

<form onSubmit={handleSubmit((data) => save(data))}>
  <Controller
    control={control}
    name="shipping"
    render={({ field }) => (
      <AddressForm value={field.value} onChange={field.onChange} required />
    )}
  />
  <button type="submit">Save</button>
</form>`,
}

/**
 * An example page body: the demo (form, then what it sends), an optional
 * "try" section, then the code.
 */
function Example({
  code,
  tryTitle,
  tryThis,
  children,
}: {
  code: string
  tryTitle?: React.ReactNode
  tryThis?: React.ReactNode
  children: React.ReactNode
}) {
  const t = useT()
  return (
    <>
      {children}
      {tryThis ? (
        <Section title={tryTitle ?? t("ลองรหัสเหล่านี้", "Try these codes")}>
          <Prose>{tryThis}</Prose>
        </Section>
      ) : null}
      <Section title={t("โค้ด", "Code")}>
        <CodeBlock label="TSX" code={code} />
      </Section>
    </>
  )
}

export function PostalFirstPage() {
  const t = useT()
  return (
    <Page
      title={String(t("เริ่มจากรหัสไปรษณีย์", "Postal code first"))}
      lead={t(
        "รูปแบบเริ่มต้น พิมพ์รหัส 5 หลักแล้วฟอร์มเติมส่วนที่เหลือ ช่องอื่นมีไว้ยืนยันหรือแก้",
        "The default. Type the 5 digits and the form fills in the rest; every other field confirms or corrects it."
      )}
    >
      <Example
        code={SNIPPETS.postal}
        tryThis={
          <ul>
            <li>
              {t(
                "83100 ตำบลเดียว เติมครบทุกช่อง",
                "83100: one subdistrict, so every field fills."
              )}
            </li>
            <li>
              {t(
                "10200 มี 12 แขวงในเขตเดียว เติมจังหวัดและเขต แล้วให้เลือกแขวง",
                "10200: 12 khwaeng in one khet. Province and district fill; you pick the khwaeng."
              )}
            </li>
            <li>
              {t(
                "13240 ครอบคลุม 2 จังหวัด ให้เลือกพื้นที่จากรายการเดียว",
                "13240: two provinces. One list to pick the area from."
              )}
            </li>
          </ul>
        }
      >
        <LiveDemo mode="postal-first" layout="stacked" id="demo" />
      </Example>
    </Page>
  )
}

export function AreaFirstPage() {
  const t = useT()
  return (
    <Page
      title={String(t("เลือกพื้นที่ก่อน", "Area first"))}
      lead={t(
        "เลือกจังหวัด อำเภอ แล้วตำบล รหัสไปรษณีย์ตามมาเอง ถ้าตำบลมีหลายรหัสจะให้เลือก",
        "Pick the province, district, then subdistrict; the postal code follows. A subdistrict with several codes asks which one."
      )}
    >
      <Example
        code={SNIPPETS.area}
        tryTitle={t("ลองดู", "Try this")}
        tryThis={
          <p>
            {t(
              "ลอง ภูเก็ต › เมืองภูเก็ต › เกาะแก้ว ซึ่งมีรหัส 83000 และ 83200",
              "Try Phuket › Mueang Phuket › Ko Kaeo, which has 83000 and 83200."
            )}
          </p>
        }
      >
        <LiveDemo mode="area-first" layout="stacked" id="demo" />
      </Example>
    </Page>
  )
}

export function SearchPage() {
  const t = useT()
  return (
    <Page
      title={String(t("ช่องค้นหาเดียว", "Single search box"))}
      lead={t(
        "พิมพ์ชื่อตำบล อำเภอ จังหวัด หรือรหัสไปรษณีย์ ภาษาไทยหรืออังกฤษก็ได้ ไม่ต้องพิมพ์ ต./อ./จ.",
        "Type a subdistrict, district, province or postal code, in Thai or English. No need for ต./อ./จ."
      )}
    >
      <Example code={SNIPPETS.search}>
        <LiveDemo mode="search" layout="stacked" id="demo" />
      </Example>
    </Page>
  )
}

export function MultiplePage() {
  const t = useT()
  return (
    <Page
      title={String(t("หลายที่อยู่", "Multiple addresses"))}
      lead={t(
        "ที่อยู่ใบกำกับภาษีใช้ที่อยู่จัดส่งเป็นค่าเริ่มต้น เลิกเลือกเพื่อคัดลอกมาแก้ ทั้งสองที่อยู่ถูกส่งครบเสมอ",
        "The tax invoice address follows the shipping address by default. Untick to copy it in and edit. Both are always posted in full."
      )}
    >
      <Example code={SNIPPETS.multiple}>
        <LiveDemo mode="multiple" layout="stacked" id="demo" />
      </Example>
    </Page>
  )
}

export function FacilityUnknownPage() {
  const t = useT()
  const [show, setShow] = React.useState(false)
  return (
    <Page
      title={String(
        t("รหัสหน่วยงานและรหัสที่ไม่พบ", "Facility and unknown codes")
      )}
      lead={t(
        "10001 เป็นรหัสของศูนย์ไปรษณีย์ ไม่ใช่ของที่อยู่ 99999 ไม่มีอยู่จริง ทั้งสองกรณีฟอร์มบอกให้รู้และยังเลือกพื้นที่เองได้",
        "10001 belongs to a mail centre, not an address, and 99999 doesn't exist. Either way the form says so and manual selection still works."
      )}
    >
      <Example
        code={SNIPPETS.facility}
        tryTitle={t("ลองดู", "Try this")}
        tryThis={
          <p>
            {t(
              "พิมพ์ 99999 แล้วเลือก ภูเก็ต › เมืองภูเก็ต › กะรน ฟอร์มจะบอกว่าตำบลกะรนใช้รหัส 83100 และให้กดใช้รหัสนั้นได้",
              "Type 99999, then pick Phuket › Mueang Phuket › Karon. The form says Karon uses 83100 and offers it."
            )}
          </p>
        }
      >
        <div className="flex flex-col gap-8">
          <Field orientation="horizontal">
            <Checkbox
              id="show-facility"
              checked={show}
              onCheckedChange={(v) => setShow(v === true)}
            />
            <FieldLabel htmlFor="show-facility">
              {t("แสดงรหัสไปรษณีย์ของหน่วยงาน", "Show facility postal codes")}
            </FieldLabel>
          </Field>
          <LiveDemo
            key={String(show)}
            mode="postal-first"
            showFacilityCodes={show}
            layout="stacked"
            id="demo"
          />
        </div>
      </Example>
    </Page>
  )
}

const EMPTY: AddressValue = {
  province_code: null,
  district_code: null,
  subdistrict_code: null,
  postal_code: null,
}

function RhfDemo() {
  const { locale } = useLocale()
  const t = useT()
  const [saved, setSaved] = React.useState<string | null>(null)
  const { control, handleSubmit } = useForm<{ shipping: AddressValue }>({
    defaultValues: { shipping: EMPTY },
  })
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit((data) => setSaved(JSON.stringify(data, null, 2)))}
    >
      <Controller
        control={control}
        name="shipping"
        render={({ field }) => (
          <AddressForm
            locale={locale}
            value={field.value}
            onChange={field.onChange}
            required
          />
        )}
      />
      <Button type="submit" className="self-end">
        {t("บันทึก", "Save")}
      </Button>
      {saved ? (
        <CodeBlock
          label={String(
            t("ข้อมูลที่ handleSubmit ได้รับ", "What handleSubmit received")
          )}
          code={saved}
        />
      ) : null}
    </form>
  )
}

export function ReactHookFormPage() {
  const t = useT()
  return (
    <Page
      title={String(t("ใช้กับ react-hook-form", "With react-hook-form"))}
      lead={t(
        "ใช้เป็นฟิลด์แบบ controlled ผ่าน Controller ถ้าที่อยู่ยังไม่ครบ ฟอร์มจะหยุดการส่งก่อน handleSubmit ทำงาน",
        "Use it as a controlled field through Controller. An incomplete address stops the submit before handleSubmit runs."
      )}
    >
      <Example code={SNIPPETS.rhf}>
        <RhfDemo />
      </Example>
    </Page>
  )
}
