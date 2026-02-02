"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const setTheme = async (theme: "light" | "dark") => {
  const cookieStore = await cookies();
  cookieStore.set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  revalidatePath("/", "layout");
};
