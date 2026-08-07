import { Link } from "@tanstack/react-router"

import { buttonVariants } from "#/ui/components/ui/button"
import { MOBILE_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { CONTENT_WIDTH_CLASS } from "#/ui/lib/layout-styles"
import { cn } from "#/ui/lib/utils"

import ThemeToggle from "./theme-toggle"

const NAV_LINK_CLASS = cn(
  buttonVariants({ variant: "ghost", size: "sm" }),
  "text-muted-foreground px-2 sm:px-2.5",
  MOBILE_TOUCH_TARGET_CLASS,
)
const NAV_LINK_ACTIVE_CLASS = cn(NAV_LINK_CLASS, "bg-muted text-foreground")
const WORDMARK_CLASS = cn(
  buttonVariants({ variant: "ghost", size: "sm" }),
  "text-foreground mr-1 px-0.5 font-semibold tracking-tight no-underline sm:mr-4",
  MOBILE_TOUCH_TARGET_CLASS,
)

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
          activeProps={{ className: NAV_LINK_ACTIVE_CLASS }}
        >
          Compare
        </Link>
        <Link
          to="/leaderboard"
          className={NAV_LINK_CLASS}
          activeProps={{ className: NAV_LINK_ACTIVE_CLASS }}
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
