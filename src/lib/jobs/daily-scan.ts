import type { PlaylistTrack, SpotifyTrack } from "@/lib/spotify/client";
import {
  buildSnapshot,
  diffSnapshots,
  type DiffResult,
  type RemovalRecord,
  type RemovalEventRepository,
  type SnapshotRepository,
  type SnapshotTarget,
  type TrackSnapshot
} from "@/lib/jobs/diff-engine";
import { mapSpotifyError } from "@/lib/errors/spotify-errors";
import type { ScanHealthRepository } from "@/lib/db/scan-health-repository";

export type ScanDependencies = {
  repo: SnapshotRepository;
  removalEvents: RemovalEventRepository;
  scanHealth?: ScanHealthRepository;
  spotify: {
    fetchLikedTracks: () => Promise<SpotifyTrack[]>;
    fetchPlaylistTracks: (
      playlistId: string,
      playlistName?: string,
      options?: { maxPages?: number }
    ) => Promise<PlaylistTrack[]>;
  };
};

export const runDailyScan = async (
  userId: string,
  { repo, removalEvents, spotify, scanHealth }: ScanDependencies,
  target: SnapshotTarget
): Promise<DiffResult> => {
  const scopeLabel =
    target.type === 'liked'
      ? 'LIKED'
      : `PLAYLIST:${target.playlistId}`;
  const startedAt = Date.now();
  console.info("[ScanStarted]", {
    userId,
    scope: scopeLabel
  });
  try {
    const now = new Date();
    const previousSnapshot = await repo.latestSnapshot(userId, target);

    const currentSnapshotData =
      target.type === "liked"
        ? buildSnapshot({
            likedTracks: await spotify.fetchLikedTracks(),
            playlistTracks: [],
            capturedAt: now
          })
        : buildSnapshot({
            likedTracks: [],
            playlistTracks: await spotify.fetchPlaylistTracks(
              target.playlistId,
              target.playlistName
            ),
            capturedAt: now
          });

    await repo.appendSnapshot(userId, currentSnapshotData, target);

    const diff =
      previousSnapshot.length === 0
        ? { removed: [], potentialReplacements: [] }
        : diffSnapshots(previousSnapshot, currentSnapshotData, { removedAt: now });
    if (diff.removed.length > 0) {
      await removalEvents.record(userId, diff.removed);
    }

    const durationMs = Date.now() - startedAt;
    console.info("[ScanCompleted]", {
      userId,
      scope: scopeLabel,
      tracks: currentSnapshotData.length,
      removed: diff.removed.length,
      durationMs
    });
    if (scanHealth) {
      try {
        await scanHealth.recordSuccess({
          userId,
          target,
          durationMs,
          tracks: currentSnapshotData.length,
          removed: diff.removed.length
        });
      } catch (recordError) {
        console.warn("[ScanHealth] Failed to record success", {
          userId,
          scope: scopeLabel
        });
      }
    }

    return diff;
  } catch (error) {
    const mapped = mapSpotifyError(error);
    console.error("[ScanFailed]", {
      userId,
      scope: scopeLabel,
      error: mapped.code
    });
    if (scanHealth) {
      try {
        await scanHealth.recordFailure({
          userId,
          target,
          error: mapped
        });
      } catch (recordError) {
        console.warn("[ScanHealth] Failed to record failure", {
          userId,
          scope: scopeLabel
        });
      }
    }
    throw error;
  }
};
