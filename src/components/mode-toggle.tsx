import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"

import { useTheme } from "@/components/theme-provider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value as any)
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="light" aria-label="Light">
        <IconSun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark">
        <IconMoon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System">
        <IconDeviceDesktop className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
