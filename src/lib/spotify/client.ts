import type { ServerEnv } from '@/lib/env';

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string[];
  album: string;
  imageUrl?: string;
  durationMs?: number;
};

export type PlaylistTrack = SpotifyTrack & {
  playlistId: string;
  playlistName: string;
  addedAt: string;
};

export type PlaylistSummary = {
  id: string;
  name: string;
  trackCount: number;
  imageUrl?: string;
  owner: string;
};

export type AlbumSummary = {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  imageUrl?: string;
};

export type ArtistSummary = {
  id: string;
  name: string;
  imageUrl?: string;
  genres: string[];
  followers: number;
};

export type SpotifyClient = {
  exchangeCode: (params: { code: string; codeVerifier: string }) => Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scope: string;
  }>;
  refreshAccessToken: (refreshToken: string) => Promise<{
    accessToken: string;
    expiresAt: number;
    scope: string;
  }>;
  fetchLikedTracks: (
    accessToken: string,
    options?: { maxPages?: number }
  ) => Promise<SpotifyTrack[]>;
  fetchLikedTracksPage: (
    accessToken: string,
    options: { offset: number; limit: number }
  ) => Promise<{ tracks: SpotifyTrack[]; total: number }>;
  fetchPlaylists: (accessToken: string) => Promise<PlaylistTrack[]>;
  fetchPlaylistSummaries: (accessToken: string) => Promise<PlaylistSummary[]>;
  fetchPlaylistPreview: (
    accessToken: string,
    playlistId: string,
    playlistName?: string,
    limit?: number
  ) => Promise<PlaylistTrack[]>;
  fetchPlaylistTracks: (
    accessToken: string,
    playlistId: string,
    playlistName?: string,
    options?: { maxPages?: number }
  ) => Promise<PlaylistTrack[]>;
  fetchPlaylistTracksPage: (
    accessToken: string,
    playlistId: string,
    playlistName: string | undefined,
    options: { offset: number; limit: number }
  ) => Promise<{ tracks: PlaylistTrack[]; total: number }>;
  fetchLikedTracksTotal: (accessToken: string) => Promise<number>;
  fetchSavedAlbumsTotal: (accessToken: string) => Promise<number>;
  fetchSavedAlbums: (
    accessToken: string,
    limit?: number
  ) => Promise<AlbumSummary[]>;
  fetchFollowedArtists: (accessToken: string) => Promise<ArtistSummary[]>;
  fetchRecentlyPlayedPlaylists: (accessToken: string) => Promise<string[]>;
  fetchLikedTracksPreview: (
    accessToken: string,
    limit?: number
  ) => Promise<SpotifyTrack[]>;
  fetchTrackDetails: (
    accessToken: string,
    trackIds: string[]
  ) => Promise<Array<{ id: string; imageUrl?: string }>>;
  fetchAlbumTracks: (
    accessToken: string,
    albumId: string
  ) => Promise<SpotifyTrack[]>;
};

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

