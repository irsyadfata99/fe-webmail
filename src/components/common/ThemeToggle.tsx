import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/common/theme-context";
import type { Theme } from "@/components/common/theme-context";

const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = {
  system: "Theme: system",
  light: "Theme: light",
  dark: "Theme: dark",
};

// Cycle button: system → light → dark.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${LABEL[theme]} (click to change)`}
      title={LABEL[theme]}
      onClick={() => setTheme(next)}
    >
      <Icon className="size-4" />
    </Button>
  );
}
