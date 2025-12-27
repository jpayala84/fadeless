"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";

type DeleteHistoryState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const deleteHistoryAction = async (_formData: FormData): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  await prisma.$transaction([
    prisma.removalEvent.deleteMany({
      where: { userId: user.id }
    }),
    prisma.snapshot.deleteMany({
      where: { userId: user.id }
    })
  ]);

  revalidatePath("/", "page");
};
