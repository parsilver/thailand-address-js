import * as React from "react"
import { Link, useLocation } from "wouter"
import { ChevronDownIcon, MenuIcon, MoonIcon, SunIcon } from "lucide-react"
import { SNAPSHOT } from "@farzai/thailand-address"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useLocale, useT } from "@/lib/locale"
import { DATA_BASE, DATA_DOCS, DATA_LLMS, REPO } from "@/lib/site"

import { NAV, groupOf, neighbours } from "./nav"

/** Neutral focus ring for every link and button in the site chrome. */
const FOCUS =
  "rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

/** Content width and gutters, shared by the top bar, the page and the footer. */
const CONTAINER = "mx-auto w-full max-w-280 px-5 md:px-8"

function useTheme() {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("dark")
  )
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("thailand-address:theme", next ? "dark" : "light")
  }
  return { dark, toggle }
}

/** The top bar's two sections; each is current for every page under it. */
function useSections() {
  const t = useT()
  const [path] = useLocation()
  return [
    {
      href: "/examples/postal-first",
      label: t("ตัวอย่าง", "Examples"),
      current: path.startsWith("/examples/"),
    },
    {
      href: "/docs/installation",
      label: t("เอกสาร", "Docs"),
      current: path.startsWith("/docs/") || path.startsWith("/reference/"),
    },
  ]
}

