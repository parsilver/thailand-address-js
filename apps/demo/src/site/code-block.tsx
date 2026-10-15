import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/locale"

/** Code with a copy button. `label` names the block for screen readers. */
export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string
  label: string
  className?: string
}) {
  const t = useT()
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className={cn("relative rounded-lg border bg-muted/40", className)}>
      <pre
        aria-label={label}
        tabIndex={0}
        className="overflow-x-auto p-4 pr-12 font-mono text-[13px] leading-relaxed"
      >
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        onClick={copy}
        aria-label={
          copied
            ? String(t("คัดลอกแล้ว", "Copied"))
            : String(t("คัดลอก", "Copy"))
        }
      >
        {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
      </Button>
      <span className="sr-only" aria-live="polite">
        {copied ? t("คัดลอกแล้ว", "Copied") : ""}
      </span>
    </div>
  )
}
