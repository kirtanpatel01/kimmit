import { useEffect } from "react"

import { IconMoon, IconSun } from "@tabler/icons-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const activeTheme = theme === "dark" ? "dark" : "light"
  const nextTheme = activeTheme === "dark" ? "light" : "dark"

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return
      }

      if (event.key.toLowerCase() === "d") {
        event.preventDefault()
        setTheme(nextTheme)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [nextTheme, setTheme])

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={activeTheme === "dark" ? "Switch to light" : "Switch to dark"}
      aria-pressed={activeTheme === "dark"}
      className={cn(className)}
      onClick={() => setTheme(nextTheme)}
    >
      {activeTheme === "dark" ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
    </Button>
  )
}
