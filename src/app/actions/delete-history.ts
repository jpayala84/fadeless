"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";

type DeleteHistoryState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const deleteHistoryAction = async (
  _prevState: DeleteHistoryState,
  _formData: FormData
): Promise<DeleteHistoryState> => {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    await prisma.$transaction([
      prisma.removalEvent.deleteMany({
        where: { userId: user.id }
      }),
      prisma.snapshot.deleteMany({
        where: { userId: user.id }
      })
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete history.";
    return { status: "error", message };
  }

  revalidatePath("/", "page");
  return { status: "success" };
};
