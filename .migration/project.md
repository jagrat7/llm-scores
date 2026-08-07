# project

2026-08-06 — whole-project Radix → Base UI, plus a shadcn adoption pass.

The audit that started this found 1 shadcn component installed (`select`)
across 24 tsx files; everything else was hand-rolled. Two things happened in
one pass: the base flipped to Base UI, and the hand-rolled UI was replaced
with registry components.

## Dependency swap

- `+ @base-ui/react@1.7.0`
- `- radix-ui@1.6.4`
- `+ cmdk` (pulled in by `command`, which `combobox` builds on)
- `components.json` style `new-york` → `base-vega`; CLI now resolves
  `base: "base"`.

Baseline before the swap: `tsc --noEmit` clean, `oxlint` clean, 1 test passing.
Same after.

## Style and icon library

Landed on `base-mira` with `remixicon`, by request.

The intermediate step was `base-vega`, chosen because `new-york` is legacy
with no Base UI counterpart and vega matched it exactly on radii
(`rounded-md`), heights (`h-9`/`h-8`/`h-10`) and shadow. `base-mira` is
deliberately tighter — `h-7`/`h-6`/`h-8` triggers, `text-xs/relaxed`,
`size-3.5` icons — which suits a data-dense comparison tool. The app's own
oklch palette in `styles.css` was never touched: only `components.json`'s
`style` changed, so no preset CSS variables were applied over it.

Icons moved from `lucide-react` to `@remixicon/react` (config key
`remixicon`). The CLI rewrote the vendored components; app code was mapped by
hand against the package's real exports: `ArrowUpDown`→`RiArrowUpDownLine`,
`ArrowUp`/`ArrowDown`→`RiArrowUpLine`/`RiArrowDownLine`, `Plus`→`RiAddLine`,
`X`→`RiCloseLine`, `Monitor`→`RiComputerLine`, `Moon`/`Sun`→`RiMoonLine`/
`RiSunLine`, `CircleAlert`→`RiErrorWarningLine`. Remix has no 3D-rotate
glyph, so the "Drag to rotate" hint uses `RiDragMove2Line` — the closest
match, and a deliberate substitution rather than an equivalent.

## Components added

25 from `@shadcn`: alert, avatar, badge, button, button-group, card, chart,
combobox, command, dialog, dropdown-menu, empty, input, input-group,
navigation-menu, popover, progress, scroll-area, separator, sheet, skeleton,
table, textarea, toggle, toggle-group, tooltip.

## App-code sweep

- `model-picker.tsx` — `<details>/<summary>` + raw checkboxes → multi-select
  `Combobox`. This was the one real defect: no focus management, no
  outside-click close, no keyboard navigation, no portal, hardcoded `top-12`
  and `z-30`, and no search over a list that grows with the model set.
- `leaderboard-table.tsx` — raw `<table>` markup → `Table`; score bar →
  `Progress`; sort headers → `Button`; `title=` → `Tooltip`.
- `data-state.tsx` — one div serving both states → `DataState` (over `Empty`)
  and `DataError` (over `Alert variant="destructive"`), 6 call sites updated.
- `chart-skeleton.tsx` — shimmer divs → `Skeleton`.
- `theme-toggle.tsx` — a button that cycled 3 states blind → `DropdownMenu`
  radio group; the options are now visible before choosing.
- `metric-select.tsx` — `-ml-px rounded-l-none` seam → `ButtonGroup`.
- `axis-controls.tsx` — `<div className="border-t">` → `Separator`; swap
  control → `Button` + `Tooltip`.
- `source-select.tsx` — "via" moved out of the trigger; it is a label for the
  control, not part of the selected value, and it now reads the same whether
  the metric has one source (plain prose) or several (a select).
- `comparison-chart.tsx` — `ResponsiveContainer` → `ChartContainer`; grid and
  tick theming now come from the container's CSS instead of eight inline
  `var(--...)` props.
