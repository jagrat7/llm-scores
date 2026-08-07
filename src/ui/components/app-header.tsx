import type { LinkProps } from "@tanstack/react-router"

import { Link, useRouterState } from "@tanstack/react-router"

import { APP_NAME } from "#/ui/lib/app-meta"
import { MOBILE_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { CONTENT_WIDTH_CLASS, HEADER_HEIGHT_CLASS } from "#/ui/lib/layout-styles"
import { cn } from "#/ui/lib/utils"

import ThemeToggle from "./theme-toggle"

const NAV_ITEMS: { label: string; link: LinkProps }[] = [
  { label: "Compare", link: { to: "/", search: { x: "cost", y: "score" } } },
  { label: "Leaderboard", link: { to: "/leaderboard" } },
]

/**
 * No fill, no underline: the current route is carried by ink alone, so the bar
 * stays quiet next to the chart it sits above.
 */
const NAV_ITEM_CLASS = cn(
  // Lowercase is presentational only — the DOM text stays cased for the
  // accessible name and for `aria-current` announcements.
  "flex items-center justify-center rounded-md px-3 text-sm lowercase whitespace-nowrap",
  MOBILE_TOUCH_TARGET_CLASS,
)

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

export default function AppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const activeIndex = NAV_ITEMS.findIndex((item) => item.link.to === pathname)

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
          "mx-auto grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-6",
          CONTENT_WIDTH_CLASS,
        )}
      >
        {/*
         * The wordmark also points at Compare, and `Link` hard-codes
         * `aria-current="page"` on whichever link is active. Keeping it outside
         * `<nav>` leaves exactly one current item inside the navigation set.
         */}
        <Link
          to="/"
          search={{ x: "cost", y: "score" }}
          aria-label={`${APP_NAME} home`}
          className={cn(
            "group/mark text-foreground -ml-1 flex items-center gap-2 justify-self-start rounded-md px-1 text-sm font-medium tracking-tight no-underline",
            MOBILE_TOUCH_TARGET_CLASS,
          )}
        >
          <AppMark />
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        {/* The landmark already announces "navigation" — naming it that again stutters. */}
        <nav aria-label="Primary" className="flex items-center">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.label}
              {...item.link}
              className={cn(
                NAV_ITEM_CLASS,
                index === activeIndex
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="justify-self-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
