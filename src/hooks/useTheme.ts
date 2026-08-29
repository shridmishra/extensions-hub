import { useEffect, useState } from "react"
import { ExtensionStorage } from "../lib/storage"
import type { Theme, ResolvedTheme } from "../types/theme"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light")

  useEffect(() => {
    ExtensionStorage.getTheme().then((savedTheme) => {
      const active = savedTheme || "light"
      setThemeState(active)
      applyTheme(active)
    })

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleSystemChange)
    return () => mediaQuery.removeEventListener("change", handleSystemChange)
  }, [theme])

  const applyTheme = (targetTheme: "light" | "dark" | "system") => {
    let activeDark = false
    if (targetTheme === "system") {
      activeDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    } else {
      activeDark = targetTheme === "dark"
    }

    setResolvedTheme(activeDark ? "dark" : "light")

    if (activeDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const toggleTheme = async () => {
    const nextTheme: "light" | "dark" = resolvedTheme === "dark" ? "light" : "dark"
    setThemeState(nextTheme)
    applyTheme(nextTheme)
    await ExtensionStorage.setTheme(nextTheme)
  }

  const setTheme = async (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    await ExtensionStorage.setTheme(newTheme)
  }

  return {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme
  }
}
