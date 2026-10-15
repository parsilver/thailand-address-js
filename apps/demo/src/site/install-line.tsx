import * as React from "react"

import { cn } from "@/lib/utils"
import { useT } from "@/lib/locale"
import { INSTALL } from "@/lib/site"

/** The one-line install command: a muted prompt, a fading scroll, a text copy button. */
export function InstallLine({ className }: { className?: string }) {
  const t = useT()
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div
      className={cn(
        "flex max-w-170 min-w-0 items-center gap-3 rounded-lg bg-surface py-2.5 pr-2.5 pl-4 text-[13px]",
        className
      )}
    >
      <code
        aria-label={String(t("คำสั่งติดตั้ง", "Install command"))}
        tabIndex={0}
        className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto mask-[linear-gradient(90deg,#000_88%,transparent)] font-mono whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span aria-hidden className="text-muted-foreground select-none">
          ${" "}
        </span>
        {INSTALL}
      </code>
      <button
        type="button"
        onClick={copy}
        className="h-7 shrink-0 rounded-md bg-background px-2.5 text-xs font-medium shadow-[0_0_0_1px_var(--border)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {copied ? t("คัดลอกแล้ว", "Copied") : t("คัดลอก", "Copy")}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? t("คัดลอกแล้ว", "Copied") : ""}
      </span>
    </div>
  )
}
