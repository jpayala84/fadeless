import { getSpotifyClient, withAccessToken } from '@/lib/spotify/service';
import type { RemovalEventDTO } from '@/lib/db/removal-repository';

export const attachRemovalArtwork = async (
  userId: string,
  events: RemovalEventDTO[]
): Promise<RemovalEventDTO[]> => {
  if (events.length === 0) {
    return events;
  }

  const client = getSpotifyClient();
  return withAccessToken(userId, async (accessToken) => {
    const trackIds = events.map((event) => event.trackId).filter(Boolean);
    const details = await client.fetchTrackDetails(accessToken, trackIds);
    const artMap = new Map(details.map((detail) => [detail.id, detail.imageUrl]));
    return events.map((event) => ({
      ...event,
      albumImageUrl: artMap.get(event.trackId)
    }));
  });
};
