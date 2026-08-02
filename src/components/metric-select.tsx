import type { Metric } from "#/lib/metrics"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"
import { INTERACTIVE_SURFACE_CLASS, MOBILE_TOUCH_TARGET_CLASS } from "#/lib/interaction-styles"
import { isMetric, METRICS, METRIC_CONFIG } from "#/lib/metrics"

export function MetricSelect({
  axis,
  value,
  onChange,
  disabled = false,
}: {
  axis: "X" | "Y" | "Z"
  value: Metric
  onChange: (metric: Metric) => void
  disabled?: boolean
}) {
  const label = `${axis}-axis metric`

  return (
    <Select
      value={value}
      onValueChange={(metric) => {
        if (isMetric(metric)) onChange(metric)
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={`bg-background text-muted-foreground dark:bg-background dark:hover:bg-muted gap-2 px-2.5 text-sm shadow-none focus-visible:outline-none sm:text-xs ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`}
      >
        <span aria-hidden="true">{axis}</span>
        <span className="sr-only">{label}</span>
        <SelectValue className="text-foreground font-medium" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="duration-200 ease-out motion-reduce:animate-none"
      >
        {METRICS.map((metric) => (
          <SelectItem key={metric} value={metric} className={MOBILE_TOUCH_TARGET_CLASS}>
            {METRIC_CONFIG[metric].shortLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
