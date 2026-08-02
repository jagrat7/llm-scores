export function SourceAttribution() {
  return (
    <p className="text-muted-foreground flex min-h-6 flex-wrap items-center gap-x-1.5 text-sm sm:text-xs">
      <a
        href="https://deepswe.datacurve.ai/"
        target="_blank"
        rel="noreferrer"
        className="decoration-border hover:text-foreground active:text-foreground inline-flex min-h-11 items-center underline underline-offset-2 sm:min-h-6"
      >
        DeepSWE (Datacurve)
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="https://artificialanalysis.ai/"
        target="_blank"
        rel="noreferrer"
        className="decoration-border hover:text-foreground active:text-foreground inline-flex min-h-11 items-center underline underline-offset-2 sm:min-h-6"
      >
        Artificial Analysis
      </a>
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
