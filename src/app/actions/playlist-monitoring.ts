"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { createRemovalEventRepository } from "@/lib/db/removal-repository";
import { createSnapshotRepository } from "@/lib/db/snapshot-repository";
import { runDailyScan } from "@/lib/jobs/daily-scan";
import { getSpotifyClient, withAccessToken } from "@/lib/spotify/service";

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

  const existing = await prisma.monitoredPlaylist.findUnique({
    where: {
      userId_playlistId: {
        userId: user.id,
        playlistId
      }
    }
  });

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
      enabled,
      ...(enabled ? { lastAcknowledgedAt: new Date() } : {})
    },
    update: {
      playlistName,
      enabled,
      ...(enabled ? { lastAcknowledgedAt: existing?.lastAcknowledgedAt ?? new Date() } : {})
    }
  });

  // When turning tracking ON for the first time (or after it was off),
  // take a baseline snapshot immediately so future cron runs can detect removals
  // even if tracks are added/removed before the next scheduled scan.
  if (enabled && (!existing || !existing.enabled)) {
    try {
      const snapshotRepo = createSnapshotRepository();
      const removalRepo = createRemovalEventRepository();
      const client = getSpotifyClient();
      await withAccessToken(user.id, async (accessToken) =>
        runDailyScan(
          user.id,
          {
            repo: snapshotRepo,
            removalEvents: removalRepo,
            spotify: {
              fetchLikedTracks: () => client.fetchLikedTracks(accessToken),
              fetchPlaylistTracks: (id, name) =>
                client.fetchPlaylistTracks(accessToken, id, name)
            }
          },
          { type: "playlist", playlistId, playlistName }
        )
      );
    } catch (error) {
      console.error(
        "[PlaylistMonitoring] Baseline scan failed",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

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
