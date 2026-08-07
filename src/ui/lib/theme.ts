/**
 * Two themes, no third mode: an absent stored value *is* "system". That keeps
 * the control a toggle rather than a menu — the system preference is the
 * starting point, and the first toggle is the user opting out of it.
 */
export type Theme = "light" | "dark"

export const THEME_STORAGE_KEY = "theme"

export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** `null` means the user has never chosen, so the system preference still wins. */
export function storedTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === "light" || stored === "dark" ? stored : null
  } catch {
    return null
  }
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private browsing denies writes; the theme still applies for this session.
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

/**
 * The view transition animates the root snapshot, so the theme swap has to be
 * flushed synchronously inside the callback — see `theme-toggle.tsx`. Browsers
 * without the API, and readers who asked for less motion, just get the swap.
 */
export function withThemeTransition(swap: () => void) {
  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    swap()
    return
  }

  document.startViewTransition(swap)
}