function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
  const [path] = useLocation()
  const { locale } = useLocale()
  return (
    <nav aria-label={locale === "th" ? "เอกสาร" : "Docs"} className="text-sm">
      {NAV.map((g) => (
        <div key={g.en} className="mt-6 first:mt-0">
          <h2 className="mb-1.5 text-xs font-medium text-muted-foreground">
            {g[locale]}
          </h2>
          <ul className="border-l">
            {g.items.map((i) => {
              const current = path === i.href
              const cls = cn(
                "-ml-px block border-l-2 border-transparent py-1 pl-3 text-muted-foreground hover:text-foreground",
                FOCUS,
                "rounded-none",
                current && "border-site-accent text-foreground"
              )
              return (
                <li key={i.href}>
                  {i.href.endsWith(".txt") ? (
                    <a href={i.href} className={cls}>
                      {i[locale]}
                    </a>
                  ) : (
                    <Link
                      href={i.href}
                      className={cls}
                      aria-current={current ? "page" : undefined}
                      onClick={onNavigate}
                    >
                      {i[locale]}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function TopBar({
  onMenu,
}: {
  onMenu: (e: React.MouseEvent<HTMLElement>) => void
}) {
  const { locale, setLocale } = useLocale()
  const t = useT()
  const { dark, toggle } = useTheme()
  const sections = useSections()
  return (
    <header
      className={cn(
        CONTAINER,
        "flex h-14 items-center justify-between md:h-16"
      )}
    >
      <Link
        href="/"
        className={cn(
          FOCUS,
          "flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em]"
        )}
      >
        <span aria-hidden className="size-2 rounded-[2px] bg-site-accent" />
        thailand-address
      </Link>
      <nav
        aria-label={String(t("เมนูหลัก", "Main"))}
        className="flex items-center gap-1 text-sm md:gap-7"
      >
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={s.current ? "true" : undefined}
            className={cn(
              FOCUS,
              "hidden text-muted-foreground hover:text-foreground md:inline",
              s.current && "text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
        <a
          href={REPO}
          className={cn(
            FOCUS,
            "hidden text-muted-foreground hover:text-foreground md:inline"
          )}
        >
          GitHub
        </a>
        <span className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-[13px] font-normal text-muted-foreground"
            lang={locale === "th" ? "en" : "th"}
            aria-label={locale === "th" ? "English" : "ภาษาไทย"}
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
          >
            {locale === "th" ? "EN" : "ไทย"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={toggle}
            aria-label={String(
              dark
                ? t("ใช้ธีมสว่าง", "Use light theme")
                : t("ใช้ธีมมืด", "Use dark theme")
            )}
          >
            {dark ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground md:hidden"
            onClick={onMenu}
            aria-haspopup="dialog"
            aria-label={String(t("เมนู", "Menu"))}
          >
            <MenuIcon aria-hidden />
          </Button>
        </span>
      </nav>
    </header>
  )
}

/**
 * The mobile menu. Two different buttons open it (the menu icon and the
 * docs crumb), so neither is a SheetTrigger and Radix has nothing to hand
 * focus back to on close; `returnFocusTo` is whichever one opened it.
 */
function Menu({
  open,
  onOpenChange,
  returnFocusTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocusTo: React.RefObject<HTMLElement | null>
}) {
  const sections = useSections()
  const close = () => onOpenChange(false)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 gap-6 overflow-y-auto p-5"
        onCloseAutoFocus={(e) => {
          const opener = returnFocusTo.current
          if (opener?.isConnected) {
            e.preventDefault()
            opener.focus()
          }
        }}
      >
        <SheetHeader className="p-0">
          <SheetTitle>thailand-address</SheetTitle>
        </SheetHeader>
        <ul className="flex flex-col gap-1 text-sm">
          {sections.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                onClick={close}
                className={cn(FOCUS, "block py-1")}
              >
                {s.label}
              </Link>
            </li>
          ))}
          <li>
            <a href={REPO} className={cn(FOCUS, "block py-1")}>
              GitHub
            </a>
          </li>
        </ul>
        <DocsNav onNavigate={close} />
      </SheetContent>
    </Sheet>
  )
}

/** Under 768px the docs sidebar folds into this row, which opens the menu. */
function Crumb({
  onOpen,
}: {
  onOpen: (e: React.MouseEvent<HTMLElement>) => void
}) {
  const [path] = useLocation()
  const { locale } = useLocale()
  const t = useT()
  const group = groupOf(path)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={cn(
        FOCUS,
        "mb-7 flex min-h-10 w-full items-center justify-between rounded-none border-b pb-4 text-sm text-muted-foreground md:hidden"
      )}
    >
      <span>{group ? group[locale] : t("เอกสาร", "Docs")}</span>
      <span className="flex items-center gap-1 font-medium text-foreground">
        {t("ทุกหน้า", "All pages")}
        <ChevronDownIcon aria-hidden className="size-4" />
      </span>
    </button>
  )
}

function Pager() {
  const [path] = useLocation()
  const { locale } = useLocale()
  const t = useT()
  const { prev, next } = neighbours(path)
  if (!prev && !next) return null
  const cls = cn(FOCUS, "flex flex-col gap-0.5 py-1 hover:text-site-accent")
  return (
    <nav
      aria-label={String(t("ก่อนหน้าและถัดไป", "Previous and next"))}
      className="mt-16 flex justify-between gap-6 border-t pt-6 text-sm"
    >
      {prev ? (
        <Link href={prev.href} className={cls}>
          <span className="text-xs text-muted-foreground">
            {t("ก่อนหน้า", "Previous")}
          </span>
          {prev[locale]}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className={cn(cls, "text-right")}>
          <span className="text-xs text-muted-foreground">
            {t("ถัดไป", "Next")}
          </span>
          {next[locale]}
        </Link>
      ) : null}
    </nav>
  )
}

function Footer() {
  const t = useT()
  const links = [
    { href: DATA_DOCS, label: t("คำอธิบายฟิลด์", "Field docs") },
    { href: `${DATA_BASE}/schema.json`, label: "schema.json" },
    { href: DATA_LLMS, label: "llms.txt" },
    {
      href: `${DATA_DOCS}#:~:text=Sources%2C%20licences`,
      label: t("แหล่งข้อมูลและสัญญาอนุญาต", "Sources and licences"),
    },
  ]
  return (
    <footer className={CONTAINER}>
      <div className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-t pt-7 pb-12 text-[13px] text-muted-foreground">
        <p>
          {t("ข้อมูลล็อกไว้ที่ snapshot ", "Data pinned to snapshot ")}
          <span className="font-mono">{SNAPSHOT}</span>
          {t(
            " · DOPA, ไปรษณีย์ไทย, MDES (CC-BY)",
            " · DOPA, Thailand Post, MDES (CC-BY)"
          )}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <a
                className={cn(FOCUS, "underline underline-offset-4")}
                href={l.href}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const t = useT()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuOpener = React.useRef<HTMLElement | null>(null)
  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    menuOpener.current = e.currentTarget
    setMenuOpen(true)
  }
  const [path] = useLocation()
  const home = path === "/"

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("ข้ามไปที่เนื้อหา", "Skip to content")}
      </a>
      <TopBar onMenu={openMenu} />
      <Menu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        returnFocusTo={menuOpener}
      />
      <main
        id="main"
        tabIndex={-1}
        className={cn(CONTAINER, "flex-1 outline-none")}
      >
        {home ? (
          children
        ) : (
          <div className="pt-5 pb-24 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-18 md:pt-10">
            <aside className="sticky top-6 hidden self-start md:block">
              <DocsNav />
            </aside>
            <div className="max-w-180 min-w-0">
              <Crumb onOpen={openMenu} />
              {children}
              <Pager />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
