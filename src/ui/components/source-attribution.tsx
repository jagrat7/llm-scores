import { SourceLogo } from "#/ui/components/source-logo"

/** The two providers the whole app reads from, in the order the charts cite them. */
const SOURCES = [
  { source: "deepswe", href: "https://deepswe.datacurve.ai/", label: "DeepSWE (Datacurve)" },
  {
    source: "artificialAnalysis",
    href: "https://artificialanalysis.ai/",
    label: "Artificial Analysis",
  },
] as const

/** A credit line, so it sits on the annotation step rather than competing with the data. */
const SOURCE_LINK_CLASS =
  "group/mark decoration-border hover:text-foreground active:text-foreground min-h-11 inline-flex items-center gap-1.5 underline underline-offset-2 sm:min-h-6"

export function SourceAttribution() {
  return (
    <p className="text-muted-foreground flex min-h-6 flex-wrap items-center gap-x-1.5 text-sm sm:text-xs">
      {SOURCES.map(({ source, href, label }, index) => (
        <span key={source} className="contents">
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <a href={href} target="_blank" rel="noreferrer" className={SOURCE_LINK_CLASS}>
            <SourceLogo source={source} className="size-3" />
            {label}
          </a>
        </span>
      ))}
    </p>
  )
}

export function SourceFooter({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <SourceAttribution />
      {children}
    </footer>
  )
}
