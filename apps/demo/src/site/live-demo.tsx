import * as React from "react"
import type { AddressValue } from "@farzai/thailand-address"

import {
  AddressForm,
  type AddressFormMode,
} from "@/registry/address-form/address-form"
import { AddressSameAs } from "@/registry/address-form/address-same-as"
import { cn } from "@/lib/utils"
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

/**
 * A live <AddressForm> and the payload it produces. `split` puts the payload
 * in a sticky column beside the form (home); `stacked` follows the form with
 * it as a section (the single-column docs pages). `id` gives the form stable
 * element ids, which the end-to-end flows select by.
 */
export function LiveDemo({
  mode,
  showFacilityCodes = false,
  layout = "split",
  id: fixedId,
}: {
  mode: DemoMode
  showFacilityCodes?: boolean
  layout?: "split" | "stacked"
  id?: string
}) {
  const { locale } = useLocale()
  const t = useT()
  const generatedId = React.useId().replace(/:/g, "")
  const id = fixedId ?? generatedId
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
    <div
      className={cn(
        "grid min-w-0",
        layout === "split"
          ? "gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16"
          : "gap-14 max-md:gap-11"
      )}
    >
      <div className="flex min-w-0 flex-col gap-5">
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
          onChange={() => setSent(false)}
        >
          <Field className="border-b pb-6">
            <FieldLabel htmlFor={`demo-${id}-line`}>
              {t("บ้านเลขที่ ถนน ซอย", "House no., street, soi")}
            </FieldLabel>
            <Input
              id={`demo-${id}-line`}
              name="shipping[line]"
              autoComplete="address-line1"
            />
            <FieldDescription className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full border border-muted-foreground"
              />
              {t(
                "ช่องของแอปคุณเอง ไม่ได้อยู่ในคอมโพเนนต์",
                "Your app's own field, not part of the component"
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">
              {t("ลองพิมพ์", "Try")}
            </span>
            {samples.map((s) => (
              <button
                key={s}
                type="button"
                className="min-h-6 rounded-sm tabular-nums underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => trySample(s)}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {layout === "split" ? (
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <PayloadPanel addresses={addresses} />
        </div>
      ) : (
        <section className="min-w-0">
          <PayloadPanel addresses={addresses} variant="section" />
        </section>
      )}
    </div>
  )
}
