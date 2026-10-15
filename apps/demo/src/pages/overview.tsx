import { InstallLine } from "@/site/install-line"
import { LiveDemo, type DemoMode } from "@/site/live-demo"
import { MODE_LIST, MODE_TRIGGER } from "@/site/line-tabs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useT } from "@/lib/locale"

import { useDocumentTitle } from "./page"

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
  const title = String(
    t(
      "ฟอร์มที่อยู่ไทย ที่เริ่มจากรหัสไปรษณีย์",
      "A Thai address form that starts from the postal code"
    )
  )
  useDocumentTitle(title)
  return (
    <>
      <section className="max-w-190 min-w-0 pt-8 pb-6 md:pt-18 md:pb-10">
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em] text-balance md:text-[40px]">
          {title}
        </h1>
        <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-muted-foreground md:mt-4 md:text-lg">
          {t(
            "คอมโพเนนต์ shadcn/ui พิมพ์ 5 หลัก ที่เหลือเติมเอง ส่งออกเป็นรหัส ไม่ใช่ชื่อ",
            "A shadcn/ui component. Type 5 digits and the rest fills in. It sends codes, not names."
          )}
        </p>
        <InstallLine className="mt-5 md:mt-7" />
      </section>
      <section
        aria-label={String(t("ลองใช้", "Try it"))}
        className="pt-2 pb-24 md:pt-6"
      >
        <Tabs defaultValue="postal-first" className="gap-6 md:gap-8">
          <TabsList
            variant="line"
            aria-label={String(t("รูปแบบฟอร์ม", "Form modes"))}
            className={MODE_LIST}
          >
            {MODES.map((m) => (
              <TabsTrigger
                key={m.value}
                value={m.value}
                className={MODE_TRIGGER}
              >
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
      </section>
    </>
  )
}
