import * as React from "react"
import { Link, useLocation } from "wouter"
import { MenuIcon, MoonIcon, SunIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale, useT } from "@/lib/locale"
import { REPO } from "@/lib/site"

import { NAV } from "./nav"

function useTheme() {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("dark")
  )
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("thailand-address-demo:theme", next ? "dark" : "light")
  }
  return { dark, toggle }
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const [path] = useLocation()
  const { locale } = useLocale()
  return (
    <nav
      aria-label={locale === "th" ? "เมนูหลัก" : "Main"}
      className="flex flex-col gap-6 text-sm"
    >
      {NAV.map((g) => (
        <div key={g.en} className="flex flex-col gap-1">
          <h2 className="px-2 font-medium">{g[locale]}</h2>
          <ul className="flex flex-col">
            {g.items.map((i) => {
              const current = path === i.href
              const cls = cn(
                "block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                current && "bg-muted font-medium text-foreground"
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

export function Layout({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useLocale()
  const t = useT()
  const { dark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [path] = useLocation()

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <div className="mx-auto flex min-h-svh max-w-7xl">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("ข้ามไปที่เนื้อหา", "Skip to content")}
      </a>
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 overflow-y-auto border-r px-4 py-6 md:block">
        <Link href="/" className="mb-6 block px-2 font-semibold">
          thailand-address
        </Link>
        <Nav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:justify-end md:border-b-0 md:px-10 md:pt-6">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={String(t("เมนู", "Menu"))}
                >
                  <MenuIcon aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto p-4">
                <SheetHeader className="px-2">
                  <SheetTitle>thailand-address</SheetTitle>
                </SheetHeader>
                <Nav onNavigate={() => setMenuOpen(false)} />
                <a
                  href={REPO}
                  className="px-2 text-sm underline underline-offset-4"
                >
                  GitHub
                </a>
              </SheetContent>
            </Sheet>
            <Link href="/" className="font-semibold whitespace-nowrap">
              thailand-address
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={locale}
              onValueChange={(v) => (v === "th" || v === "en") && setLocale(v)}
              aria-label={String(t("ภาษา", "Language"))}
            >
              <ToggleGroupItem value="th" lang="th">
                ไทย
              </ToggleGroupItem>
              <ToggleGroupItem value="en" lang="en">
                English
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              variant="ghost"
              size="icon-sm"
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
              size="sm"
              asChild
              className="hidden sm:inline-flex"
            >
              <a href={REPO}>GitHub</a>
            </Button>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-8 outline-none md:px-10 md:pt-4 md:pb-16"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
