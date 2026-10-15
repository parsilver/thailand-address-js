import { DatasetCard } from "@/site/dataset-card"
import { CodeBlock } from "@/site/code-block"
import { LiveDemo, type DemoMode } from "@/site/live-demo"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useT } from "@/lib/locale"
import { INSTALL } from "@/lib/site"

import { Page } from "./page"

const MODES: { value: DemoMode; th: string; en: string }[] = [
  {
    value: "postal-first",
    th: "เริ่มจากรหัสไปรษณีย์",
    en: "Postal code first",
  },
  { value: "area-first", th: "เลือกพื้นที่ก่อน", en: "Area first" },
  { value: "search", th: "ค้นหา", en: "Search" },
  { value: "multiple", th: "หลายที่อยู่", en: "Multiple" },
]

export function OverviewPage() {
  const t = useT()
  return (
    <Page
      title={String(t("ฟอร์มที่อยู่ไทย", "Thai address form"))}
      lead={t(
        "คอมโพเนนต์ shadcn/ui สำหรับที่อยู่ไทย พิมพ์รหัสไปรษณีย์แล้วที่เหลือเติมให้เอง ส่งออกเป็นรหัส ไม่ใช่ชื่อ",
        "A shadcn/ui component for Thai addresses. Type a postal code and the rest fills in. It outputs codes, not names."
      )}
    >
      <CodeBlock
        label={String(t("คำสั่งติดตั้ง", "Install command"))}
        code={INSTALL}
      />
      <Tabs defaultValue="postal-first" className="gap-4">
        <TabsList
          aria-label={String(t("รูปแบบฟอร์ม", "Form modes"))}
          className="max-w-full overflow-x-auto"
        >
          {MODES.map((m) => (
            <TabsTrigger key={m.value} value={m.value}>
              {t(m.th, m.en)}
            </TabsTrigger>
          ))}
        </TabsList>
        {MODES.map((m) => (
          <TabsContent key={m.value} value={m.value}>
            <LiveDemo mode={m.value} />
          </TabsContent>
        ))}
      </Tabs>
      <DatasetCard />
    </Page>
  )
}
