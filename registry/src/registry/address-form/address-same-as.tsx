"use client"

import * as React from "react"
import {
  formatAddress,
  type AddressValue,
  type ThaiAddress,
} from "@farzai/thailand-address"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"

import { getThaiAddressClient } from "./address-form-client"
import { createTranslator, type Locale } from "./address-form-copy"

const same = (a: AddressValue, b: AddressValue) =>
  a.province_code === b.province_code &&
  a.district_code === b.district_code &&
  a.subdistrict_code === b.subdistrict_code &&
  a.postal_code === b.postal_code

type AddressSameAsProps = {
  /** The address to follow, e.g. the shipping address. */
  source: AddressValue
  value: AddressValue
  onChange: (value: AddressValue) => void
  /** Posts the mirrored codes as name[province_code] ... while ticked. */
  name?: string
  locale?: Locale
  defaultChecked?: boolean
  /** The checkbox label; defaults to "ใช้ที่อยู่เดียวกับที่อยู่จัดส่ง" / "Same as shipping address". */
  label?: React.ReactNode
  description?: React.ReactNode
  client?: ThaiAddress
  /** The form to show when unticked. Spread `field` onto an <AddressForm>. */
  children: (field: {
    value: AddressValue
    onChange: (v: AddressValue) => void
    autoFocus: boolean
    locale: Locale
  }) => React.ReactNode
}

/**
 * Links a second address to a first one ("same as shipping"). Ticked, it
 * mirrors the source and shows a one-line summary. Unticking copies the
 * source in, ready to edit, and focuses its postal code. Re-ticking asks
 * first only if something was changed. Both addresses are always posted in
 * full, so the server never resolves "same as".
 */
export function AddressSameAs({
  source,
  value,
  onChange,
  name,
  locale = "th",
  defaultChecked = true,
  label,
  description,
  client: clientProp,
  children,
}: AddressSameAsProps) {
  const client = clientProp ?? getThaiAddressClient()
  const t = React.useMemo(() => createTranslator(locale), [locale])
  const id = React.useId()
  const [checked, setChecked] = React.useState(defaultChecked)
  const [copied, setCopied] = React.useState<AddressValue | null>(null)
  const [confirming, setConfirming] = React.useState(false)
  const [summaryState, setSummaryState] = React.useState<{
    key: string
    text: string | null
  } | null>(null)
  const summaryKey =
    checked && source.subdistrict_code
      ? `${source.subdistrict_code}:${source.postal_code}:${locale}`
      : null
  const summary =
    summaryState && summaryState.key === summaryKey ? summaryState.text : null

  // Mirror while ticked.
  React.useEffect(() => {
    if (checked && !same(value, source)) onChange(source)
  }, [checked, source, value, onChange])

  React.useEffect(() => {
    if (!summaryKey || !source.subdistrict_code) return
    let live = true
    client
      .resolve(source.subdistrict_code)
      .then(
        (area) =>
          live &&
          setSummaryState({
            key: summaryKey,
            text: area ? formatAddress(area, locale, source.postal_code) : null,
          })
      )
      .catch(() => live && setSummaryState({ key: summaryKey, text: null }))
    return () => {
      live = false
    }
  }, [summaryKey, source.subdistrict_code, source.postal_code, client, locale])

  const tick = (next: boolean) => {
    if (!next) {
      onChange({ ...source })
      setCopied({ ...source })
      setChecked(false)
      return
    }
    if (copied && !same(copied, value)) {
      setConfirming(true)
      return
    }
    setChecked(true)
  }

  const confirm = () => {
    setConfirming(false)
    setChecked(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <Field orientation="horizontal">
        <Checkbox
          id={`${id}-same`}
          checked={checked}
          onCheckedChange={(v) => tick(v === true)}
          aria-describedby={`${id}-desc`}
        />
        <FieldContent>
          <FieldLabel htmlFor={`${id}-same`}>{label ?? t("sameAs")}</FieldLabel>
          <FieldDescription id={`${id}-desc`}>
            {checked
              ? (summary ?? (source.subdistrict_code ? "" : t("sameAsEmpty")))
              : (description ?? t("sameAsDesc"))}
          </FieldDescription>
        </FieldContent>
      </Field>
      {confirming ? (
        <Alert role="status">
          <AlertTitle>{t("sameAsConfirm")}</AlertTitle>
          <AlertDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={confirm}>
                {t("sameAsReplace")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirming(false)}
              >
                {t("sameAsKeep")}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
      {checked ? (
        name ? (
          <>
            {(Object.keys(source) as (keyof AddressValue)[]).map((f) => (
              <input
                key={f}
                type="hidden"
                name={`${name}[${f}]`}
                value={source[f] ?? ""}
              />
            ))}
          </>
        ) : null
      ) : (
        children({ value, onChange, autoFocus: copied !== null, locale })
      )}
    </div>
  )
}
