import { ChevronDown } from "lucide-react"
import { useMemo } from "react"

import type { JoinedModel } from "#/shared/models"

import { INTERACTIVE_SURFACE_CLASS, MOBILE_TOUCH_TARGET_CLASS } from "#/lib/interaction-styles"
import { cn } from "#/lib/utils"

type ModelPickerProps = {
  models: Array<JoinedModel>
  selected: Array<string>
  onChange: (models: Array<string>) => void
  align?: "left" | "center"
  disabled?: boolean
}

export function ModelPicker({
  models,
  selected,
  onChange,
  align = "left",
  disabled = false,
}: ModelPickerProps) {
  const options = useMemo(
    () =>
      Array.from(new Map(models.map((model) => [model.slug, model.displayName])).entries()).sort(
        (left, right) => left[1].localeCompare(right[1]),
      ),
    [models],
  )
  const selectedSet = new Set(selected)

  function toggleModel(slug: string) {
    onChange(
      selectedSet.has(slug) ? selected.filter((model) => model !== slug) : [...selected, slug],
    )
  }

  return (
    <details
      className={cn(
        "group relative",
        align === "center" ? "mx-auto" : null,
        disabled ? "pointer-events-none opacity-50" : null,
      )}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.currentTarget.open = false
      }}
    >
      <summary
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex cursor-pointer list-none items-center gap-2 rounded-md border px-2.5 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:outline-none sm:text-xs ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`}
        onClick={(event) => {
          if (disabled) event.preventDefault()
        }}
      >
        Models
        <span className="text-muted-foreground">{selected.length}</span>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground h-3.5 w-3.5 transition-transform duration-200 ease-out group-open:rotate-180"
        />
      </summary>
      <div className="border-border bg-popover text-popover-foreground absolute top-12 left-0 z-30 max-h-72 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border p-1.5 sm:top-10">
        {options.map(([slug, displayName]) => (
          <label
            key={slug}
            className="focus-within:bg-muted hover:bg-muted active:bg-secondary flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm transition-colors duration-200 ease-out sm:min-h-8 sm:text-xs"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(slug)}
              onChange={() => toggleModel(slug)}
              className="accent-primary h-4 w-4 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            />
            <span className="truncate" title={displayName}>
              {displayName}
            </span>
          </label>
        ))}
      </div>
    </details>
  )
}
