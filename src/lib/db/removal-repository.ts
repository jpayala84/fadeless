import type { RemovalEvent } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import type { RemovalEventRepository, RemovalRecord } from "@/lib/jobs/diff-engine";

export const createRemovalEventRepository = (): RemovalEventRepository => ({
  record: async (userId: string, removed: RemovalRecord[]) => {
    if (removed.length === 0) {
      return;
    }

    // Prisma's createMany(skipDuplicates) only deduplicates on unique constraints.
    // We want idempotency per scan window:
    // - If a track was already recorded as removed after the previous snapshot,
    //   don't create another identical event on retries or repeated scans.
    const candidates: RemovalRecord[] = [];
    for (const track of removed) {
      const existing = await prisma.removalEvent.findFirst({
        where: {
          userId,
          trackId: track.trackId,
          playlistIds: {
            equals: track.playlistIds
          },
          removedAt: {
            gt: track.capturedAt
          }
        },
        select: { id: true }
      });

      if (!existing) {
        candidates.push(track);
      }
    }

    if (candidates.length === 0) {
      return;
    }

    await prisma.removalEvent.createMany({
      data: candidates.map((track) => ({
        userId,
        trackId: track.trackId,
        trackName: track.trackName,
        artists: track.artists.join(", "),
        albumName: track.albumName,
        playlistIds: track.playlistIds,
        playlistNames: track.playlistNames,
        removedAt: track.removedAt
      }))
    });
  }
});

export type RemovalEventDTO = {
  id: string;
  trackId: string;
  trackName: string;
  artists: string[];
  albumName: string;
  playlistNames: string[];
  playlistIds: string[];
  removedAt: Date;
  albumImageUrl?: string;
};

const mapEvent = (event: RemovalEvent): RemovalEventDTO => {
  return {
    id: event.id,
    trackId: event.trackId,
    trackName: event.trackName,
    artists: event.artists.split(',').map((artist) => artist.trim()),
    albumName: event.albumName,
    playlistNames: event.playlistNames,
    playlistIds: event.playlistIds,
    removedAt: event.removedAt
  };
};

type ListFilters = {
  playlistId?: string;
};

export const listRemovalEvents = async ({
  userId,
  limit,
  playlistId
}: {
  userId: string;
  limit?: number;
} & ListFilters): Promise<RemovalEventDTO[]> => {
  const events = await prisma.removalEvent.findMany({
    where: {
      userId,
      ...(playlistId
        ? {
            playlistIds: {
              has: playlistId
            }
          }
        : {})
    },
    orderBy: { removedAt: 'desc' },
    take: limit
  });

  return events.map(mapEvent);
};

export const listRemovalEventsForWeek = async ({
  userId,
  since,
  playlistId
}: {
  userId: string;
  since: Date;
} & ListFilters): Promise<RemovalEventDTO[]> => {
  const events = await prisma.removalEvent.findMany({
    where: {
      userId,
      removedAt: {
        gte: since
      },
      ...(playlistId
        ? {
            playlistIds: {
              has: playlistId
            }
          }
        : {})
    },
    orderBy: { removedAt: 'desc' }
  });

  return events.map(mapEvent);
};
