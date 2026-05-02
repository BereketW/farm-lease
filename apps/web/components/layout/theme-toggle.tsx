"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@farm-lease/ui/components/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950"
    >
      <Sun className="h-4 w-4 transition-all dark:scale-0 dark:-rotate-90 text-amber-500" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 text-emerald-400" />
    </Button>
  );
}
