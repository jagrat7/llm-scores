import { Link } from "@tanstack/react-router"

import { APP_NAME } from "#/ui/lib/app-meta"
import { CONTENT_WIDTH_CLASS, HEADER_HEIGHT_CLASS } from "#/ui/lib/layout-styles"
import { cn } from "#/ui/lib/utils"

import ThemeToggle from "./theme-toggle"

/** Three points trending up — the scatter the product is built around. */
const MARK_POINTS = [
  { cx: 3, cy: 12.5 },
  { cx: 8, cy: 8.5 },
  { cx: 13, cy: 4.5 },
]

function AppMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="group-hover/mark:text-primary size-4 shrink-0 transition-[transform,color] duration-300 ease-[var(--expo-out)] group-hover/mark:-translate-y-px"
    >
      {MARK_POINTS.map((point) => (
        <circle key={point.cx} cx={point.cx} cy={point.cy} r="1.7" className="fill-current" />
      ))}
    </svg>
  )
}

/**
 * One destination, so there is nothing to navigate between — the bar carries the
 * wordmark and the theme control and stays out of the chart's way.
 */
export default function AppHeader() {
  return (
    <header
      className={cn(
        "border-border/60 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md",
        HEADER_HEIGHT_CLASS,
      )}
    >
      <div
        className={cn(
          // Matches `PageShell`, so the mark's left edge lines up with the
          // content below it at every width.
          "mx-auto flex h-full items-center justify-between gap-2 px-4 sm:px-6",
          CONTENT_WIDTH_CLASS,
        )}
      >
        <Link
          to="/"
          search={{ x: "cost", y: "score" }}
          aria-label={`${APP_NAME} home`}
          className="group/mark text-foreground -ml-1 flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium tracking-tight no-underline sm:min-h-8"
        >
          <AppMark />
          <span>{APP_NAME}</span>
        </Link>

        <ThemeToggle />
      </div>
    </header>
  )
}