- `comparison-chart-3d.tsx` — view-preset buttons → `ButtonGroup` + `Button`.
- `app-header.tsx` — hand-styled nav links → `buttonVariants`.
- `__root.tsx` — `TooltipProvider` added.
- `lib/interaction-styles.ts` — `INTERACTIVE_SURFACE_CLASS` deleted (it was a
  hand-rolled `variant="ghost"`). The two touch-target constants stayed:
  shadcn sizes are fixed-height and the app needs a 44px target on touch that
  collapses to the compact desktop scale. Deleting them would have regressed
  every control to 32px on mobile.

## Registry bugs found and patched

> **These recur on every `shadcn add --overwrite`.** Both were present again
> in the `base-mira` output and had to be re-applied. Re-check them after any
> future component re-add.

Two classes of defect in the registry output, both caught in the browser:

1. **Orientation variants never match.** `separator.tsx`, `scroll-area.tsx`,
   `button-group.tsx` and `toggle-group.tsx` shipped `data-horizontal:` /
   `data-vertical:` variants, but Base UI emits `data-orientation="horizontal"`.
   The separator in `axis-controls` therefore computed to `height: 0px` and was
   invisible. Rewritten to `data-[orientation=horizontal]:` /
   `data-[orientation=vertical]:` (and the `group-data-*` forms).
2. **`SelectValue` does not clone the selected item.** Radix rendered the
   chosen `SelectItem`'s children; Base UI's `Select.Value` resolves a label
   from the root's `items` and otherwise falls back to the raw value. Triggers
   regressed to `cost` / `deepswe` and lost their provider logo. Both call
   sites now pass a function child — `metric-select.tsx` maps to
   `METRIC_CONFIG[...].shortLabel`, `source-select.tsx` renders
   `SourceLogo` + `sourceLabel`.

Still-inert leftovers, flagged not fixed, because nothing in the app hits
them: `toggle-group.tsx` `data-[state=on]` (Base UI Toggle emits
`data-pressed`), `tooltip.tsx` `data-[state=delayed-open]` (dead beside a
working `data-open` rule), `navigation-menu.tsx` `data-[state=hidden|visible]`.
`table.tsx` `data-[state=selected]` is app-controlled and correct.

## Vendored-file customizations

Three, all of which `shadcn add --overwrite` would discard:

- `ui/select.tsx` — `group/mark` on `SelectItem` (brand-colour logo accent).
- `ui/table.tsx` — added a `containerClassName` prop. The leaderboard needs
  `lg:overflow-x-visible` on the scroll container so the sticky header works
  at wide viewports; the stock component exposes no way to reach that div.
- `ui/skeleton.tsx` — `animate-pulse` → the project's `skeleton-shimmer`
  (already defined in `styles.css`), so all skeletons share one look.

`src/ui/components/ui/**` was added to `.oxlintrc.json` `ignorePatterns` —
the project runs type-aware linting and upstream registry code trips
`restrict-template-expressions` and `no-unsafe-type-assertion` in `chart.tsx`,
`input-group.tsx` and `toggle-group.tsx`. Formatting still applies.

## Deliberately not done

- **Mobile `Sheet` nav.** The header has two links that already fit at 320px.
  A hamburger would be a regression, not a fix.
- **`Avatar` + `DropdownMenu` for the Clerk user menu.**
  `integrations/clerk/header-user.tsx` is dead code — nothing imports it — and
  Clerk's `<UserButton/>` owns session and sign-out. Reshelling it in
  shadcn parts would lose behaviour and gain nothing.
- **`ChartTooltip` in `comparison-chart.tsx`.** The readout panel is pinned
  top-right and is driven by `activePoint`, which the sr-only keyboard buttons
  also set. `ChartTooltipContent` is pointer-driven, so adopting it would drop
  the keyboard-focus readout. `ChartContainer` was adopted; the panel stayed.
- **`Badge` for the "via {source}" attribution.** It reads as prose in a
  deliberately quiet row; a chip border would fight that.

## Final build

`bun run typecheck`, `bun run lint`, `bun run fmt`, `bun test` all clean.
Verified in a browser at every stage: compare page, 3D view, leaderboard,
combobox search + Escape focus return, column sort, tooltips, theme menu
persistence.

0 wrappers remain on Radix.
