"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const setTheme = async (theme: "light" | "dark") => {
  cookies().set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  revalidatePath("/", "layout");
};
