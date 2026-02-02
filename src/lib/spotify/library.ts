import { getSpotifyClient, withAccessToken } from '@/lib/spotify/service';
import type {
  AlbumSummary,
  ArtistSummary,
  PlaylistSummary
} from '@/lib/spotify/client';

export type LibraryOverview = {
  likedSongsCount: number;
  savedAlbumsCount: number;
  playlists: PlaylistSummary[];
  followedArtists: ArtistSummary[];
  followedArtistsAvailable: boolean;
  savedAlbums: AlbumSummary[];
};

export const getLibraryOverview = async (
  userId: string
): Promise<LibraryOverview> => {
  const client = getSpotifyClient();

  return withAccessToken(userId, async (accessToken) => {
    const [
      likedSongsCount,
      savedAlbumsCount,
      playlists,
      recentPlaylists,
      savedAlbums
    ] = await Promise.all([
      client.fetchLikedTracksTotal(accessToken).catch(() => 0),
      client.fetchSavedAlbumsTotal(accessToken).catch(() => 0),
      client.fetchPlaylistSummaries(accessToken).catch(() => []),
      client.fetchRecentlyPlayedPlaylists(accessToken).catch(() => []),
      client.fetchSavedAlbums(accessToken).catch(() => [])
    ]);
    let followedArtistsAvailable = true;
    const followedArtists = await client.fetchFollowedArtists(accessToken).catch(() => {
      followedArtistsAvailable = false;
      return [];
    });

    const orderMap = new Map<string, number>();
    recentPlaylists.forEach((id, index) => {
      orderMap.set(id, index);
    });

    const orderedPlaylists = playlists.slice().sort((a, b) => {
      const orderA = orderMap.get(a.id);
      const orderB = orderMap.get(b.id);
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      if (orderA !== undefined) {
        return -1;
      }
      if (orderB !== undefined) {
        return 1;
      }
      return 0;
    });

    return {
      likedSongsCount,
      savedAlbumsCount,
      playlists: orderedPlaylists,
      followedArtists,
      followedArtistsAvailable,
      savedAlbums
    };
  });
};
