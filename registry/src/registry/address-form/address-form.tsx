"use client"

import * as React from "react"
import {
  formatAddress,
  normalizePostalInput,
  type AddressValue,
  type Area,
  type District,
  type PostalLookup,
  type PostalOption,
  type SearchHit,
  type Province,
  type Subdistrict,
  type ThaiAddress,
} from "@farzai/thailand-address"
import {
  CheckIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { getThaiAddressClient } from "./address-form-client"
import {
  AreaChoice,
  choiceDescription,
  facilityNote,
} from "./address-form-parts"
import { initialPostalState, postalReducer } from "./address-form-state"
import { createTranslator, type Locale } from "./address-form-copy"
import { AddressPicker, type PickerOption } from "./address-picker"
import { AddressSearch } from "./address-search"
import { joinList, levelKinds, nameIn, sortByName } from "./address-form-shared"

export type { AddressValue, Locale }

export type AddressFormMode = "postal-first" | "area-first" | "search"

export type AddressFormProps = {
  /** Prefixes the hidden inputs: name="shipping" posts shipping[province_code] and so on. */
  name?: string
  /** The four codes. Unset levels are null. */
  value?: AddressValue
  defaultValue?: AddressValue
  onChange?: (value: AddressValue) => void
  /** Labels, names and announcements. Codes don't change, so switching never loses a value. */
  locale?: Locale
  mode?: AddressFormMode
  /** Treat facility postal codes (mail centres, such as 10001) like ordinary codes. */
  showFacilityCodes?: boolean
  /** The <legend>. Defaults to "ที่อยู่จัดส่ง" / "Shipping address". */
  legend?: React.ReactNode
  /** Every field must be set to submit. Otherwise an empty address submits and a partial one does not. */
  required?: boolean
  disabled?: boolean
  /** Base for element ids; defaults to a generated one. */
  id?: string
  /** Focus the postal code on mount (used by <AddressSameAs> after unticking). */
  autoFocus?: boolean
  /** A client from createThaiAddress(), e.g. to change the data host. Defaults to a shared one. */
  client?: ThaiAddress
  className?: string
}

const EMPTY: AddressValue = {
  province_code: null,
  district_code: null,
  subdistrict_code: null,
  postal_code: null,
}

type Field = keyof AddressValue
type FieldErrors = Partial<Record<Field, string>>

/** A value that follows a promise-returning call, re-run when its key changes. */
function useLoad<T>(key: string | null, load: () => Promise<T>) {
  const [state, setState] = React.useState<{
    key: string | null
    data?: T
    error?: unknown
  }>({ key: null })
  const [attempt, setAttempt] = React.useState(0)
  const run = React.useEffectEvent(load)
  React.useEffect(() => {
    if (key === null) return
    let live = true
    run().then(
      (data) => live && setState({ key, data }),
      (error: unknown) => live && setState({ key, error })
    )
    return () => {
      live = false
    }
  }, [key, attempt])
  const current = state.key === key
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading:
      key !== null &&
      (!current || (state.data === undefined && state.error === undefined)),
    retry: () => setAttempt((n) => n + 1),
  }
}

/**
 * A Thai address as four codes: province, district, subdistrict and postal
 * code. The postal code comes first by default and fills in the rest; every
 * other field confirms or corrects it. Data is lazy-loaded from the pinned
 * dataset snapshot. See https://thailand-address-demo.farzai.com.
 */
