import { useEffect, useState } from "react"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function prefersReducedMotion() {
  return typeof window === "undefined" ? true : window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion)

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY)
    const update = () => setReduceMotion(media.matches)

    update()
    media.addEventListener("change", update)

    return () => media.removeEventListener("change", update)
  }, [])

  return reduceMotion
}
