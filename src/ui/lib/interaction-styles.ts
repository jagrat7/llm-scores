/**
 * Touch targets only. Hover/active/disabled surfaces come from `Button` variants —
 * these constants exist because shadcn sizes are fixed-height and the app needs a
 * 44px target on touch that collapses to the compact desktop scale.
 */
export const MOBILE_TOUCH_TARGET_CLASS = "min-h-11 sm:min-h-8"
/** Primary controls stand a step taller than the secondary ones beside them. */
export const PRIMARY_TOUCH_TARGET_CLASS = "min-h-11 sm:min-h-9"
