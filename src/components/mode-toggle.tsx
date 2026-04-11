import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"

import { useTheme, type Theme } from "@/components/theme-provider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value as Theme)
      }}
      variant="outline"
      size="sm"
      className={cn(className)}
    >
      <ToggleGroupItem value="light" aria-label="Light" className="data-[state=on]:text-primary">
        <IconSun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark" className="data-[state=on]:text-primary">
        <IconMoon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System" className="data-[state=on]:text-primary">
        <IconDeviceDesktop className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
