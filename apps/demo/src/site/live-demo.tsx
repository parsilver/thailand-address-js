import * as React from "react"
import type { AddressValue } from "@farzai/thailand-address"

import {
  AddressForm,
  type AddressFormMode,
} from "@/registry/address-form/address-form"
import { AddressSameAs } from "@/registry/address-form/address-same-as"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLocale, useT } from "@/lib/locale"
import { SAMPLES, SEARCH_SAMPLES } from "@/lib/site"

import { PayloadPanel } from "./payload-panel"

export type DemoMode = AddressFormMode | "multiple"

const EMPTY: AddressValue = {
  province_code: null,
  district_code: null,
  subdistrict_code: null,
  postal_code: null,
}

/**
 * Type into a field the way a person (or browser autofill) would, so the
 * sample buttons take the component's real path rather than a shortcut.
 */
function typeInto(el: HTMLInputElement | null, text: string) {
  if (!el) return
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set
  setter?.call(el, text)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.focus()
}

/** A live <AddressForm> beside the payload it produces. */
export function LiveDemo({
  mode,
  showFacilityCodes = false,
}: {
  mode: DemoMode
  showFacilityCodes?: boolean
}) {
  const { locale } = useLocale()
  const t = useT()
  const id = React.useId().replace(/:/g, "")
  const [shipping, setShipping] = React.useState<AddressValue>(EMPTY)
  const [tax, setTax] = React.useState<AddressValue>(EMPTY)
  const [sent, setSent] = React.useState(false)
  const formMode: AddressFormMode = mode === "multiple" ? "postal-first" : mode
  const samples =
    formMode === "search"
      ? SEARCH_SAMPLES
      : formMode === "postal-first"
        ? SAMPLES
        : []
  const addresses: Record<string, AddressValue> =
    mode === "multiple" ? { shipping, tax } : { shipping }

  const trySample = (s: string) => {
    const target =
      formMode === "search" ? `demo-${id}-search` : `demo-${id}-postal`
    typeInto(document.getElementById(target) as HTMLInputElement | null, s)
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <form
          className="flex flex-col gap-6 rounded-xl border p-5"
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
          onChange={() => setSent(false)}
        >
          <Field className="rounded-lg border border-dashed p-3">
            <FieldLabel htmlFor={`demo-${id}-line`}>
              {t("บ้านเลขที่ ถนน ซอย", "House no., street, soi")}
            </FieldLabel>
            <Input
              id={`demo-${id}-line`}
              name="shipping[line]"
              autoComplete="address-line1"
            />
            <FieldDescription>
              {t(
                "ช่องนี้เป็นของแอปคุณเอง ไม่ได้อยู่ในคอมโพเนนต์",
                "This field belongs to your app, not to the component."
              )}
            </FieldDescription>
          </Field>
          <AddressForm
            id={`demo-${id}`}
            name="shipping"
            locale={locale}
            mode={formMode}
            showFacilityCodes={showFacilityCodes}
            value={shipping}
            onChange={(v) => {
              setShipping(v)
              setSent(false)
            }}
            required
          />
          {mode === "multiple" ? (
            <AddressSameAs
              name="tax"
              locale={locale}
              source={shipping}
              value={tax}
              onChange={setTax}
            >
              {(field) => (
                <AddressForm
                  id={`demo-${id}-tax`}
                  name="tax"
                  legend={t("ที่อยู่ใบกำกับภาษี", "Tax invoice address")}
                  {...field}
                />
              )}
            </AddressSameAs>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            <span role="status" className="text-sm text-muted-foreground">
              {sent ? t("ผ่านการตรวจ ส่งได้", "Valid. Ready to send.") : ""}
            </span>
            <Button type="submit">{t("ส่ง", "Submit")}</Button>
          </div>
        </form>
        {samples.length ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {t("ลองพิมพ์", "Try")}
            </span>
            {samples.map((s) => (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                className="tabular-nums"
                onClick={() => trySample(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      <PayloadPanel addresses={addresses} />
    </div>
  )
}
