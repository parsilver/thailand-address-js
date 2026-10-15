import type { AddressValue } from "@farzai/thailand-address"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useT } from "@/lib/locale"
import { htmlFields, jsonPayload, laravelRules } from "@/lib/payload"
import { LARAVEL_PACKAGE } from "@/lib/site"

import { CodeBlock } from "./code-block"

/** What the form produces, three ways: JSON, the posted form fields, and the Laravel rules that check them. */
export function PayloadPanel({
  addresses,
}: {
  addresses: Record<string, AddressValue>
}) {
  const t = useT()
  const names = Object.keys(addresses)
  return (
    <Tabs defaultValue="json" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">
          {t("ข้อมูลที่ฟอร์มส่ง", "What the form sends")}
        </h2>
        <TabsList>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="html">
            {t("ฟิลด์ฟอร์ม HTML", "HTML form fields")}
          </TabsTrigger>
          <TabsTrigger value="laravel">Laravel</TabsTrigger>
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
      <TabsContent value="laravel" className="flex flex-col gap-2">
        <CodeBlock label="Laravel" code={laravelRules(names)} />
        <p className="text-sm text-muted-foreground">
          {t("กฎเหล่านี้มาจาก ", "These rules come from ")}
          <a className="underline underline-offset-4" href={LARAVEL_PACKAGE}>
            farzai/thailand-address
          </a>
          {t(
            " (composer) ข้อความแจ้งข้อผิดพลาดของฟอร์มมีความหมายตรงกับกฎเหล่านี้",
            " on Composer. The form's own messages mean the same as these rules."
          )}{" "}
          {t(
            "ตำบลที่ไม่มีรหัสไปรษณีย์ (ราว 50 แห่ง) ต้องใช้ nullable แทน required สำหรับ postal_code",
            "For the about 50 subdistricts with no postal code, use nullable instead of required on postal_code."
          )}
        </p>
      </TabsContent>
    </Tabs>
  )
}
