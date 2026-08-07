/**
 * Touch targets only. Hover/active/disabled surfaces come from `Button` variants —
 * these constants exist because shadcn sizes are fixed-height and the app needs a
 * 44px target on touch that collapses to the compact desktop scale.
 */
export const MOBILE_TOUCH_TARGET_CLASS = "min-h-11 sm:min-h-8"
/** Primary controls stand a step taller than the secondary ones beside them. */
export const PRIMARY_TOUCH_TARGET_CLASS = "min-h-11 sm:min-h-9"

/**
 * The axis column stacks the metric selects over the model picker, so they only
 * read as one family if they share a silhouette — same width, height, padding
 * and hover. Border and fill still come from each control's own base component.
 */
export const CONTROL_CHIP_CLASS = `text-muted-foreground w-full justify-between gap-2 px-3 text-sm shadow-none hover:bg-muted hover:text-foreground ${PRIMARY_TOUCH_TARGET_CLASS}`
