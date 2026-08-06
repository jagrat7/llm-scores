import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "#/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "#/ui/components/ui/dropdown-menu"
import { MOBILE_TOUCH_TARGET_CLASS } from "#/ui/lib/interaction-styles"
import { cn } from "#/ui/lib/utils"

type ThemeMode = "system" | "light" | "dark"

const THEME_MODES: Array<{ mode: ThemeMode; label: string; icon: typeof Monitor }> = [
  { mode: "system", label: "System", icon: Monitor },
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
]

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark"
}

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system"

  const stored = window.localStorage.getItem("theme")
  return isThemeMode(stored) ? stored : "system"
}

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode
  const root = document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.dataset.theme = mode
  root.style.colorScheme = resolved
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system")

  useEffect(() => {
    const initialMode = getStoredMode()
    setMode(initialMode)
    applyTheme(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== "system") return undefined

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyTheme("system")
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [mode])

  function selectMode(next: string) {
    if (!isThemeMode(next)) return

    setMode(next)
    applyTheme(next)
    window.localStorage.setItem("theme", next)
  }

  const Icon = THEME_MODES.find((entry) => entry.mode === mode)?.icon ?? Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Theme: ${mode}. Change theme`}
            className={cn("text-muted-foreground w-11 sm:w-8", MOBILE_TOUCH_TARGET_CLASS)}
          >
            <Icon aria-hidden="true" strokeWidth={1.75} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={mode} onValueChange={selectMode}>
          {THEME_MODES.map(({ mode: value, label, icon: ModeIcon }) => (
            <DropdownMenuRadioItem key={value} value={value} className={MOBILE_TOUCH_TARGET_CLASS}>
              <ModeIcon aria-hidden="true" strokeWidth={1.75} />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
