"use client";

import { useTransition } from "react";

import { setTheme } from "@/app/actions/set-theme";

export const useThemeToggle = (currentTheme: "light" | "dark") => {
  const [pending, startTransition] = useTransition();

  const changeTheme = (theme: "light" | "dark") => {
    if (theme === currentTheme) {
      return;
    }
    startTransition(() => setTheme(theme));
  };

  return { pending, changeTheme };
};
