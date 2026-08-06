import { Plus, X } from "lucide-react"

import type { Metric } from "#/ui/lib/metrics"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/ui/components/ui/select"
import {
  INTERACTIVE_SURFACE_CLASS,
  MOBILE_TOUCH_TARGET_CLASS,
  PRIMARY_TOUCH_TARGET_CLASS,
} from "#/ui/lib/interaction-styles"
import { isMetric, METRICS, METRIC_CONFIG } from "#/ui/lib/metrics"
import { cn } from "#/ui/lib/utils"

export type Axis = "X" | "Y" | "Z"

/** The chosen metric is the loudest text on this surface; the chrome around it stays quiet. */
const CHIP_CLASS = `bg-background text-muted-foreground dark:bg-background dark:hover:bg-muted w-full justify-between gap-2 px-3 text-sm shadow-none focus-visible:outline-none ${PRIMARY_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`
const EMPTY_CHIP_CLASS =
  "border-primary/40 text-accent-foreground border-dashed hover:text-accent-foreground"

export function MetricSelect({
  axis,
  value,
  onChange,
  onRemove,
  unavailable = [],
  disabled = false,
}: {
  axis: Axis
  /** `null` renders the empty ghost slot that offers to add this axis. */
  value: Metric | null
  onChange: (metric: Metric) => void
  onRemove?: () => void
  unavailable?: ReadonlyArray<Metric>
  disabled?: boolean
}) {
  const isEmpty = value == null
  const label = isEmpty ? `Add ${axis} axis` : `${axis}-axis metric`

  return (
    <div className="flex w-full items-center">
      <Select
        value={value ?? ""}
        onValueChange={(metric) => {
          if (metric != null && isMetric(metric)) onChange(metric)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label={label}
          className={cn(
            CHIP_CLASS,
            isEmpty ? EMPTY_CHIP_CLASS : null,
            onRemove ? "rounded-r-none pr-2" : null,
          )}
        >
          <span className="sr-only">{label}</span>
          {isEmpty ? (
            <span aria-hidden="true" className="flex items-center gap-2 font-semibold">
              <Plus className="text-primary h-4 w-4" />
              Add {axis} axis
            </span>
          ) : (
            <SelectValue className="text-foreground font-semibold" />
          )}
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          align="start"
          className="duration-200 ease-out motion-reduce:animate-none"
        >
          {METRICS.map((metric) => (
            <SelectItem
              key={metric}
              value={metric}
              disabled={unavailable.includes(metric)}
              className={MOBILE_TOUCH_TARGET_CLASS}
            >
              {METRIC_CONFIG[metric].shortLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${axis} axis and return to the 2D chart`}
          title={`Remove ${axis} axis`}
          className={`border-input text-muted-foreground -ml-px inline-flex w-9 items-center justify-center rounded-md rounded-l-none border sm:h-9 sm:w-8 ${PRIMARY_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`}
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
