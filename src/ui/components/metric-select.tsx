import { RiAddLine, RiCloseLine } from "@remixicon/react"

import type { Metric } from "#/ui/lib/metrics"

import { Button } from "#/ui/components/ui/button"
import { ButtonGroup } from "#/ui/components/ui/button-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/ui/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "#/ui/components/ui/tooltip"
import { MOBILE_TOUCH_TARGET_CLASS, PRIMARY_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { isMetric, METRICS, METRIC_CONFIG } from "#/ui/lib/metrics"
import { cn } from "#/ui/lib/utils"

export type Axis = "X" | "Y" | "Z"

/** The chosen metric is the loudest text on this surface; the chrome around it stays quiet. */
const CHIP_CLASS = `text-muted-foreground w-full justify-between gap-2 px-3 text-sm shadow-none hover:bg-muted hover:text-foreground ${PRIMARY_TOUCH_TARGET_CLASS}`
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
    <ButtonGroup className="w-full">
      <Select
        value={value ?? ""}
        onValueChange={(metric) => {
          if (metric != null && isMetric(metric)) onChange(metric)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label={label}
          className={cn(CHIP_CLASS, isEmpty ? EMPTY_CHIP_CLASS : null)}
        >
          <span className="sr-only">{label}</span>
          {isEmpty ? (
            <span aria-hidden="true" className="flex items-center gap-2 font-semibold">
              <RiAddLine className="text-primary size-4" />
              Add {axis} axis
            </span>
          ) : (
            <SelectValue className="text-foreground font-semibold">
              {(selected: Metric) => METRIC_CONFIG[selected].shortLabel}
            </SelectValue>
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
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onRemove}
                disabled={disabled}
                aria-label={`Remove ${axis} axis and return to the 2D chart`}
                className={cn("text-muted-foreground", PRIMARY_TOUCH_TARGET_CLASS)}
              >
                <RiCloseLine aria-hidden="true" />
              </Button>
            }
          />
          <TooltipContent>Remove {axis} axis</TooltipContent>
        </Tooltip>
      ) : null}
    </ButtonGroup>
  )
}
