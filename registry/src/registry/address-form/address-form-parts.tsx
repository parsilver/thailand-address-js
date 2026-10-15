"use client"

import type { Area, PostalLookup } from "@farzai/thailand-address"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import type { CopyKey, Locale } from "./address-form-copy"
import { AddressPicker } from "./address-picker"
import { areaContext, nameIn } from "./address-form-shared"

export function choiceDescription(
  result: Extract<PostalLookup, { status: "found" }>,
  t: (k: CopyKey, v?: Record<string, string | number>) => string
) {
  return result.province_count > 1
    ? t("pickArea", {
        pc: result.postal_code,
        n: result.areas.length,
        p: result.province_count,
      })
    : t("pickAreaOneProvince", {
        pc: result.postal_code,
        n: result.areas.length,
        d: result.district_count,
      })
}

export function facilityNote(
  result: Extract<PostalLookup, { status: "facility" }>,
  locale: Locale
): string | null {
  const note = result.facilities[0]?.note
  if (!note) return null
  return note[locale] ?? note.th ?? note.en ?? null
}

/** The combined "subdistrict › district › province" choice: radios up to 6, a searchable picker above. */
export function AreaChoice({
  id,
  areas,
  value,
  onChange,
  description,
  heading,
  locale,
  t,
  disabled,
}: {
  id: string
  areas: Area[]
  value: string | null
  onChange: (code: string) => void
  description: string
  heading: string
  locale: Locale
  t: (k: CopyKey, v?: Record<string, string | number>) => string
  disabled: boolean
}) {
  if (areas.length <= 6) {
    return (
      <Field>
        <FieldLabel id={`${id}-label`}>{description}</FieldLabel>
        <RadioGroup
          aria-labelledby={`${id}-label`}
          value={value ?? ""}
          onValueChange={onChange}
          disabled={disabled}
          className="gap-2"
        >
          {areas.map((a) => (
            <FieldLabel
              key={a.subdistrict.code}
              htmlFor={`${id}-${a.subdistrict.code}`}
            >
              <Field orientation="horizontal">
                <RadioGroupItem
                  value={a.subdistrict.code}
                  id={`${id}-${a.subdistrict.code}`}
                  aria-labelledby={`${id}-${a.subdistrict.code}-name`}
                  aria-describedby={`${id}-${a.subdistrict.code}-context`}
                />
                <span className="flex flex-col gap-0.5">
                  <span id={`${id}-${a.subdistrict.code}-name`}>
                    {nameIn(a.subdistrict.name, locale)}
                  </span>
                  <span
                    id={`${id}-${a.subdistrict.code}-context`}
                    className="text-sm font-normal text-muted-foreground"
                  >
                    {areaContext(a, locale)}
                  </span>
                </span>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </Field>
    )
  }
  return (
    <Field>
      <FieldLabel htmlFor={id}>{heading}</FieldLabel>
      <AddressPicker
        id={id}
        label={heading}
        options={areas.map((a) => ({
          value: a.subdistrict.code,
          label: nameIn(a.subdistrict.name, locale),
          description: areaContext(a, locale),
          keywords: [
            a.subdistrict.name.th,
            a.subdistrict.name.en ?? "",
            a.district.name.th,
            a.province.name.th,
          ],
        }))}
        value={value}
        onValueChange={onChange}
        placeholder={t("pick", { k: t("subdistrict") })}
        searchPlaceholder={t("searchHere", { k: t("subdistrict") })}
        emptyText={t("noOptions")}
        disabled={disabled}
        describedBy={`${id}-desc`}
      />
      <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
    </Field>
  )
}
