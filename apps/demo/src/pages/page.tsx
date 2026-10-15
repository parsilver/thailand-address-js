import * as React from "react"

/** Sets the browser tab title for a page. */
export function useDocumentTitle(title: React.ReactNode) {
  React.useEffect(() => {
    document.title = `${typeof title === "string" ? title : "Docs"} · thailand-address`
  }, [title])
}

/** A docs page: one h1, a lead paragraph, then sections 56px apart. */
export function Page({
  title,
  lead,
  children,
}: {
  title: React.ReactNode
  lead?: React.ReactNode
  children: React.ReactNode
}) {
  useDocumentTitle(title)
  return (
    <article className="flex flex-col gap-14 max-md:gap-11">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-balance md:text-[32px]">
          {title}
        </h1>
        {lead ? (
          <p className="text-[17px] leading-relaxed text-muted-foreground">
            {lead}
          </p>
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
    <section aria-labelledby={id} className="flex flex-col gap-3.5">
      <h2
        id={id}
        className="text-xl leading-snug font-semibold tracking-[-0.01em]"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 [&_a]:text-site-accent [&_a]:underline [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-[0.9em] [&_li]:ml-5 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5">
      {children}
    </div>
  )
}