export function AddressForm({
  name,
  value: valueProp,
  defaultValue,
  onChange,
  locale = "th",
  mode = "postal-first",
  showFacilityCodes = false,
  legend,
  required = false,
  disabled = false,
  id: idProp,
  autoFocus = false,
  client: clientProp,
  className,
}: AddressFormProps) {
  const client = clientProp ?? getThaiAddressClient()
  const t = React.useMemo(() => createTranslator(locale), [locale])
  const autoId = React.useId()
  const id = idProp ?? `address-${autoId.replace(/:/g, "")}`
  const ids = {
    postal: `${id}-postal`,
    postalDesc: `${id}-postal-desc`,
    postalError: `${id}-postal-error`,
    province: `${id}-province`,
    district: `${id}-district`,
    subdistrict: `${id}-subdistrict`,
    choice: `${id}-choice`,
    postalChoice: `${id}-postal-choice`,
  }

  // Controlled or not.
  const [inner, setInner] = React.useState<AddressValue>(defaultValue ?? EMPTY)
  const value = valueProp ?? inner
  const lastEmitted = React.useRef<AddressValue>(value)
  const emit = React.useCallback(
    (next: AddressValue) => {
      lastEmitted.current = next
      if (valueProp === undefined) setInner(next)
      onChange?.(next)
    },
    [valueProp, onChange]
  )

  // Everything the postal code implied for the fields below (see address-form-state.ts).
  const [postal, dispatch] = React.useReducer(
    postalReducer,
    value.postal_code ?? "",
    initialPostalState
  )
  const {
    input: postalInput,
    lookup,
    autofilledFrom,
    narrowed,
    choice,
  } = postal
  const result: PostalLookup | undefined =
    lookup?.status === "done" ? lookup.result : undefined
  const lookupSeq = React.useRef(0)
  const reconcileSeq = React.useRef(0)

  React.useEffect(() => {
    // A value from outside (same-as, the host, a reset) is shown as given,
    // and nothing the last lookup implied survives it.
    if (!sameValue(value, lastEmitted.current)) {
      lookupSeq.current++
      reconcileSeq.current++
      dispatch({ type: "reset", input: value.postal_code ?? "" })
    }
    lastEmitted.current = value
  }, [value])

  const [active, setActive] = React.useState(
    autoFocus || mode !== "postal-first"
  )
  const [live, setLive] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  // Lists for the three pickers, and the codes that serve the subdistrict.
  // A value from the host needs names to show, so it loads the lists too.
  const provincesQ = useLoad(
    active || value.province_code ? "provinces" : null,
    () => client.provinces()
  )
  const districtsQ = useLoad(value.province_code, () =>
    client.districts(value.province_code!)
  )
  const subdistrictsQ = useLoad(value.district_code, () =>
    client.subdistricts(value.district_code!)
  )
  const servingQ = useLoad(value.subdistrict_code, () =>
    client.postalCodesOf(value.subdistrict_code!, { includeFacility: true })
  )
  const serving: PostalOption[] | undefined = servingQ.data
  const offered = serving?.filter(
    (p) =>
      showFacilityCodes ||
      p.kind !== "facility" ||
      p.postal_code === value.postal_code
  )

  React.useEffect(() => {
    if (!active) return
    client
      .preload(
        mode === "search"
          ? "search"
          : mode === "postal-first"
            ? "postal"
            : "provinces"
      )
      .catch(() => {
        // The load that needs the data reports the failure.
      })
  }, [active, client, mode])

  const province =
    provincesQ.data?.find((p) => p.code === value.province_code) ?? null
  const district =
    districtsQ.data?.find((d) => d.code === value.district_code) ?? null
  const subdistrict =
    subdistrictsQ.data?.find((s) => s.code === value.subdistrict_code) ?? null
  const kinds = levelKinds(province, district, subdistrict)
  const labels = {
    province: t("province"),
    district: t(kinds.district),
    subdistrict: t(kinds.subdistrict),
  }

  // Apply a finished postal lookup to the fields.
  const applyLookup = (result: PostalLookup) => {
    const current = lastEmitted.current
    if (result.status === "found") {
      const areas = result.areas
      if (result.shape === "single") {
        const a = areas[0]!
        emit(codesOf(a, result.postal_code))
        setLive(
          t("liveFilled", {
            addr: formatAddress(a, locale, result.postal_code),
          })
        )
      } else if (result.shape === "one_district") {
        const a = areas[0]!
        const keep = areas.some(
          (x) => x.subdistrict.code === current.subdistrict_code
        )
        emit({
          province_code: a.province.code,
          district_code: a.district.code,
          subdistrict_code: keep ? current.subdistrict_code : null,
          postal_code: result.postal_code,
        })
        const k = levelKinds(a.province, a.district, a.subdistrict)
        setLive(
          t(
            a.district.kind === "khet" ? "liveNarrowed" : "liveNarrowedAmphoe",
            {
              pc: result.postal_code,
              n: areas.length,
              k: t(k.subdistrict),
              d: nameIn(a.district.name, locale),
            }
          )
        )
      } else {
        const keep = areas.find(
          (x) => x.subdistrict.code === current.subdistrict_code
        )
        emit(
          keep
            ? codesOf(keep, result.postal_code)
            : { ...EMPTY, postal_code: result.postal_code }
        )
        setLive(choiceDescription(result, t))
      }
    } else if (result.status === "facility") {
      emit({ ...current, postal_code: null })
      setLive(t("facilityTitle", { pc: result.postal_code }))
    } else if (result.status === "not_found") {
      setLive(t("notFoundTitle", { pc: result.postal_code }))
    }
  }

  const runLookup = (pc: string, facility: boolean) => {
    const n = ++lookupSeq.current
    dispatch({ type: "lookup_start", pc, facility })
    client.lookupPostalCode(pc, { includeFacility: facility }).then(
      (r) => {
        if (n !== lookupSeq.current) return
        dispatch({ type: "lookup_done", pc, facility, result: r })
        applyLookup(r)
      },
      (error: unknown) => {
        if (n !== lookupSeq.current) return
        dispatch({ type: "lookup_error", pc, facility, error })
      }
    )
  }

  /** Drop a lookup still in flight, so it cannot land on top of a hand pick. */
  const cancelPendingLookup = () => {
    if (lookup?.status !== "loading") return
    lookupSeq.current++
    dispatch({ type: "lookup_cancel" })
  }

  // A hand-picked subdistrict: keep the postal code only if it serves the
  // area; otherwise switch to the area's only code, or clear it.
  // Only a change made here counts: a value from the host is shown as given.
  const reconcilePostal = (code: string) => {
    const n = ++reconcileSeq.current
    const typedUnknown =
      result?.status === "not_found" ? result.postal_code : null
    client.postalCodesOf(code, { includeFacility: true }).then(
      (serving) => {
        if (
          n !== reconcileSeq.current ||
          lastEmitted.current.subdistrict_code !== code
        )
          return
        applyServing(serving, typedUnknown)
      },
      () => {
        // The picker's own load shows the error.
      }
    )
  }
  const applyServing = (
    serving: PostalOption[],
    typedUnknown: string | null
  ) => {
    const current = lastEmitted.current
    const pc = current.postal_code
    if (pc && serving.some((p) => p.postal_code === pc)) return
    // An unknown code the user typed stays, marked invalid with a fix.
    if (pc && typedUnknown === pc) return
    const usable = serving.filter(
      (p) => showFacilityCodes || p.kind !== "facility"
    )
    if (usable.length === 1) {
      const only = usable[0]!.postal_code
      emit({ ...current, postal_code: only })
      dispatch({ type: "set_input", input: only })
      if (pc) setLive(t("livePostalSwitched", { pc: only }))
    } else if (pc) {
      emit({ ...current, postal_code: null })
      dispatch({ type: "set_input", input: "" })
      setLive(t("livePostalCleared"))
    }
  }

  // ---- Handlers -------------------------------------------------------------

  const onPostalInput = (raw: string) => {
    const pc = normalizePostalInput(raw)
    if (pc === postalInput) return
    lookupSeq.current++
    dispatch({ type: "typed", input: pc })
    if (pc.length < 5) {
      emit({ ...lastEmitted.current, postal_code: null })
      return
    }
    emit({ ...lastEmitted.current, postal_code: pc })
    runLookup(pc, showFacilityCodes)
  }

  const useFacilityCode = () => {
    if (!lookup) return
    emit({ ...lastEmitted.current, postal_code: lookup.pc })
    runLookup(lookup.pc, true)
  }

  const resetAll = () => {
    lookupSeq.current++
    reconcileSeq.current++
    emit(EMPTY)
    dispatch({ type: "reset", input: "" })
  }

  const clearAll = () => {
    resetAll()
    setLive(t("liveCleared"))
  }

  const announceCleared = (cleared: Field[]) => {
    if (cleared.length === 0) return
    const names = cleared.map((f) =>
      f === "district_code"
        ? labels.district.split(" ")[0]!
        : f === "subdistrict_code"
          ? labels.subdistrict.split(" ")[0]!
          : t("postal")
    )
    setLive(t("liveClearedBelow", { f: joinList(names, locale) }))
  }

  const keepsTypedPostal = () =>
    mode === "postal-first" &&
    result?.status === "not_found" &&
    result.postal_code === value.postal_code

  const onProvince = (code: string) => {
    if (code === value.province_code) return
    // An unknown code the user typed stays: picking the area by hand then
    // shows which code that area uses, as a fix.
    const keepPostal = keepsTypedPostal()
    const cleared: Field[] = (
      [
        "district_code",
        "subdistrict_code",
        ...(keepPostal ? [] : (["postal_code"] as const)),
      ] as Field[]
    ).filter((f) => value[f] !== null)
    if (!keepPostal) lookupSeq.current++
    dispatch({
      type: "area_picked",
      level: "province",
      code,
      keepTyped: keepPostal,
    })
    emit({
      province_code: code,
      district_code: null,
      subdistrict_code: null,
      postal_code: keepPostal ? value.postal_code : null,
    })
    announceCleared(cleared)
  }

  const onDistrict = (code: string) => {
    if (code === value.district_code) return
    const keepPostal = keepsTypedPostal()
    const cleared: Field[] = (
      [
        "subdistrict_code",
        ...(keepPostal ? [] : (["postal_code"] as const)),
      ] as Field[]
    ).filter((f) => value[f] !== null)
    if (!keepPostal) lookupSeq.current++
    dispatch({
      type: "area_picked",
      level: "district",
      code,
      keepTyped: keepPostal,
    })
    emit({
      ...value,
      district_code: code,
      subdistrict_code: null,
      postal_code: keepPostal ? value.postal_code : null,
    })
    announceCleared(cleared)
  }

  const onSubdistrict = (code: string) => {
    if (code === value.subdistrict_code) return
    if (lookup?.status === "loading") lookupSeq.current++
    dispatch({ type: "subdistrict_picked" })
    emit({ ...value, subdistrict_code: code })
    reconcilePostal(code)
  }

  const onChoice = (code: string) => {
    const a = choice?.find((x) => x.subdistrict.code === code)
    if (!a) return
    cancelPendingLookup()
    emit(codesOf(a, value.postal_code))
    setLive(
      t("liveFilled", { addr: formatAddress(a, locale, value.postal_code) })
    )
  }

  const onPostalOption = (pc: string) => {
    if (!pc) return
    cancelPendingLookup()
    emit({ ...value, postal_code: pc })
    dispatch({ type: "set_input", input: pc })
  }

  // A hit fills as many levels as it has: a province hit sets the province
  // and leaves the rest to pick.
  const onSearchPick = (hit: SearchHit, line: string) => {
    lookupSeq.current++
    dispatch({
      type: "reset",
      input: hit.level === "subdistrict" ? (hit.postal_code ?? "") : "",
    })
    if (hit.level === "subdistrict") {
      emit(codesOf(hit, hit.postal_code))
      setLive(
        t("liveFilled", { addr: formatAddress(hit, locale, hit.postal_code) })
      )
      return
    }
    emit({
      province_code: hit.province.code,
      district_code: hit.level === "district" ? hit.district.code : null,
      subdistrict_code: null,
      postal_code: null,
    })
    setLive(t("liveFilled", { addr: line }))
  }

  // ---- Validation on submit -------------------------------------------------

  const servingLoading = servingQ.loading
  const mismatch =
    Boolean(value.postal_code && value.subdistrict_code && serving) &&
    !serving!.some((p) => p.postal_code === value.postal_code)

  const errors = React.useMemo<FieldErrors>(() => {
    const e: FieldErrors = {}
    const any =
      Object.values(value).some((v) => v !== null) || postalInput !== ""
    if (!required && !any) return e
    if (!value.province_code)
      e.province_code = t("errRequired", { f: labels.province })
    if (!value.district_code)
      e.district_code = t("errRequired", { f: labels.district })
    if (!value.subdistrict_code)
      e.subdistrict_code = t("errRequired", { f: labels.subdistrict })
    const noCodeKnown = serving !== undefined && serving.length === 0
    if (!value.postal_code && !noCodeKnown)
      e.postal_code = t("errRequiredPostal")
    else if (mismatch) e.postal_code = t("errMismatch")
    // The codes that serve the subdistrict are still loading, so a mismatch
    // cannot be ruled out yet: hold the submit rather than let it through.
    else if (value.postal_code && value.subdistrict_code && servingLoading)
      e.postal_code = t("errChecking")
    return e
  }, [
    value,
    postalInput,
    required,
    serving,
    servingLoading,
    mismatch,
    labels.province,
    labels.district,
    labels.subdistrict,
    t,
  ])
  const shown: FieldErrors = submitted ? errors : {}

  const fieldsetRef = React.useRef<HTMLFieldSetElement>(null)
  // The listener sits on the document in the capture phase, which runs before
  // the form's own listeners and React's onSubmit, so an invalid address stops
  // a plain form and a react-hook-form handler alike. stopPropagation also
  // stops any other submit listener on the page for that submit.
  const onFormSubmit = React.useEffectEvent((event: SubmitEvent) => {
    if (event.target !== fieldsetRef.current?.form) return
    setSubmitted(true)
    if (Object.keys(errors).length === 0) return
    event.preventDefault()
    event.stopPropagation()
    const order: [Field, string][] = [
      ["postal_code", ids.postal],
      ["province_code", ids.province],
      ["district_code", ids.district],
      ["subdistrict_code", ids.subdistrict],
    ]
    const first = order
      .filter(([f]) => errors[f])
      .map(([, elId]) => document.getElementById(elId))
      .find((el): el is HTMLElement => el !== null)
    if (first) focusFirstInvalid(event, first)
  })
  const onFormReset = React.useEffectEvent((event: Event) => {
    if (event.target !== fieldsetRef.current?.form) return
    setSubmitted(false)
    resetAll()
  })
  React.useEffect(() => {
    const submit = (event: SubmitEvent) => onFormSubmit(event)
    const reset = (event: Event) => onFormReset(event)
    document.addEventListener("submit", submit, true)
    document.addEventListener("reset", reset, true)
    return () => {
      document.removeEventListener("submit", submit, true)
      document.removeEventListener("reset", reset, true)
    }
  }, [])

  // ---- Options --------------------------------------------------------------

  const provinceOptions: PickerOption[] = sortByName(
    provincesQ.data ?? [],
    locale
  ).map((p) => ({
    value: p.code,
    label: nameIn(p.name, locale),
    keywords: [p.name.th, p.name.en ?? ""],
  }))
  const districtOptions: PickerOption[] = sortByName(
    districtsQ.data ?? [],
    locale
  ).map((d) => ({
    value: d.code,
    label: nameIn(d.name, locale),
    keywords: [d.name.th, d.name.en ?? ""],
  }))
  const narrowedHere =
    narrowed?.filter((a) => a.district.code === value.district_code) ?? null
  const subdistrictSource: Subdistrict[] =
    narrowedHere && narrowedHere.length > 0
      ? narrowedHere.map((a) => a.subdistrict)
      : (subdistrictsQ.data ?? [])
  const subdistrictOptions: PickerOption[] = sortByName(
    subdistrictSource,
    locale
  ).map((s) => ({
    value: s.code,
    label: nameIn(s.name, locale),
    keywords: [s.name.th, s.name.en ?? ""],
  }))

  // ---- Render ---------------------------------------------------------------

  const busy =
    lookup?.status === "loading" ||
    provincesQ.loading ||
    districtsQ.loading ||
    subdistrictsQ.loading ||
    servingQ.loading
  const loadError =
    (lookup?.status === "error" ? lookup.error : undefined) ??
    provincesQ.error ??
    districtsQ.error ??
    subdistrictsQ.error ??
    servingQ.error
  const retry = () => {
    if (lookup?.status === "error") runLookup(lookup.pc, lookup.facility)
    for (const q of [provincesQ, districtsQ, subdistrictsQ, servingQ])
      if (q.error) q.retry()
  }

  const describe = (...parts: (string | false | null | undefined)[]) =>
    parts.filter(Boolean).join(" ") || undefined
  const fixCodes =
    mismatch && result?.status === "not_found"
      ? (offered ?? [])
          .filter((p) => p.kind === "standard")
          .map((p) => p.postal_code)
      : []
  const showPostalChoice =
    Boolean(value.subdistrict_code) &&
    !value.postal_code &&
    (offered?.length ?? 0) > 1 &&
    !(mode === "postal-first" && result?.status === "not_found")

  const postalField = (
    <Field
      data-invalid={Boolean(shown.postal_code || fixCodes.length) || undefined}
    >
      <FieldLabel htmlFor={ids.postal}>{t("postal")}</FieldLabel>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="relative w-32">
          <Input
            id={ids.postal}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            pattern="[0-9]*"
            placeholder={t("postalPh")}
            value={postalInput}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-invalid={
              Boolean(shown.postal_code || fixCodes.length) || undefined
            }
            aria-describedby={describe(
              ids.postalDesc,
              (shown.postal_code || fixCodes.length > 0) && ids.postalError
            )}
            onFocus={() => setActive(true)}
            onChange={(e) => onPostalInput(e.target.value)}
            className="pr-8"
          />
          {lookup?.status === "loading" ? (
            <Loader2Icon
              aria-hidden
              className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
            />
          ) : null}
        </div>
        {autofilledFrom && autofilledFrom === value.postal_code ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckIcon aria-hidden className="size-4" />
            <span>{t("autofilled", { pc: autofilledFrom })}</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={clearAll}
              disabled={disabled}
            >
              {t("undo")}
            </Button>
          </span>
        ) : null}
      </div>
      <FieldDescription id={ids.postalDesc}>{t("postalDesc")}</FieldDescription>
      {fixCodes.length > 0 && subdistrict ? (
        <div
          id={ids.postalError}
          className="flex flex-wrap items-center gap-x-2 text-sm text-destructive"
        >
          <span>
            {t("postalFix", {
              k: locale === "th" ? t(kinds.subdistrict) : "",
              s: nameIn(subdistrict.name, locale),
              pc: fixCodes.join(", "),
            })}
          </span>
          {fixCodes.map((pc) => (
            <Button
              key={pc}
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => onPostalOption(pc)}
            >
              {t("postalFixUse", { pc })}
            </Button>
          ))}
        </div>
      ) : shown.postal_code ? (
        <FieldError id={ids.postalError}>{shown.postal_code}</FieldError>
      ) : null}
    </Field>
  )

  const choiceBlock =
    choice && result?.status === "found" ? (
      <AreaChoice
        id={ids.choice}
        areas={choice}
        value={value.subdistrict_code}
        onChange={onChoice}
        description={choiceDescription(result, t)}
        heading={t("areaChoice", { pc: result.postal_code })}
        locale={locale}
        t={t}
        disabled={disabled}
      />
    ) : null

  const notices = (
    <>
      {result?.status === "facility" && lookup && !lookup.facility ? (
        <Alert role="status" aria-labelledby={`${id}-facility-title`}>
          <InfoIcon aria-hidden />
          <AlertTitle id={`${id}-facility-title`}>
            {t("facilityTitle", { pc: result.postal_code })}
          </AlertTitle>
          <AlertDescription>
            <span className="block">
              {facilityNote(result, locale)
                ? t("facilityBody", { note: facilityNote(result, locale)! })
                : t("facilityBodyNoNote")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={useFacilityCode}
              disabled={disabled}
            >
              {t("facilityUse")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {result?.status === "not_found" && result.postal_code === postalInput ? (
        <Alert role="status" aria-labelledby={`${id}-notfound-title`}>
          <InfoIcon aria-hidden />
          <AlertTitle id={`${id}-notfound-title`}>
            {t("notFoundTitle", { pc: result.postal_code })}
          </AlertTitle>
          <AlertDescription>{t("notFoundBody")}</AlertDescription>
        </Alert>
      ) : null}
      {loadError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>
            <span className="block">{t("errorBody")}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={retry}
            >
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  )

  const districtReason = !value.province_code ? t("chooseProvinceFirst") : null
  const subdistrictReason = !value.district_code
    ? t("chooseDistrictFirst", { k: labels.district })
    : null
  const narrowDesc =
    narrowedHere &&
    narrowedHere.length > 1 &&
    !value.subdistrict_code &&
    result?.status === "found"
      ? t("pickOne", {
          pc: result.postal_code,
          n: narrowedHere.length,
          k: labels.subdistrict,
        })
      : null
  const errId = (f: string) => `${id}-${f}-error`

  const areaFields = (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field data-invalid={Boolean(shown.province_code) || undefined}>
        <FieldLabel htmlFor={ids.province}>{labels.province}</FieldLabel>
        <AddressPicker
          id={ids.province}
          label={labels.province}
          options={provinceOptions}
          value={value.province_code}
          onValueChange={onProvince}
          placeholder={t("provincePh")}
          searchPlaceholder={t("searchHere", { k: labels.province })}
          emptyText={t("noOptions")}
          disabled={disabled}
          loading={provincesQ.loading}
          invalid={Boolean(shown.province_code)}
          describedBy={describe(shown.province_code && errId("province"))}
          onOpen={() => setActive(true)}
        />
        {shown.province_code ? (
          <FieldError id={errId("province")}>{shown.province_code}</FieldError>
        ) : null}
      </Field>
      <Field
        data-invalid={Boolean(shown.district_code) || undefined}
        data-disabled={!value.province_code || undefined}
      >
        <FieldLabel htmlFor={ids.district}>{labels.district}</FieldLabel>
        <AddressPicker
          id={ids.district}
          label={labels.district}
          options={districtOptions}
          value={value.district_code}
          onValueChange={onDistrict}
          placeholder={t("pick", { k: labels.district })}
          searchPlaceholder={t("searchHere", { k: labels.district })}
          emptyText={t("noOptions")}
          disabled={disabled || !value.province_code}
          loading={districtsQ.loading}
          invalid={Boolean(shown.district_code)}
          describedBy={describe(
            districtReason && `${ids.district}-desc`,
            shown.district_code && errId("district")
          )}
        />
        {districtReason ? (
          <FieldDescription id={`${ids.district}-desc`}>
            {districtReason}
          </FieldDescription>
        ) : null}
        {shown.district_code ? (
          <FieldError id={errId("district")}>{shown.district_code}</FieldError>
        ) : null}
      </Field>
      <Field
        data-invalid={Boolean(shown.subdistrict_code) || undefined}
        data-disabled={!value.district_code || undefined}
      >
        <FieldLabel htmlFor={ids.subdistrict}>{labels.subdistrict}</FieldLabel>
        <AddressPicker
          id={ids.subdistrict}
          label={labels.subdistrict}
          options={subdistrictOptions}
          value={value.subdistrict_code}
          onValueChange={onSubdistrict}
          placeholder={t("pick", { k: labels.subdistrict })}
          searchPlaceholder={t("searchHere", { k: labels.subdistrict })}
          emptyText={t("noOptions")}
          groupHeading={
            narrowedHere &&
            narrowedHere.length > 1 &&
            result?.status === "found" &&
            district
              ? `${result.postal_code} · ${locale === "th" ? t(kinds.district) : ""}${nameIn(district.name, locale)}`
              : undefined
          }
          disabled={disabled || !value.district_code}
          loading={subdistrictsQ.loading}
          invalid={Boolean(shown.subdistrict_code)}
          describedBy={describe(
            (subdistrictReason || narrowDesc) && `${ids.subdistrict}-desc`,
            shown.subdistrict_code && errId("subdistrict")
          )}
        />
        {subdistrictReason || narrowDesc ? (
          <FieldDescription id={`${ids.subdistrict}-desc`}>
            {subdistrictReason ?? narrowDesc}
          </FieldDescription>
        ) : null}
        {shown.subdistrict_code ? (
          <FieldError id={errId("subdistrict")}>
            {shown.subdistrict_code}
          </FieldError>
        ) : null}
      </Field>
    </div>
  )

  const postalChoice = showPostalChoice ? (
    <Field>
      <FieldLabel id={`${ids.postalChoice}-label`}>
        {t("postalForArea")}
      </FieldLabel>
      <ToggleGroup
        type="single"
        variant="outline"
        aria-labelledby={`${ids.postalChoice}-label`}
        aria-describedby={`${ids.postalChoice}-desc`}
        value={value.postal_code ?? ""}
        onValueChange={onPostalOption}
        disabled={disabled}
        className="flex-wrap justify-start"
      >
        {offered!.map((p) => (
          <ToggleGroupItem
            key={p.postal_code}
            value={p.postal_code}
            className="tabular-nums"
          >
            {p.postal_code}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldDescription id={`${ids.postalChoice}-desc`}>
        {t("postalChoice", { n: offered!.length })}
      </FieldDescription>
      {shown.postal_code ? <FieldError>{shown.postal_code}</FieldError> : null}
    </Field>
  ) : null

  // Area first and search show the postal code as the result, not an input.
  const postalResult =
    mode !== "postal-first" && value.subdistrict_code && !showPostalChoice ? (
      <Field>
        <FieldLabel htmlFor={ids.postal}>{t("postalForArea")}</FieldLabel>
        <output id={ids.postal} tabIndex={-1} className="text-sm tabular-nums">
          {value.postal_code ??
            (offered && offered.length === 0 ? t("postalNone") : "")}
        </output>
        {shown.postal_code ? (
          <FieldError>{shown.postal_code}</FieldError>
        ) : null}
      </Field>
    ) : null

  return (
    <FieldSet
      ref={fieldsetRef}
      lang={locale}
      aria-busy={busy}
      disabled={disabled}
      className={cn("min-w-0", className)}
      onFocus={() => setActive(true)}
    >
      <FieldLegend>{legend ?? t("legendShip")}</FieldLegend>
      {mode === "search" ? (
        <AddressSearch
          id={`${id}-search`}
          client={client}
          locale={locale}
          t={t}
          showFacilityCodes={showFacilityCodes}
          disabled={disabled}
          onPick={onSearchPick}
          onFillManually={() => document.getElementById(ids.province)?.focus()}
        />
      ) : null}
      {mode === "postal-first" ? postalField : null}
      {notices}
      {choiceBlock}
      {areaFields}
      {postalChoice}
      {postalResult}
      {name ? (
        <>
          {(Object.keys(EMPTY) as Field[]).map((f) => (
            <input
              key={f}
              type="hidden"
              name={`${name}[${f}]`}
              value={value[f] ?? ""}
            />
          ))}
        </>
      ) : null}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {live}
      </div>
    </FieldSet>
  )
}

// Several address forms can share one <form> (shipping and tax invoice).
// Each reports its first invalid field for a submit; once they all have,
// focus goes to the earliest one on the page.
const invalidBySubmit = new WeakMap<Event, HTMLElement[]>()
function focusFirstInvalid(event: Event, el: HTMLElement) {
  const list = invalidBySubmit.get(event)
  if (list) {
    list.push(el)
    return
  }
  invalidBySubmit.set(event, [el])
  queueMicrotask(() => {
    const all = invalidBySubmit.get(event) ?? []
    all.sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
    all[0]?.focus()
  })
}

const sameValue = (a: AddressValue, b: AddressValue) =>
  a.province_code === b.province_code &&
  a.district_code === b.district_code &&
  a.subdistrict_code === b.subdistrict_code &&
  a.postal_code === b.postal_code

function codesOf(a: Area, postal: string | null): AddressValue {
  return {
    province_code: a.province.code,
    district_code: a.district.code,
    subdistrict_code: a.subdistrict.code,
    postal_code: postal,
  }
}

export type { District, Province, Subdistrict }
