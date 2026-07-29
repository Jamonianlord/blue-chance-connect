import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={"relative h-9 w-9 shrink-0 rounded-full px-0 " + className}
    >
      <Sun
        className={
          "h-4 w-4 transition-all duration-300 " +
          (isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")
        }
      />
      <Moon
        className={
          "absolute h-4 w-4 transition-all duration-300 " +
          (isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0")
        }
      />
    </Button>
  );
}
