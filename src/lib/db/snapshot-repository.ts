import { SnapshotScope } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import type {
  SnapshotRepository,
  SnapshotTarget,
  TrackSnapshot
} from '@/lib/jobs/daily-scan';

const toScopeValue = (target: SnapshotTarget) =>
  target.type === 'liked' ? SnapshotScope.LIKED : SnapshotScope.PLAYLIST;

export const createSnapshotRepository = (): SnapshotRepository => ({
  latestSnapshot: async (userId: string, target: SnapshotTarget) => {
    const latest = await prisma.snapshot.findFirst({
      where: {
        userId,
        scope: toScopeValue(target),
        playlistId: target.type === 'playlist' ? target.playlistId : null
      },
      orderBy: { capturedAt: 'desc' },
      include: { tracks: true }
    });

    if (!latest) {
      return [];
    }

    return latest.tracks.map((track) => ({
      trackId: track.trackId,
      trackName: track.trackName,
      artists: track.artists.split(',').map((artist) => artist.trim()),
      albumName: track.albumName,
      playlistIds: track.playlistIds,
      playlistNames: track.playlistNames,
      likedSource: track.likedSource,
      capturedAt: latest.capturedAt
    }));
  },
  appendSnapshot: async (
    userId: string,
    snapshot: TrackSnapshot[],
    target: SnapshotTarget
  ) => {
    await prisma.snapshot.create({
      data: {
        userId,
        capturedAt: snapshot[0]?.capturedAt ?? new Date(),
        scope: toScopeValue(target),
        playlistId: target.type === 'playlist' ? target.playlistId : null,
        tracks: {
          createMany: {
            data: snapshot.map((track) => ({
              trackId: track.trackId,
              trackName: track.trackName,
              artists: track.artists.join(', '),
              albumName: track.albumName,
              playlistIds: track.playlistIds,
              playlistNames: track.playlistNames,
              likedSource: track.likedSource
            }))
          }
        }
      }
    });
  }
});
