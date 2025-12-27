"use client";

import { useTransition } from "react";

import { setTheme } from "@/app/actions/set-theme";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  currentTheme: "light" | "dark";
};

export const ThemeToggle = ({ currentTheme }: ThemeToggleProps) => {
  const [pending, startTransition] = useTransition();

  const handleChange = (theme: "light" | "dark") => {
    if (theme === currentTheme) {
      return;
    }
    startTransition(() => setTheme(theme));
  };

  const optionClass = (selected: boolean) =>
    cn(
      "flex-1 rounded-2xl border px-4 py-3 text-center text-sm",
      selected
        ? "border-emerald-500 bg-emerald-500/10 text-foreground"
        : "border-white/20 text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose a theme. This preference is stored in your browser.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className={optionClass(currentTheme === "dark")}
          onClick={() => handleChange("dark")}
          disabled={pending}
        >
          Dark
        </button>
        <button
          type="button"
          className={optionClass(currentTheme === "light")}
          onClick={() => handleChange("light")}
          disabled={pending}
        >
          Light
        </button>
      </div>
    </div>
  );
};
