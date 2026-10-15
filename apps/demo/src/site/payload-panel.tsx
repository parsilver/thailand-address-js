import type { AddressValue } from "@farzai/thailand-address"

import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useT } from "@/lib/locale"
import { htmlFields, jsonPayload, laravelRules } from "@/lib/payload"
import { LARAVEL_PACKAGE } from "@/lib/site"

import { CodeBlock } from "./code-block"
import { FORMAT_LIST, FORMAT_TRIGGER } from "./line-tabs"

/**
 * What the form produces, three ways: JSON, the posted form fields, and the
 * Laravel rules that check them. `aside` sits beside the form with a small
 * label; `section` follows the form as a page section with an h2.
 */
export function PayloadPanel({
  addresses,
  variant = "aside",
}: {
  addresses: Record<string, AddressValue>
  variant?: "aside" | "section"
}) {
  const t = useT()
  const names = Object.keys(addresses)
  const title = t("สิ่งที่ฟอร์มส่ง", "What the form sends")
  return (
    <Tabs defaultValue="json" className="min-w-0 gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          className={cn(
            variant === "aside"
              ? "text-[13px] font-normal text-muted-foreground"
              : "text-xl leading-snug font-semibold tracking-[-0.01em]"
          )}
        >
          {title}
        </h2>
        <TabsList variant="line" className={FORMAT_LIST}>
          <TabsTrigger value="json" className={FORMAT_TRIGGER}>
            JSON
          </TabsTrigger>
          <TabsTrigger
            value="html"
            className={FORMAT_TRIGGER}
            aria-label={String(t("ฟิลด์ฟอร์ม HTML", "HTML form fields"))}
          >
            HTML
          </TabsTrigger>
          <TabsTrigger value="laravel" className={FORMAT_TRIGGER}>
            Laravel
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="json">
        <CodeBlock label="JSON" code={jsonPayload(addresses)} />
      </TabsContent>
      <TabsContent value="html">
        <CodeBlock
          label={String(t("ฟิลด์ฟอร์ม HTML", "HTML form fields"))}
          code={names.map((n) => htmlFields(n, addresses[n]!)).join("\n\n")}
        />
      </TabsContent>
      <TabsContent value="laravel" className="flex flex-col gap-3">
        <CodeBlock label="Laravel" code={laravelRules(names)} />
        <p className="text-[13px] text-muted-foreground">
          {t(
            "ข้อความแจ้งข้อผิดพลาดของฟอร์มมีความหมายตรงกับกฎเหล่านี้ ตำบลที่ไม่มีรหัสไปรษณีย์ (ราว 50 แห่ง) ต้องใช้ nullable แทน required สำหรับ postal_code",
            "The form's own messages mean the same as these rules. For the about 50 subdistricts with no postal code, use nullable instead of required on postal_code."
          )}
        </p>
      </TabsContent>
      <p className="text-[13px] text-muted-foreground">
        {t("ตรวจฝั่งเซิร์ฟเวอร์ด้วย ", "Validate on the server with ")}
        <a
          className="rounded-sm text-site-accent underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          href={LARAVEL_PACKAGE}
        >
          farzai/thailand-address
        </a>
      </p>
    </Tabs>
  )
}
