import type { Metric } from "#/ui/lib/metrics"
import type { PlotAxis, PlotPoint } from "#/ui/lib/comparison-plot-data"

import { ModelLogo } from "#/ui/components/model-logo"
import { Badge } from "#/ui/components/ui/badge"
import { formatMetric, METRIC_CONFIG } from "#/ui/lib/metrics"

const SOURCE_ABBREVIATIONS = { DeepSWE: "D", "Artificial Analysis": "AA" } as const

export const SOURCE_LEGEND = "D DeepSWE · AA Artificial Analysis"

function sourceAbbreviation(point: PlotPoint, metric: Metric) {
  const source = point.model.sources[METRIC_CONFIG[metric].dataKey]

  return source == null ? null : SOURCE_ABBREVIATIONS[source]
}

/**
 * The active-point readout shared by both charts' floating popovers, so the 2D and
 * 3D renderers show the same values, units and provenance.
 */
export function PointDetails({
  axes,
  className,
  metrics,
  point,
}: {
  axes: ReadonlyArray<PlotAxis>
  className?: string
  metrics: Record<PlotAxis, Metric | null>
  point: PlotPoint
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 font-medium">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ background: point.color }}
        />
        <ModelLogo family={point.model.family} className="size-3.5 shrink-0" accent />
        <span className="truncate">{point.model.displayName}</span>
      </div>
      <p className="text-muted-foreground mt-1.5 text-xs">Effort · {point.model.effort}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
        {axes.map((axis) => {
          const metric = metrics[axis]

          if (metric == null) return null

          const abbreviation = sourceAbbreviation(point, metric)

          return (
            <div key={axis} className="contents">
              <dt className="text-muted-foreground text-xs">
                <span className="text-foreground font-semibold">{axis.toUpperCase()}</span>{" "}
                {METRIC_CONFIG[metric].label}
              </dt>
              <dd className="text-right text-sm font-medium tabular-nums">
                {formatMetric(point.values[axis], metric)}
                {abbreviation ? (
                  <Badge variant="outline" className="ml-1.5 px-1 py-0 text-[0.625rem] font-normal">
                    {abbreviation}
                  </Badge>
                ) : null}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
