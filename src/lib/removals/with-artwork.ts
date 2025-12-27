import { getSpotifyClient, withAccessToken } from '@/lib/spotify/service';
import type { RemovalEventDTO } from '@/lib/db/removal-repository';

type ArtworkCacheEntry = {
  imageUrl?: string;
  updatedAt: number;
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const getArtworkCache = () => {
  const globalAny = globalThis as typeof globalThis & {
    __spotrackArtworkCache?: Map<string, ArtworkCacheEntry>;
  };
  if (!globalAny.__spotrackArtworkCache) {
    globalAny.__spotrackArtworkCache = new Map();
  }
  return globalAny.__spotrackArtworkCache;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export const attachRemovalArtwork = async (
  userId: string,
  events: RemovalEventDTO[]
): Promise<RemovalEventDTO[]> => {
  if (events.length === 0) {
    return events;
  }

  const cache = getArtworkCache();
  const now = Date.now();

  const client = getSpotifyClient();
  try {
    return await withTimeout(
      withAccessToken(userId, async (accessToken) => {
        const uniqueTrackIds = Array.from(
          new Set(events.map((event) => event.trackId).filter(Boolean))
        );

        const cached: string[] = [];
        const missing: string[] = [];
        uniqueTrackIds.forEach((trackId) => {
          const entry = cache.get(trackId);
          if (entry && now - entry.updatedAt < CACHE_TTL_MS) {
            cached.push(trackId);
          } else {
            missing.push(trackId);
          }
        });

        const lookupIds = missing.slice(0, 50);
        if (lookupIds.length) {
          const details = await client.fetchTrackDetails(accessToken, lookupIds);
          details.forEach((detail) => {
            cache.set(detail.id, { imageUrl: detail.imageUrl, updatedAt: now });
          });
          lookupIds.forEach((trackId) => {
            if (!cache.has(trackId)) {
              cache.set(trackId, { imageUrl: undefined, updatedAt: now });
            }
          });
        }

        return events.map((event) => {
          const entry = cache.get(event.trackId);
          return {
            ...event,
            albumImageUrl: entry?.imageUrl ?? event.albumImageUrl
          };
        });
      }),
      1500
    );
  } catch (error) {
    console.error("[attachRemovalArtwork]", error);
    return events;
  }
};
