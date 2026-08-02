import { TriangleAlert } from "lucide-react"

import type { ModelsResponse } from "#/shared/models"

import { formatRelativeTime } from "#/lib/metrics"

export function SourceAttribution({ data }: { data: ModelsResponse }) {
  const cacheLabel =
    data.cacheAgeSeconds == null
      ? null
      : data.cacheAgeSeconds < 3600
        ? "cached <1h ago"
        : `cached ${Math.floor(data.cacheAgeSeconds / 3600)}h ago`

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
      <span aria-hidden="true">—</span>
      <span suppressHydrationWarning>fetched {formatRelativeTime(data.fetchedAt)}</span>
      {cacheLabel ? (
        <span className="border-border rounded-full border px-2 py-0.5 text-xs">{cacheLabel}</span>
      ) : null}
    </p>
  )
}

export function SourceNotices({ sources }: { sources: ModelsResponse["sources"] }) {
  const notices = [
    sources.deepswe === "error"
      ? "DeepSWE unreachable — showing Artificial Analysis data only"
      : null,
    sources.artificialAnalysis === "error"
      ? "Artificial Analysis unreachable — showing DeepSWE data only"
      : null,
  ].filter((notice): notice is string => notice != null)

  return notices.length > 0 ? (
    <div className="text-destructive flex flex-col gap-1.5 text-sm sm:text-xs" role="status">
      {notices.map((notice) => (
        <span key={notice} className="flex items-start gap-2">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
            strokeWidth={1.75}
          />
          <span>{notice}</span>
        </span>
      ))}
    </div>
  ) : null
}

export function SourceFooter({
  children,
  data,
}: {
  children?: React.ReactNode
  data: ModelsResponse
}) {
  return (
    <footer className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <SourceAttribution data={data} />
        <SourceNotices sources={data.sources} />
      </div>
      {children}
    </footer>
  )
}
