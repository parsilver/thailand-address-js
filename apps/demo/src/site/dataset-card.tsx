import { SNAPSHOT } from "@farzai/thailand-address"
import { DatabaseIcon } from "lucide-react"

import { useT } from "@/lib/locale"
import { DATA_BASE, DATA_DOCS, DATA_LLMS } from "@/lib/site"

/** Where the data comes from: the pinned snapshot, its schema, and the sources it credits. */
export function DatasetCard() {
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
    <section
      aria-labelledby="dataset-card-title"
      className="flex gap-3 rounded-xl border p-4 text-sm"
    >
      <DatabaseIcon
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="flex flex-col gap-1.5">
        <h2 id="dataset-card-title" className="font-medium">
          {t("ข้อมูลที่อยู่", "The address data")}
        </h2>
        <p className="text-muted-foreground">
          {t("ล็อกไว้ที่ snapshot ", "Pinned to snapshot ")}
          <code className="font-mono text-foreground">{SNAPSHOT}</code>
          {t(
            " จาก DOPA ไปรษณีย์ไทย และชุดข้อมูลที่ทำการไปรษณีย์ของกระทรวง DE (CC-BY)",
            " from DOPA, Thailand Post and MDES's post-office dataset (CC-BY)."
          )}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <a className="underline underline-offset-4" href={l.href}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
