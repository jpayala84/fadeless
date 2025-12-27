import { prisma } from "@/lib/db/client";
import type { SnapshotScope } from "@prisma/client";

export type BaselineStatus = {
  id: string;
  scope: SnapshotScope;
  playlistId?: string | null;
  completed: boolean;
  indexedCount: number;
  nextUrl?: string | null;
  snapshotId: string;
};

export const getBaselineStatus = async (
  userId: string,
  scope: SnapshotScope,
  playlistId?: string | null
): Promise<BaselineStatus | null> => {
  const baseline = await prisma.baselineState.findFirst({
    where: {
      userId,
      scope,
      playlistId: playlistId ?? null
    }
  });
  if (!baseline) {
    return null;
  }
  return {
    id: baseline.id,
    scope: baseline.scope,
    playlistId: baseline.playlistId,
    completed: baseline.completed,
    indexedCount: baseline.indexedCount,
    nextUrl: baseline.nextUrl,
    snapshotId: baseline.snapshotId
  };
};

export const createOrGetLikedBaseline = async (
  userId: string
): Promise<BaselineStatus> => {
  const existing = await getBaselineStatus(userId, "LIKED", null);
  if (existing) {
    return existing;
  }

  const snapshot = await prisma.snapshot.create({
    data: {
      userId,
      capturedAt: new Date(),
      scope: "LIKED",
      playlistId: null
    }
  });

  const baseline = await prisma.baselineState.create({
    data: {
      userId,
      scope: "LIKED",
      playlistId: null,
      snapshotId: snapshot.id,
      completed: false,
      indexedCount: 0,
      nextUrl: "https://api.spotify.com/v1/me/tracks?limit=50"
    }
  });

  return {
    id: baseline.id,
    scope: baseline.scope,
    playlistId: baseline.playlistId,
    completed: baseline.completed,
    indexedCount: baseline.indexedCount,
    nextUrl: baseline.nextUrl,
    snapshotId: baseline.snapshotId
  };
};