export const createSpotifyClient = (env: ServerEnv): SpotifyClient => {
  const authorize = async (params: URLSearchParams) => {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: params
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Spotify token request failed: ${text}`);
    }

    return (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };
  };

  const exchangeCode = async ({
    code,
    codeVerifier
  }: {
    code: string;
    codeVerifier: string;
  }) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      code_verifier: codeVerifier
    });

    const result = await authorize(params);
    if (!result.refresh_token) {
      throw new Error('Spotify response missing refresh token');
    }

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: Date.now() + result.expires_in * 1000,
      scope: result.scope
    };
  };

  const refreshAccessToken = async (refreshToken: string) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    const result = await authorize(params);

    return {
      accessToken: result.access_token,
      expiresAt: Date.now() + result.expires_in * 1000,
      scope: result.scope
    };
  };

  const fetchLikedTracks = async (
    accessToken: string,
    options?: { maxPages?: number }
  ): Promise<SpotifyTrack[]> =>
    paginate<SpotifyTrack>({
      accessToken,
      initialUrl: `${API_BASE}/me/tracks?limit=50`,
      maxPages: options?.maxPages,
      mapItem: (item: any) => {
        const track = item.track;
        if (!track) {
          return null;
        }
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist: any) => artist.name),
          album: track.album.name,
          imageUrl: track.album.images?.[0]?.url,
          durationMs: track.duration_ms
        };
      }
    });

  const fetchLikedTracksPage = async (
    accessToken: string,
    options: { offset: number; limit: number }
  ): Promise<{ tracks: SpotifyTrack[]; total: number }> => {
    const response: Response = await fetch(
      `${API_BASE}/me/tracks?limit=${options.limit}&offset=${options.offset}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load liked songs page: ${text}`);
    }

    const payload = await response.json();
    const tracks: SpotifyTrack[] = (payload.items ?? [])
      .map((item: any) => {
        const track = item.track;
        if (!track) {
          return null;
        }
        return {
          id: track.id,
          name: track.name,
          artists: track.artists?.map((artist: any) => artist.name) ?? [],
          album: track.album?.name ?? "",
          imageUrl: track.album?.images?.[0]?.url,
          durationMs: track.duration_ms
        };
      })
      .filter(Boolean);

    return {
      tracks,
      total: payload.total ?? tracks.length
    };
  };

  const fetchPlaylists = async (
    accessToken: string
  ): Promise<PlaylistTrack[]> => {
    const playlists = await paginate<any>({
      accessToken,
      initialUrl: `${API_BASE}/me/playlists?limit=50`,
      mapItem: (item: any) => ({
        id: item.id,
        name: item.name
      })
    });

    const tracks: PlaylistTrack[] = [];
    for (const playlist of playlists) {
      const playlistTracks = await paginate<PlaylistTrack>({
        accessToken,
        initialUrl: `${API_BASE}/playlists/${playlist.id}/tracks?limit=100`,
        mapItem: (item: any) => {
          const track = item.track;
          if (!track) {
            return null;
          }

          return {
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist: any) => artist.name),
            album: track.album.name,
            playlistId: playlist.id,
            playlistName: playlist.name,
            addedAt: item.added_at,
            imageUrl: track.album.images?.[0]?.url,
            durationMs: track.duration_ms
          };
        }
      });

      tracks.push(...playlistTracks);
    }

    return tracks;
  };

  const fetchPlaylistSummaries = async (
    accessToken: string
  ): Promise<PlaylistSummary[]> =>
    paginate<PlaylistSummary>({
      accessToken,
      initialUrl: `${API_BASE}/me/playlists?limit=50`,
      mapItem: (item: any) => ({
        id: item.id,
        name: item.name,
        trackCount: item.tracks?.total ?? 0,
        imageUrl: item.images?.[0]?.url,
        owner: item.owner?.display_name ?? 'Unknown'
      })
    });

  const fetchPlaylistPreview = async (
    accessToken: string,
    playlistId: string,
    playlistName?: string,
    limit = 25
  ): Promise<PlaylistTrack[]> =>
    paginate<PlaylistTrack>({
      accessToken,
      initialUrl: `${API_BASE}/playlists/${playlistId}/tracks?limit=${limit}`,
      maxPages: 1,
      mapItem: (item: any) => {
        const track = item.track;
        if (!track) {
          return null;
        }
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist: any) => artist.name),
          album: track.album.name,
          playlistId,
          playlistName: playlistName ?? item.playlist?.name ?? '',
          addedAt: item.added_at,
          imageUrl: track.album.images?.[0]?.url,
          durationMs: track.duration_ms
        };
      }
    });

  const fetchSavedAlbums = async (
    accessToken: string,
    limit = 20
  ): Promise<AlbumSummary[]> =>
    paginate<AlbumSummary>({
      accessToken,
      initialUrl: `${API_BASE}/me/albums?limit=${limit}`,
      maxPages: 1,
      mapItem: (item: any) => {
        const album = item.album;
        if (!album) {
          return null;
        }
        return {
          id: album.id,
          name: album.name,
          artist: album.artists?.[0]?.name ?? 'Unknown artist',
          artistId: album.artists?.[0]?.id,
          imageUrl: album.images?.[0]?.url
        };
      }
    });

  const fetchLikedTracksPreview = async (
    accessToken: string,
    limit = 16
  ): Promise<SpotifyTrack[]> =>
    paginate<SpotifyTrack>({
      accessToken,
      initialUrl: `${API_BASE}/me/tracks?limit=${limit}`,
      maxPages: 1,
      mapItem: (item: any) => {
        const track = item.track;
        if (!track) {
          return null;
        }
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist: any) => artist.name),
          album: track.album.name,
          imageUrl: track.album.images?.[0]?.url
        };
      }
    });

  const fetchTrackDetails = async (
    accessToken: string,
    trackIds: string[]
  ): Promise<Array<{ id: string; imageUrl?: string }>> => {
    const unique = Array.from(new Set(trackIds.filter(Boolean)));
    if (unique.length === 0) {
      return [];
    }
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 50) {
      chunks.push(unique.slice(i, i + 50));
    }
    const results: Array<{ id: string; imageUrl?: string }> = [];
    for (const chunk of chunks) {
      const response: Response = await fetch(
        `${API_BASE}/tracks?ids=${chunk.join(',')}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Spotify track lookup failed: ${text}`);
      }

      const payload = await response.json();
      payload.tracks.forEach((track: any) => {
        if (!track) {
          return;
        }
        results.push({
          id: track.id,
          imageUrl: track.album?.images?.[0]?.url
        });
      });
    }
    return results;
  };

  const fetchAlbumTracks = async (
    accessToken: string,
    albumId: string
  ): Promise<SpotifyTrack[]> => {
    const response = await fetch(`${API_BASE}/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load album tracks: ${text}`);
    }
    const payload = await response.json();
    const albumName = payload.name;
    const albumImage = payload.images?.[0]?.url;
    return (payload.tracks?.items ?? []).map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists?.map((artist: any) => artist.name) ?? [],
      album: albumName,
      imageUrl: albumImage,
      durationMs: track.duration_ms
    }));
  };

  const fetchLikedTracksTotal = async (accessToken: string) => {
    const response = await fetch(`${API_BASE}/me/tracks?limit=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load liked songs count: ${text}`);
    }
    const payload = await response.json();
    return payload.total ?? 0;
  };

  const fetchSavedAlbumsTotal = async (accessToken: string) => {
    const response = await fetch(`${API_BASE}/me/albums?limit=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load saved albums count: ${text}`);
    }
    const payload = await response.json();
    return payload.total ?? 0;
  };

  const fetchFollowedArtists = async (
    accessToken: string
  ): Promise<ArtistSummary[]> => {
    const response = await fetch(
      `${API_BASE}/me/following?type=artist&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: 'no-store'
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load followed artists: ${text}`);
    }
    const payload = await response.json();
    const artists = payload?.artists?.items ?? [];
    return artists.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url,
      genres: artist.genres ?? [],
      followers: artist.followers?.total ?? 0
    }));
  };

  const fetchPlaylistTracks = async (
    accessToken: string,
    playlistId: string,
    playlistName?: string,
    options?: { maxPages?: number }
  ): Promise<PlaylistTrack[]> => {
    let resolvedName = playlistName;
    if (!resolvedName) {
      const meta = await fetch(`${API_BASE}/playlists/${playlistId}?fields=name`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store'
      });
      if (meta.ok) {
        const payload = await meta.json();
        resolvedName = payload.name;
      } else {
        resolvedName = 'Playlist';
      }
    }

    return paginate<PlaylistTrack>({
      accessToken,
      initialUrl: `${API_BASE}/playlists/${playlistId}/tracks?limit=100`,
      maxPages: options?.maxPages,
      mapItem: (item: any) => {
        const track = item.track;
        if (!track) {
          return null;
        }
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist: any) => artist.name),
          album: track.album.name,
          playlistId,
          playlistName: resolvedName ?? 'Playlist',
          addedAt: item.added_at,
          imageUrl: track.album.images?.[0]?.url,
          durationMs: track.duration_ms
        };
      }
    });
  };

  const fetchPlaylistTracksPage = async (
    accessToken: string,
    playlistId: string,
    playlistName: string | undefined,
    options: { offset: number; limit: number }
  ): Promise<{ tracks: PlaylistTrack[]; total: number }> => {
    const response: Response = await fetch(
      `${API_BASE}/playlists/${playlistId}/tracks?limit=${options.limit}&offset=${options.offset}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load playlist tracks: ${text}`);
    }

    const payload = await response.json();
    const tracks: PlaylistTrack[] = (payload.items ?? [])
      .map((item: any) => {
        const track = item.track;
        if (!track) {
          return null;
        }
        return {
          id: track.id,
          name: track.name,
          artists: track.artists?.map((artist: any) => artist.name) ?? [],
          album: track.album?.name ?? "",
          playlistId,
          playlistName: playlistName ?? "",
          addedAt: item.added_at,
          imageUrl: track.album?.images?.[0]?.url,
          durationMs: track.duration_ms
        };
      })
      .filter(Boolean);

    return {
      tracks,
      total: payload.total ?? tracks.length
    };
  };

  const fetchRecentlyPlayedPlaylists = async (
    accessToken: string
  ): Promise<string[]> => {
    const response = await fetch(
      `${API_BASE}/me/player/recently-played?limit=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const item of payload.items ?? []) {
      const context = item.context;
      if (context?.type === 'playlist' && context.uri) {
        const playlistId = context.uri.split(':').pop();
        if (playlistId && !seen.has(playlistId)) {
          seen.add(playlistId);
          ordered.push(playlistId);
        }
      }
    }
    return ordered;
  };

  return {
    exchangeCode,
    refreshAccessToken,
    fetchLikedTracks,
    fetchLikedTracksPage,
    fetchPlaylists,
    fetchPlaylistSummaries,
    fetchPlaylistPreview,
    fetchPlaylistTracks,
    fetchPlaylistTracksPage,
    fetchLikedTracksTotal,
    fetchSavedAlbumsTotal,
    fetchSavedAlbums,
    fetchFollowedArtists,
    fetchRecentlyPlayedPlaylists,
    fetchLikedTracksPreview,
    fetchTrackDetails,
    fetchAlbumTracks
  };
};

const paginate = async <T>({
  accessToken,
  initialUrl,
  mapItem,
  maxPages
}: {
  accessToken: string;
  initialUrl: string;
  mapItem: (item: any) => T | null;
  maxPages?: number;
}): Promise<T[]> => {
  let nextUrl: string | null = initialUrl;
  const items: T[] = [];
  let pageCount = 0;

  while (nextUrl && (maxPages === undefined || pageCount < maxPages)) {
    const response: Response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });
    pageCount += 1;

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after') ?? '1');
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(retryAfter, 1) * 1000)
      );
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Spotify API error: ${text}`);
    }

    const payload = await response.json();
    payload.items.forEach((item: any) => {
      const normalized = mapItem(item);
      if (normalized) {
        items.push(normalized);
      }
    });

    nextUrl = payload.next;
  }

  return items;
};
