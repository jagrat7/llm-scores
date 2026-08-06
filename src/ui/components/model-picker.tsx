import { useMemo } from "react"

import type { Model } from "#/ui/lib/orpc-client"

import { ModelLogo } from "#/ui/components/model-logo"
import { Badge } from "#/ui/components/ui/badge"
import { Button } from "#/ui/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "#/ui/components/ui/combobox"
import { MOBILE_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { cn } from "#/ui/lib/utils"

type ModelPickerProps = {
  models: Array<Model>
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
      Array.from(new Map(models.map((model) => [model.model, model])).values()).toSorted(
        (left, right) => left.displayName.localeCompare(right.displayName),
      ),
    [models],
  )
  const selectedSet = new Set(selected)
  const value = options.filter((option) => selectedSet.has(option.model))

  return (
    <Combobox
      items={options}
      multiple
      value={value}
      onValueChange={(next: Array<Model>) => onChange(next.map((model) => model.model))}
      itemToStringLabel={(model: Model) => model.displayName}
      isItemEqualToValue={(item: Model, candidate: Model) => item.model === candidate.model}
      disabled={disabled}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={`Models, ${selected.length} selected`}
            className={cn(
              "text-foreground font-medium sm:text-xs",
              align === "center" ? "mx-auto" : "w-full justify-between",
              MOBILE_TOUCH_TARGET_CLASS,
            )}
          />
        }
      >
        Models
        <Badge variant="secondary">{selected.length}</Badge>
      </ComboboxTrigger>
      <ComboboxContent align={align === "center" ? "center" : "start"} className="w-64">
        <ComboboxInput placeholder="Search models" showTrigger={false} />
        <ComboboxEmpty>No models found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(model: Model) => (
              <ComboboxItem
                key={model.model}
                value={model}
                className={cn("group/mark sm:text-xs", MOBILE_TOUCH_TARGET_CLASS)}
              >
                <ModelLogo family={model.family} className="text-muted-foreground size-3.5" />
                <span className="truncate">{model.displayName}</span>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
