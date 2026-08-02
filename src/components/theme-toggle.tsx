import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { INTERACTIVE_SURFACE_CLASS, MOBILE_TOUCH_TARGET_CLASS } from "#/lib/interaction-styles"

type ThemeMode = "system" | "light" | "dark"

const THEME_MODES: Array<ThemeMode> = ["system", "light", "dark"]

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

  function cycleMode() {
    const index = THEME_MODES.indexOf(mode)
    const nextMode = THEME_MODES[(index + 1) % THEME_MODES.length]
    setMode(nextMode)
    applyTheme(nextMode)
    window.localStorage.setItem("theme", nextMode)
  }

  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor
  const nextMode = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length]

  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={`${mode} theme active. Switch to ${nextMode} theme`}
      title={`${mode} theme`}
      className={`text-muted-foreground inline-flex w-11 items-center justify-center rounded-md sm:w-8 ${MOBILE_TOUCH_TARGET_CLASS} ${INTERACTIVE_SURFACE_CLASS}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
    </button>
  )
}
