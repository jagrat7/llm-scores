import { Link } from "@tanstack/react-router"

import { INTERACTIVE_SURFACE_CLASS, MOBILE_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { CONTENT_WIDTH_CLASS } from "#/ui/lib/layout-styles"

import ThemeToggle from "./theme-toggle"

const NAV_LINK_CLASS = `inline-flex items-center rounded-md px-2 text-sm text-muted-foreground sm:px-2.5 ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`
const WORDMARK_CLASS = `mr-1 inline-flex items-center rounded-sm px-0.5 text-sm font-semibold tracking-tight text-foreground no-underline sm:mr-4 ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`

export default function AppHeader() {
  return (
    <header className="border-border bg-background sticky top-0 z-40 h-12 border-b">
      <nav
        aria-label="Primary navigation"
        className={`mx-auto flex h-full items-center gap-0.5 px-3 sm:gap-1 sm:px-6 ${CONTENT_WIDTH_CLASS}`}
      >
        <Link
          to="/"
          search={{ x: "cost", y: "score" }}
          aria-label="llm-scores home"
          className={WORDMARK_CLASS}
        >
          llm-scores
        </Link>
        <Link
          to="/"
          search={{ x: "cost", y: "score" }}
          activeOptions={{ exact: true }}
          className={NAV_LINK_CLASS}
          activeProps={{ className: `${NAV_LINK_CLASS} bg-muted text-foreground` }}
        >
          Compare
        </Link>
        <Link
          to="/leaderboard"
          className={NAV_LINK_CLASS}
          activeProps={{ className: `${NAV_LINK_CLASS} bg-muted text-foreground` }}
        >
          Leaderboard
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
