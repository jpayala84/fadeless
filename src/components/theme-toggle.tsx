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
      "settings-theme-pill neon-chip flex-1 rounded-full border px-5 py-1.5 text-center text-[0.98rem] font-medium transition",
      selected
        ? "border-emerald-300/60 bg-transparent text-foreground shadow-[0_0_0_1px_rgba(110,231,183,0.15)]"
        : "border-border/40 bg-transparent text-muted-foreground hover:text-foreground hover:border-border/70"
    );

  return (
    <div className="space-y-2.5">
      <div className="settings-theme-toggle-row flex w-full gap-2.5">
        <button
          type="button"
          className={optionClass(currentTheme === "dark")}
          data-active={currentTheme === "dark"}
          onClick={() => changeTheme("dark")}
          disabled={pending}
        >
          Dark
        </button>
        <button
          type="button"
          className={optionClass(currentTheme === "light")}
          data-active={currentTheme === "light"}
          onClick={() => changeTheme("light")}
          disabled={pending}
        >
          Light
        </button>
      </div>
    </div>
  );
};
