import { RiArrowUpDownLine } from "@remixicon/react"

import type { Axis } from "#/ui/components/metric-select"
import type { Metric } from "#/ui/lib/metrics"
import type { Model, ProviderName } from "#/ui/lib/orpc-client"

import { MetricSelect } from "#/ui/components/metric-select"
import { ModelPicker } from "#/ui/components/model-picker"
import { SourceSelect } from "#/ui/components/source-select"
import { Button } from "#/ui/components/ui/button"
import { Separator } from "#/ui/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "#/ui/components/ui/tooltip"
import { MOBILE_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { METRICS } from "#/ui/lib/metrics"
import { cn } from "#/ui/lib/utils"

export const AXIS_KEYS = ["x", "y", "z"] as const

export type AxisKey = (typeof AXIS_KEYS)[number]

const AXIS_LABELS: Record<AxisKey, Axis> = { x: "X", y: "Y", z: "Z" }
/** An empty `metric` is the unfilled Z slot that offers the third dimension. */
export type AxisSetting = { metric: Metric | null; source: ProviderName | null }
export type AxisState = Record<AxisKey, AxisSetting>

/** Ink and weight make the axis letters a structural spine; size keeps them under the metric. */
const AXIS_LABEL_CLASS = "text-foreground text-xs font-semibold"

export function AxisControls({
  axes,
  onAxisChange,
  onSwapAxes,
  models,
  selected,
  onSelectedChange,
  disabled = false,
}: {
  axes: AxisState
  onAxisChange: (axis: AxisKey, change: Partial<AxisSetting>) => void
  onSwapAxes: () => void
  models: Array<Model>
  selected: Array<string>
  onSelectedChange: (models: Array<string>) => void
  disabled?: boolean
}) {
  const used = AXIS_KEYS.map((key) => axes[key].metric).filter(
    (metric): metric is Metric => metric != null,
  )
  const hasSpareMetric = METRICS.some((metric) => !used.includes(metric))

  return (
    <div className="mx-auto mb-6 grid w-full max-w-lg grid-cols-[2rem_1rem_minmax(0,1fr)_minmax(0,auto)] items-center gap-x-2 gap-y-1.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSwapAxes}
              aria-label="Swap the X and Y axes"
              disabled={disabled}
              className={cn(
                "text-muted-foreground row-span-2 justify-self-start",
                MOBILE_TOUCH_TARGET_CLASS,
              )}
            >
              <RiArrowUpDownLine aria-hidden="true" />
            </Button>
          }
        />
        <TooltipContent>Swap X and Y</TooltipContent>
      </Tooltip>

      {AXIS_KEYS.map((key) => {
        const { metric, source } = axes[key]

        return (
          <AxisRow
            key={key}
            axis={AXIS_LABELS[key]}
            metric={metric}
            source={source}
            unavailable={used.filter((candidate) => candidate !== metric)}
            onMetricChange={(next) => onAxisChange(key, { metric: next })}
            onSourceChange={(next) => onAxisChange(key, { source: next })}
            onRemove={
              key === "z" && metric != null ? () => onAxisChange(key, { metric: null }) : undefined
            }
            leadingSpacer={key === "z"}
            disabled={disabled || (metric == null && !hasSpareMetric)}
          />
        )
      })}

      <Separator className="col-span-4 my-2" />

      <div />
      <div />
      <ModelPicker
        models={models}
        selected={selected}
        onChange={onSelectedChange}
        disabled={disabled}
      />
      <div />
    </div>
  )
}

function AxisRow({
  axis,
  metric,
  source,
  unavailable,
  onMetricChange,
  onSourceChange,
  onRemove,
  leadingSpacer,
  disabled,
}: {
  axis: Axis
  metric: Metric | null
  source: ProviderName | null
  unavailable: ReadonlyArray<Metric>
  onMetricChange: (metric: Metric) => void
  onSourceChange: (source: ProviderName) => void
  onRemove?: () => void
  leadingSpacer: boolean
  disabled: boolean
}) {
  return (
    <>
      {leadingSpacer ? <div /> : null}
      <span aria-hidden="true" className={AXIS_LABEL_CLASS}>
        {axis}
      </span>
      <MetricSelect
        axis={axis}
        value={metric}
        onChange={onMetricChange}
        onRemove={onRemove}
        unavailable={unavailable}
        disabled={disabled}
      />
      {metric == null || source == null ? (
        <div />
      ) : (
        <SourceSelect
          axis={axis}
          metric={metric}
          value={source}
          onChange={onSourceChange}
          disabled={disabled}
        />
      )}
    </>
  )
}
