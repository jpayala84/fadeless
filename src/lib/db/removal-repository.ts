import type { RemovalEvent } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import type { RemovalRecord, RemovalEventRepository } from '@/lib/jobs/daily-scan';

export const createRemovalEventRepository = (): RemovalEventRepository => ({
  record: async (userId: string, removed: RemovalRecord[]) => {
    if (removed.length === 0) {
      return;
    }

    await prisma.removalEvent.createMany({
      data: removed.map((track) => ({
        userId,
        trackId: track.trackId,
        trackName: track.trackName,
        artists: track.artists.join(', '),
        albumName: track.albumName,
        playlistIds: track.playlistIds,
        playlistNames: track.playlistNames,
        removedAt: track.removedAt
      })),
      skipDuplicates: true
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
  removedAt: Date;
  replacementTrackId?: string | null;
  replacementTrackName?: string | null;
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
    removedAt: event.removedAt,
    replacementTrackId: event.replacementTrackId,
    replacementTrackName: event.replacementTrackName
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
