"use client";

import { cn } from "@/lib/utils";
import { useThemeToggle } from "@/lib/settings/use-theme-toggle";

type ThemeToggleProps = {
  currentTheme: "light" | "dark";
};

export const ThemeToggle = ({ currentTheme }: ThemeToggleProps) => {
  const { pending, changeTheme } = useThemeToggle(currentTheme);

  const optionClass = (selected: boolean) =>
    cn(
      "flex-1 rounded-2xl border px-4 py-3 text-center text-sm",
      selected
        ? "border-emerald-500 bg-emerald-500/10 text-foreground"
        : "border-border/40 text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          type="button"
          className={optionClass(currentTheme === "dark")}
          onClick={() => changeTheme("dark")}
          disabled={pending}
        >
          Dark
        </button>
        <button
          type="button"
          className={optionClass(currentTheme === "light")}
          onClick={() => changeTheme("light")}
          disabled={pending}
        >
          Light
        </button>
      </div>
    </div>
  );
};
