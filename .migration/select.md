# select

2026-08-06 — golden pair via CLI (`shadcn add select --overwrite`) — migrated clean.

`select` was the only Radix wrapper in the project. Classified against the
`new-york-v4` golden first: the local file was pristine apart from oxfmt
formatting, the `#/ui/lib/utils.ts` import alias, and one real customization —
`group/mark` on `SelectItem`, which drives the brand-colour logo accent. The
CLI delivered the `base-vega` variant and the customization was replayed by hand.

## Changed

- `src/ui/components/ui/select.tsx` — rebuilt on `@base-ui/react/select`.
  Anatomy changed from Radix's `Portal > Content` to Base UI's
  `Portal > Positioner > Popup > List`. `ScrollUpButton`/`ScrollDownButton`
  now wrap `ScrollUpArrow`/`ScrollDownArrow`. `SelectPrimitive.Icon` uses
  `render=` instead of `asChild`. `group/mark` re-applied at `select.tsx:112`.
- `src/ui/components/metric-select.tsx:74` and
  `src/ui/components/source-select.tsx:62` — `position="popper"` →
  `alignItemWithTrigger={false}`.
- `src/ui/components/metric-select.tsx:50` and
  `src/ui/components/source-select.tsx:48` — `onValueChange` widened from
  `(value: string)` to `(value: string | null)`; both guards now null-check
  before the existing `isMetric`/`isSource` narrowing.
- `src/ui/components/model-logo.tsx:27` — accent selector
  `group-data-[state=checked]/mark` → `group-data-[selected]/mark`. Base UI
  `Select.Item` emits `data-selected`/`data-highlighted`, not
  `data-state="checked"`. Verified against
  `node_modules/@base-ui/react/select/item/SelectItem.d.ts`.
- `components.json` — style `new-york` → `base-vega`.
- `package.json` — `radix-ui` removed, `@base-ui/react@1.7.0` added.

Leftover scan clean: `grep -rn "radix" src/ package.json` returns nothing.

## Left alone

- `src/ui/components/ui/command.tsx` — cmdk, not Radix.
- `src/ui/components/ui/chart.tsx` — recharts, not Radix.
- `src/ui/components/integrations/clerk/*` — Clerk owns these widgets.

## Behavior changes

- **Style switched from `new-york` to `base-vega`.** `new-york` is a legacy
  style with no Base UI counterpart (`base-new-york` 404s). `base-vega` was
  picked because it is the exact metric match: same `rounded-md`, same
  `h-9`/`h-8`/`h-10` scale, same `shadow-sm`. Focus rings moved from
  `ring-[3px]` to `ring-3` (identical computed width).
- Base UI `Select` treats an empty selection as `null` rather than `""`. The
  app renders its own "Add {axis} axis" placeholder before the value is read,
  so nothing observable changed.

## Verify by hand

1. Open `/?x=cost&y=score`. Click the X-axis metric chip — the popup should
   open aligned to the trigger's start edge, not centred on the active item.
2. Keyboard: focus the chip, press Enter, then type "sc" — typeahead should
   land on Score. Arrow keys move, Escape closes and returns focus to the chip.
3. Hover a metric option that has a provider logo — the logo should take its
   brand colour (this is the `group/mark` + `data-highlighted` path).
4. Select the currently-selected option — the check indicator should sit at
   the right edge and the `data-selected` accent should hold.
5. Add a Z axis, then use the "via" source select on a contested metric.
