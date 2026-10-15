import type { Area, PostalLookup } from "@farzai/thailand-address"

/** The last postal lookup the form ran, while it runs and after. */
export type LookupState = {
  pc: string
  facility: boolean
  status: "loading" | "done" | "error"
  result?: PostalLookup
  error?: unknown
}

/**
 * Everything the postal code implied for the fields below it, in one place,
 * so one action resets all of it: what the input shows, the last lookup, the
 * "filled from" note, the narrowed subdistrict list, and the combined area
 * choice. Keeping these as separate useState calls let a reset clear one and
 * leave a stale choice on screen.
 */
export type PostalState = {
  /** What the postal input shows; four typed digits are not a code yet. */
  input: string
  lookup: LookupState | null
  autofilledFrom: string | null
  /** One district's subdistricts that a code like 10200 narrowed the list to. */
  narrowed: Area[] | null
  /** The areas a code like 13240 spans, for the combined choice. */
  choice: Area[] | null
}

export type PostalAction =
  /** The user typed in the postal input: everything the old code implied goes. */
  | { type: "typed"; input: string }
  | { type: "lookup_start"; pc: string; facility: boolean }
  | { type: "lookup_done"; pc: string; facility: boolean; result: PostalLookup }
  | { type: "lookup_error"; pc: string; facility: boolean; error: unknown }
  /** A lookup is no longer wanted (a hand pick made it moot). */
  | { type: "lookup_cancel" }
  /** A pick set the postal code; the input shows it. */
  | { type: "set_input"; input: string }
  /**
   * A province or district was picked by hand. `keepTyped` keeps an unknown
   * typed code (and its lookup) so the area's real code can be offered.
   */
  | {
      type: "area_picked"
      level: "province" | "district"
      code: string
      keepTyped: boolean
    }
  /** The subdistrict was picked by hand. */
  | { type: "subdistrict_picked" }
  /** Clear everything, e.g. a value from the host, "ล้าง", or a form reset. */
  | { type: "reset"; input: string }

export const initialPostalState = (input: string): PostalState => ({
  input,
  lookup: null,
  autofilledFrom: null,
  narrowed: null,
  choice: null,
})

export function postalReducer(
  state: PostalState,
  action: PostalAction
): PostalState {
  switch (action.type) {
    case "typed":
      return initialPostalState(action.input)
    case "lookup_start":
      return {
        ...state,
        lookup: { pc: action.pc, facility: action.facility, status: "loading" },
      }
    case "lookup_done": {
      const { result } = action
      const lookup: LookupState = {
        pc: action.pc,
        facility: action.facility,
        status: "done",
        result,
      }
      if (result.status !== "found") return { ...state, lookup }
      if (result.shape === "single")
        return { ...state, lookup, autofilledFrom: result.postal_code }
      if (result.shape === "one_district")
        return {
          ...state,
          lookup,
          autofilledFrom: result.postal_code,
          narrowed: result.areas,
        }
      return { ...state, lookup, choice: result.areas }
    }
    case "lookup_error":
      return {
        ...state,
        lookup: {
          pc: action.pc,
          facility: action.facility,
          status: "error",
          error: action.error,
        },
      }
    case "lookup_cancel":
      return state.lookup?.status === "loading"
        ? { ...state, lookup: null }
        : state
    case "set_input":
      return { ...state, input: action.input }
    case "area_picked": {
      const keepNarrowed =
        action.level === "district" &&
        state.narrowed?.some((a) => a.district.code === action.code)
      const next: PostalState = {
        ...state,
        autofilledFrom: null,
        narrowed: keepNarrowed ? state.narrowed : null,
        choice: action.level === "province" ? null : state.choice,
      }
      return action.keepTyped ? next : { ...next, input: "", lookup: null }
    }
    case "subdistrict_picked":
      return {
        ...state,
        autofilledFrom: null,
        lookup: state.lookup?.status === "loading" ? null : state.lookup,
      }
    case "reset":
      return initialPostalState(action.input)
  }
}
