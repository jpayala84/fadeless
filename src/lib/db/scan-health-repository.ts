import { SnapshotScope } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { SnapshotTarget } from "@/lib/jobs/diff-engine";
import type { MappedSpotifyError } from "@/lib/errors/spotify-errors";

export type ScanHealthRecord = {
  userId: string;
  target: SnapshotTarget;
  durationMs: number;
  tracks: number;
  removed: number;
};

export type ScanFailureRecord = {
  userId: string;
  target: SnapshotTarget;
  error: MappedSpotifyError;
};

export type ScanHealthRepository = {
  recordSuccess: (input: ScanHealthRecord) => Promise<void>;
  recordFailure: (input: ScanFailureRecord) => Promise<void>;
  getForUser: (userId: string) => Promise<
    Array<{
      scope: SnapshotScope;
      playlistId: string | null;
      lastSuccessAt: Date | null;
      lastFailureAt: Date | null;
      lastDurationMs: number | null;
      lastTrackCount: number | null;
      lastRemovedCount: number | null;
      lastErrorCode: string | null;
      lastErrorMessage: string | null;
    }>
  >;
};

const toScope = (target: SnapshotTarget) =>
  target.type === "liked" ? SnapshotScope.LIKED : SnapshotScope.PLAYLIST;

const toPlaylistId = (target: SnapshotTarget) =>
  target.type === "playlist" ? target.playlistId : "";

export const createScanHealthRepository = (): ScanHealthRepository => ({
  recordSuccess: async ({ userId, target, durationMs, tracks, removed }) => {
    await prisma.scanHealth.upsert({
      where: {
        userId_scope_playlistId: {
          userId,
          scope: toScope(target),
          playlistId: toPlaylistId(target)
        }
      },
      create: {
        userId,
        scope: toScope(target),
        playlistId: toPlaylistId(target),
        lastSuccessAt: new Date(),
        lastDurationMs: Math.round(durationMs),
        lastTrackCount: tracks,
        lastRemovedCount: removed,
        lastErrorCode: null,
        lastErrorMessage: null
      },
      update: {
        lastSuccessAt: new Date(),
        lastDurationMs: Math.round(durationMs),
        lastTrackCount: tracks,
        lastRemovedCount: removed,
        lastErrorCode: null,
        lastErrorMessage: null
      }
    });
  },
  recordFailure: async ({ userId, target, error }) => {
    await prisma.scanHealth.upsert({
      where: {
        userId_scope_playlistId: {
          userId,
          scope: toScope(target),
          playlistId: toPlaylistId(target)
        }
      },
      create: {
        userId,
        scope: toScope(target),
        playlistId: toPlaylistId(target),
        lastFailureAt: new Date(),
        lastErrorCode: error.code,
        lastErrorMessage: error.message
      },
      update: {
        lastFailureAt: new Date(),
        lastErrorCode: error.code,
        lastErrorMessage: error.message
      }
    });
  },
  getForUser: async (userId) =>
    prisma.scanHealth.findMany({
      where: { userId },
      select: {
        scope: true,
        playlistId: true,
        lastSuccessAt: true,
        lastFailureAt: true,
        lastDurationMs: true,
        lastTrackCount: true,
        lastRemovedCount: true,
        lastErrorCode: true,
        lastErrorMessage: true
      }
    })
});
