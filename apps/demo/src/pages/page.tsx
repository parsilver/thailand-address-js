import * as React from "react"

/** A page: one h1, a lead paragraph, then sections. */
export function Page({
  title,
  lead,
  children,
}: {
  title: React.ReactNode
  lead?: React.ReactNode
  children: React.ReactNode
}) {
  React.useEffect(() => {
    document.title = `${typeof title === "string" ? title : "Docs"} · thailand-address`
  }, [title])
  return (
    <article className="flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {lead ? (
          <p className="max-w-[65ch] text-lg text-muted-foreground">{lead}</p>
        ) : null}
      </header>
      {children}
    </article>
  )
}

export function Section({
  title,
  children,
}: {
  title: React.ReactNode
  children: React.ReactNode
}) {
  const id = React.useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-[70ch] flex-col gap-3 leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-[0.9em] [&_li]:ml-5 [&_ul]:list-disc">
      {children}
    </div>
  )
}
