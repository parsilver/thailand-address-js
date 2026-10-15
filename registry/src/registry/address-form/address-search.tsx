"use client"

import * as React from "react"
import {
  type Locale,
  type NameRanges,
  type SearchHit,
  type SearchResult,
  type ThaiAddress,
} from "@farzai/thailand-address"
import { Loader2Icon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import type { Translate } from "./address-form-copy"

type AddressSearchProps = {
  id: string
  client: ThaiAddress
  locale: Locale
  t: Translate
  showFacilityCodes: boolean
  disabled: boolean
  onPick: (hit: SearchHit, line: string) => void
  onFillManually: () => void
}

/**
 * The single search box: an ARIA 1.2 combobox (input + listbox) over every
 * subdistrict, matching Thai and English and ignoring ต./อ./จ./เขต/แขวง.
 * Results come ranked from the core's search, so nothing is filtered here.
 * The list sits under the input, so it works the same on a phone.
 */
export function AddressSearch({
  id,
  client,
  locale,
  t,
  showFacilityCodes,
  disabled,
  onPick,
  onFillManually,
}: AddressSearchProps) {
  const [query, setQuery] = React.useState("")
  const [result, setResult] = React.useState<SearchResult | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const seq = React.useRef(0)

  React.useEffect(() => {
    const n = ++seq.current
    if (!query.trim()) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the search this effect starts
    setLoading(true)
    client
      .search(query, { includeFacility: showFacilityCodes })
      .then((r) => {
        if (n !== seq.current) return
        setResult(r)
        setActiveIndex(-1)
      })
      .catch(() => n === seq.current && setResult(null))
      .finally(() => n === seq.current && setLoading(false))
  }, [query, client, showFacilityCodes])

  // An emptied box shows no results, whatever the last search returned.
  const current = query.trim() ? result : null
  const hits = current?.status === "ok" ? current.hits : []
  const empty = current?.status === "ok" && hits.length === 0 && !loading
  const expanded = open && hits.length > 0
  const listId = `${id}-list`
  const descId = `${id}-desc`
  const optionId = (i: number) => `${id}-option-${i}`

  const choose = (hit: SearchHit) => {
    const line = lineText(hit, locale)
    onPick(hit, line)
    setQuery(line)
    setOpen(false)
    setActiveIndex(-1)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      if (hits.length) setActiveIndex((i) => (i + 1) % hits.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setOpen(true)
      if (hits.length) setActiveIndex((i) => (i <= 0 ? hits.length - 1 : i - 1))
    } else if (e.key === "Enter" && expanded) {
      // Never submit the form from an open list: Enter with nothing
      // highlighted highlights the first result, and a second Enter picks it.
      e.preventDefault()
      if (activeIndex >= 0) choose(hits[activeIndex]!)
      else setActiveIndex(0)
    } else if (e.key === "Escape" && expanded) {
      e.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{t("search")}</FieldLabel>
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={
            expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-describedby={descId}
          placeholder={t("searchPh")}
          value={query}
          disabled={disabled}
          className="pr-8 pl-8"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            client.preload("search").catch(() => {
              // The search itself reports the failure.
            })
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {loading && query.trim() ? (
          <Loader2Icon
            aria-hidden
            className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
          />
        ) : null}
        <div
          className={cn(
            "z-50 mt-1 w-full rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 sm:absolute",
            !expanded && "hidden"
          )}
        >
          <ul
            id={listId}
            role="listbox"
            aria-label={t("search")}
            className="flex flex-col"
          >
            {hits.map((h, i) => (
              <li
                key={hitKey(h)}
                id={optionId(i)}
                role="option"
                aria-selected={i === activeIndex}
                data-selected={i === activeIndex || undefined}
                // Keep focus in the input; choose on mouse down before blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(h)
                }}
                onMouseMove={() => setActiveIndex(i)}
                className="flex min-h-11 cursor-default items-start justify-between gap-3 rounded-sm px-2 py-1.5 select-none sm:min-h-0 data-selected:bg-muted"
              >
                <span className="min-w-0">
                  <HitLine hit={h} locale={locale} />
                </span>
                {h.level === "subdistrict" && h.postal_code ? (
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {h.postal_code}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {current?.status === "ok" && current.more ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {t("searchMore")}
            </p>
          ) : null}
        </div>
      </div>
      <FieldDescription id={descId}>{t("searchDesc")}</FieldDescription>
      {empty ? (
        <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-3 text-sm">
          <p className="font-medium">{t("searchEmpty", { s: query.trim() })}</p>
          <p className="text-muted-foreground">{t("searchEmptyBody")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={onFillManually}
          >
            {t("fillManually")}
          </Button>
        </div>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {current?.status === "ok" && open
          ? t("liveResults", { n: hits.length })
          : ""}
      </span>
    </Field>
  )
}

const hitKey = (h: SearchHit) =>
  h.level === "subdistrict"
    ? `${h.subdistrict.code}-${h.postal_code}`
    : h.level === "district"
      ? h.district.code
      : h.province.code

function lineText(hit: SearchHit, locale: Locale): string {
  return parts(hit, locale)
    .map((p) => p.prefix + p.name + p.suffix)
    .join("")
}

type Part = {
  level: "subdistrict" | "district" | "province"
  prefix: string
  name: string
  suffix: string
  range: [number, number] | undefined
}

/**
 * The one-line address as prefix + name pieces, so the matched part of each
 * name can be bold. A district or province hit has only its own levels.
 */
function parts(hit: SearchHit, locale: Locale): Part[] {
  const r = hit.match.ranges
  // A match in the other language bolds the whole name: "karon" bolds กะรน.
  const pick = (
    n: { th: string; en: string | null },
    ranges: NameRanges | undefined
  ) => {
    const name = locale === "en" ? (n.en ?? n.th) : n.th
    const own = locale === "en" && n.en ? ranges?.en : ranges?.th
    const range: [number, number] | undefined =
      own ?? (ranges?.th || ranges?.en ? [0, name.length] : undefined)
    return { name, range }
  }
  const bangkok = hit.province.kind === "special_administrative_area"
  const out: Omit<Part, "suffix">[] = []
  if (hit.level === "subdistrict") {
    out.push({
      level: "subdistrict",
      prefix:
        locale === "en"
          ? ""
          : hit.subdistrict.kind === "khwaeng" || bangkok
            ? "แขวง"
            : "ตำบล",
      ...pick(hit.subdistrict.name, r.subdistrict),
    })
  }
  if (hit.level !== "province") {
    out.push({
      level: "district",
      prefix:
        locale === "en"
          ? ""
          : hit.district.kind === "khet" || bangkok
            ? "เขต"
            : "อำเภอ",
      ...pick(hit.district.name, r.district),
    })
  }
  out.push({
    level: "province",
    prefix: locale === "en" || bangkok ? "" : "จังหวัด",
    ...pick(hit.province.name, r.province),
  })
  const sep = locale === "en" ? ", " : " "
  return out.map((p, i) => ({ ...p, suffix: i < out.length - 1 ? sep : "" }))
}

function HitLine({ hit, locale }: { hit: SearchHit; locale: Locale }) {
  return (
    <>
      {parts(hit, locale).map((p) => (
        <React.Fragment key={p.level}>
          {p.prefix}
          {p.range ? (
            <>
              {p.name.slice(0, p.range[0])}
              <strong className="font-semibold">
                {p.name.slice(p.range[0], p.range[1])}
              </strong>
              {p.name.slice(p.range[1])}
            </>
          ) : (
            p.name
          )}
          {p.suffix}
        </React.Fragment>
      ))}
    </>
  )
}
