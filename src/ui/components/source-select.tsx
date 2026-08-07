import type { Metric } from "#/ui/lib/metrics"
import type { ProviderName } from "#/ui/lib/orpc-client"

import { SourceLogo } from "#/ui/components/source-logo"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/ui/components/ui/select"
import { MOBILE_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { METRIC_CONFIG } from "#/ui/lib/metrics"
import { isSource, sourceLabel } from "#/ui/lib/sources"
import { cn } from "#/ui/lib/utils"

/**
 * "via" is the shared left edge of every row, so it carries no padding — the
 * inset belongs to what follows it, matching the select trigger's own `px-2`
 * so the marks line up whether the row is a control or plain attribution.
 */
const VIA_ROW_CLASS = "text-muted-foreground flex items-center gap-1.5 text-sm sm:text-xs"
const VIA_CONTENT_CLASS = "flex items-center gap-1.5 truncate px-2"

/**
 * A metric published by a single provider has no choice to offer, so it reads as
 * plain attribution. Only a genuinely contested metric becomes a control.
 */
export function SourceSelect({
  axis,
  metric,
  value,
  onChange,
  disabled = false,
}: {
  axis: string
  metric: Metric
  value: ProviderName
  onChange: (source: ProviderName) => void
  disabled?: boolean
}) {
  const { sources } = METRIC_CONFIG[metric]

  if (sources.length < 2) {
    return (
      <p className={VIA_ROW_CLASS}>
        <span aria-hidden="true">via</span>
        <span className={cn(VIA_CONTENT_CLASS, MOBILE_TOUCH_TARGET_CLASS)}>
          <SourceLogo source={value} className="size-3" accent />
          <span className="truncate">{sourceLabel(value)}</span>
        </span>
      </p>
    )
  }

  return (
    <p className={VIA_ROW_CLASS}>
      <span aria-hidden="true">via</span>
      <Select
        value={value}
        onValueChange={(source) => {
          if (source != null && isSource(source)) onChange(source)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          aria-label={`${axis}-axis data source`}
          className={cn(
            "text-muted-foreground hover:border-input hover:bg-muted hover:text-foreground gap-1.5 border-transparent bg-transparent px-2 text-sm shadow-none sm:text-xs",
            MOBILE_TOUCH_TARGET_CLASS,
          )}
        >
          {/* Base UI resolves the label from the raw value, so the mark is rendered here. */}
          <SelectValue>
            {(selected: ProviderName) => (
              <>
                <SourceLogo source={selected} className="size-3" />
                {sourceLabel(selected)}
              </>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          align="start"
          className="duration-200 ease-out motion-reduce:animate-none"
        >
          {sources.map((source) => (
            <SelectItem key={source} value={source} className={MOBILE_TOUCH_TARGET_CLASS}>
              <SourceLogo source={source} className="size-3" />
              {sourceLabel(source)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </p>
  )
}
