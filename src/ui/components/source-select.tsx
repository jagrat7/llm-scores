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
      <p className="text-muted-foreground flex items-center gap-1.5 truncate px-2 text-sm sm:text-xs">
        <span aria-hidden="true">via</span>
        <SourceLogo source={value} className="size-3" accent />
        <span className="truncate">{sourceLabel(value)}</span>
      </p>
    )
  }

  return (
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
        <span aria-hidden="true">via</span>
        <SelectValue />
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
  )
}
