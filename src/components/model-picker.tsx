import { ChevronDown } from 'lucide-react'
import { useMemo } from 'react'

import type { JoinedModel } from '#/shared/models'

import { INTERACTIVE_SURFACE_CLASS, MOBILE_TOUCH_TARGET_CLASS } from '#/lib/interaction-styles'
import { cn } from '#/lib/utils'

type ModelPickerProps = {
  models: Array<JoinedModel>
  selected: Array<string>
  onChange: (models: Array<string>) => void
  align?: 'left' | 'center'
  disabled?: boolean
}

export function ModelPicker({
  models,
  selected,
  onChange,
  align = 'left',
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
        'group relative',
        align === 'center' ? 'mx-auto' : null,
        disabled ? 'pointer-events-none opacity-50' : null,
      )}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.currentTarget.open = false
      }}
    >
      <summary
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`flex cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:text-xs ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`}
        onClick={(event) => {
          if (disabled) event.preventDefault()
        }}
      >
        Models
        <span className="text-muted-foreground">{selected.length}</span>
        <ChevronDown
          aria-hidden="true"
          className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ease-out group-open:rotate-180"
        />
      </summary>
      <div className="absolute top-12 left-0 z-30 max-h-72 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border border-border bg-popover p-1.5 text-popover-foreground sm:top-10">
        {options.map(([slug, displayName]) => (
          <label
            key={slug}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm transition-colors duration-200 ease-out focus-within:bg-muted hover:bg-muted active:bg-secondary sm:min-h-8 sm:text-xs"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(slug)}
              onChange={() => toggleModel(slug)}
              className="h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
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
