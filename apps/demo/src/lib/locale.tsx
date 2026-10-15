import * as React from "react"

import type { Locale } from "@/registry/address-form/address-form-copy"

const KEY = "thailand-address:locale"
const LocaleContext = React.createContext<{
  locale: Locale
  setLocale: (l: Locale) => void
}>({
  locale: "th",
  setLocale: () => {},
})

function initial(): Locale {
  const fromUrl = new URLSearchParams(location.search).get("lang")
  if (fromUrl === "th" || fromUrl === "en") return fromUrl
  const saved = localStorage.getItem(KEY)
  return saved === "en" ? "en" : "th"
}

/** The site language. The forms on the page follow it too. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(initial)
  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(KEY, l)
  }, [])
  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const value = React.useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  )
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export const useLocale = () => React.useContext(LocaleContext)

/** Pick the string for the current site language. */
export function useT() {
  const { locale } = useLocale()
  return React.useCallback(
    (th: React.ReactNode, en: React.ReactNode) => (locale === "th" ? th : en),
    [locale]
  )
}
