import type { CSSProperties } from "react"

import { RiCloseLine, RiSearchLine } from "@remixicon/react"
import { useEffect, useId, useMemo, useState } from "react"

import type { Model } from "#/ui/lib/orpc-client"

import { ModelLogo } from "#/ui/components/model-logo"
import { Button } from "#/ui/components/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "#/ui/components/ui/combobox"
import { InputGroupAddon } from "#/ui/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "#/ui/components/ui/popover"
import { MOBILE_TOUCH_TARGET_CLASS, PRIMARY_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { cn } from "#/ui/lib/utils"

type DotStyle = CSSProperties & { "--dot": string }

/**
 * Three rows of chips at the picker's width, which squares it up with the axis
 * rows beside it; the rest collapse into a count so the chart never gets pushed
 * down. Odd on purpose — it leaves the last row short enough for the overflow
 * count to sit beside a chip instead of claiming a row of its own.
 */
const VISIBLE_CHIP_LIMIT = 5

/**
 * The chips are loose badges below the search bar, not a field of their own. The
 * registry dresses `ComboboxChips` as an input surface, so the box comes off and
 * only the wrapping row survives.
 */
const CHIPS_RESET_CLASS =
  "min-h-0 rounded-none border-0 bg-transparent p-0 focus-within:border-transparent focus-within:ring-0 has-data-[slot=combobox-chip]:px-0 dark:bg-transparent"

/** The chart keys its series by family colour, so these dots are its legend. */
function ModelDot({ model }: { model: Model }) {
  const dotStyle: DotStyle = { "--dot": model.chartColor }

  return (
    <span
      aria-hidden="true"
      className="size-1.5 shrink-0 rounded-full bg-(--dot)"
      style={dotStyle}
    />
  )
}

type ModelPickerProps = {
  models: Array<Model>
  selected: Array<string>
  onChange: (models: Array<string>) => void
  className?: string
  disabled?: boolean
}

export function ModelPicker({
  models,
  selected,
  onChange,
  className,
  disabled = false,
}: ModelPickerProps) {
  const inputId = useId()
  const anchor = useComboboxAnchor()
  const [moreOpen, setMoreOpen] = useState(false)
  const options = useMemo(
    () =>
      Array.from(new Map(models.map((model) => [model.model, model])).values()).toSorted(
        (left, right) => left.displayName.localeCompare(right.displayName),
      ),
    [models],
  )
  const selectedSet = new Set(selected)
  const value = options.filter((option) => selectedSet.has(option.model))
  const hidden = value.slice(VISIBLE_CHIP_LIMIT)

  // Emptying the list from inside the popover unmounts its own trigger, so hand
  // focus back to the search bar rather than dropping it on the document.
  useEffect(() => {
    if (hidden.length > 0 || !moreOpen) return

    setMoreOpen(false)
    document.getElementById(inputId)?.focus()
  }, [hidden.length, moreOpen, inputId])

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <label htmlFor={inputId} className="sr-only">
        Models
      </label>
      <Combobox
        items={options}
        multiple
        value={value}
        onValueChange={(next: Array<Model>) => onChange(next.map((model) => model.model))}
        itemToStringLabel={(model: Model) => model.displayName}
        isItemEqualToValue={(item: Model, candidate: Model) => item.model === candidate.model}
        /* In multi-select Base UI treats the *last* value as the selected index and
           opens scrolled to it — alphabetical order made that a jump to the bottom.
           Highlighting the first item instead keeps the list where it starts. */
        autoHighlight
        disabled={disabled}
      >
        {/* The popup anchors to whatever it is told to; left alone it takes the
            `input`, which the leading icon insets from the bar's own edge. */}
        <div ref={anchor} className="w-full">
          <ComboboxInput
            id={inputId}
            placeholder="Search models"
            showTrigger={false}
            disabled={disabled}
            className={cn("w-full", PRIMARY_TOUCH_TARGET_CLASS)}
          >
            <InputGroupAddon align="inline-start">
              <RiSearchLine aria-hidden="true" className="text-muted-foreground size-3.5" />
            </InputGroupAddon>
          </ComboboxInput>
        </div>
        {value.length > 0 ? (
          <ComboboxChips className={CHIPS_RESET_CLASS}>
            <ComboboxValue>
              {(shown: Array<Model>) => (
                <>
                  {/* Chips remove by render index, so they have to stay in value order —
                      taking the head keeps every visible chip pointing at its own model. */}
                  {shown.slice(0, VISIBLE_CHIP_LIMIT).map((model) => (
                    <ComboboxChip key={model.model} className="h-7 sm:h-[calc(--spacing(4.75))]">
                      <ModelDot model={model} />
                      {model.displayName}
                    </ComboboxChip>
                  ))}
                </>
              )}
            </ComboboxValue>
            {hidden.length > 0 ? (
              <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                {/* Carries the chips' fill so it reads as a control among them
                    rather than as a caption sitting at the end of the row. */}
                <PopoverTrigger
                  render={
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Show ${hidden.length} more selected models`}
                      className="h-7 sm:h-[calc(--spacing(4.75))]"
                    />
                  }
                >
                  {hidden.length} more
                  <RiArrowDownSLine aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-1">
                  <ul className="flex flex-col">
                    {hidden.map((model) => (
                      <li
                        key={model.model}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
                      >
                        <ModelDot model={model} />
                        <span className="flex-1 truncate">{model.displayName}</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove ${model.displayName}`}
                          onClick={() => onChange(selected.filter((id) => id !== model.model))}
                        >
                          <RiCloseLine aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            ) : null}
          </ComboboxChips>
        ) : null}
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No models found.</ComboboxEmpty>
          <ComboboxList className="max-h-48">
            <ComboboxCollection>
              {(model: Model) => (
                <ComboboxItem
                  key={model.model}
                  value={model}
                  className={cn("group/mark", MOBILE_TOUCH_TARGET_CLASS)}
                >
                  <ModelLogo family={model.family} className="text-muted-foreground size-3.5" />
                  <span className="truncate">{model.displayName}</span>
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
