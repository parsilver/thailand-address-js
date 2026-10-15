// Dev preview of the registry item: pnpm dev, then ?mode=area-first|search|multiple and ?locale=en.
import * as React from "react"

import {
  AddressForm,
  type AddressFormMode,
  type AddressValue,
  type Locale,
} from "@/registry/address-form/address-form"
import { AddressSameAs } from "@/registry/address-form/address-same-as"
import { Button } from "@/components/ui/button"

const EMPTY: AddressValue = {
  province_code: null,
  district_code: null,
  subdistrict_code: null,
  postal_code: null,
}

export function App() {
  const params = new URLSearchParams(location.search)
  const mode = (params.get("mode") ?? "postal-first") as
    AddressFormMode | "multiple"
  const locale = (params.get("locale") ?? "th") as Locale
  const [shipping, setShipping] = React.useState<AddressValue>(EMPTY)
  const [tax, setTax] = React.useState<AddressValue>(EMPTY)
  const [submitted, setSubmitted] = React.useState<string | null>(null)
  return (
    <main className="mx-auto max-w-2xl p-6">
      <form
        className="flex flex-col gap-6 rounded-xl border p-6"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(
            JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))
          )
        }}
      >
        <AddressForm
          name="shipping"
          locale={locale}
          mode={mode === "multiple" ? "postal-first" : mode}
          value={shipping}
          onChange={setShipping}
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
                name="tax"
                legend={
                  locale === "th" ? "ที่อยู่ใบกำกับภาษี" : "Tax invoice address"
                }
                {...field}
              />
            )}
          </AddressSameAs>
        ) : null}
        <Button type="submit" className="self-end">
          Submit
        </Button>
      </form>
      <pre data-testid="payload" className="mt-4 text-xs">
        {JSON.stringify({ shipping, tax }, null, 2)}
      </pre>
      {submitted ? (
        <pre data-testid="submitted" className="mt-2 text-xs">
          {submitted}
        </pre>
      ) : null}
    </main>
  )
}

export default App
