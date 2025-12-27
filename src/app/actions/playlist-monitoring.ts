"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";

export type ToggleMonitoringResult =
  | { status: "success"; enabled: boolean }
  | { status: "error"; message: string };

export const togglePlaylistMonitoring = async ({
  playlistId,
  playlistName,
  enabled
}: {
  playlistId: string;
  playlistName: string;
  enabled: boolean;
}): Promise<ToggleMonitoringResult> => {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must sign in first." };
  }

  if (enabled) {
    const enabledCount = await prisma.monitoredPlaylist.count({
      where: { userId: user.id, enabled: true }
    });
    if (enabledCount >= 5) {
      return {
        status: "error",
        message: "You can monitor up to 5 playlists."
      };
    }
  }

  await prisma.monitoredPlaylist.upsert({
    where: {
      userId_playlistId: {
        userId: user.id,
        playlistId
      }
    },
    create: {
      userId: user.id,
      playlistId,
      playlistName,
      enabled
    },
    update: {
      playlistName,
      enabled
    }
  });

  revalidatePath("/", "page");
  return { status: "success", enabled };
};

export const initializeMonitoring = async (
  selections: Array<{ playlistId: string; playlistName: string }>
): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const unique = Array.from(
    new Map(selections.map((item) => [item.playlistId, item])).values()
  ).slice(0, 5);

  await prisma.monitoredPlaylist.deleteMany({
    where: { userId: user.id }
  });

  if (unique.length > 0) {
    await prisma.monitoredPlaylist.createMany({
      data: unique.map((playlist) => ({
        userId: user.id,
        playlistId: playlist.playlistId,
        playlistName: playlist.playlistName,
        enabled: true
      }))
    });
  }

  revalidatePath("/", "page");
};
