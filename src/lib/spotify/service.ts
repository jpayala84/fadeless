import { getEnv } from '@/lib/env';
import {
  loadEncryptedTokens,
  storeEncryptedTokens
} from '@/lib/db/user-repository';
import { decrypt, encrypt } from '@/lib/security/encryption';
import { createSpotifyClient } from '@/lib/spotify/client';

let spotifyClient: ReturnType<typeof createSpotifyClient> | null = null;

export const getSpotifyClient = () => {
  if (!spotifyClient) {
    spotifyClient = createSpotifyClient(getEnv());
  }
  return spotifyClient;
};

export const persistTokens = async ({
  userId,
  accessToken,
  refreshToken,
  scope,
  expiresAt
}: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  scope: string;
  expiresAt: number;
}) => {
  await storeEncryptedTokens({
    userId,
    accessToken: encrypt(accessToken),
    refreshToken: encrypt(refreshToken),
    scope,
    expiresAt: new Date(expiresAt)
  });
};

export const withAccessToken = async <T>(
  userId: string,
  execute: (accessToken: string) => Promise<T>
) => {
  const client = getSpotifyClient();
  const tokens = await loadEncryptedTokens(userId);
  if (!tokens) {
    throw new Error('Missing Spotify tokens');
  }

  let accessToken = decrypt(tokens.accessToken);
  const refreshToken = decrypt(tokens.refreshToken);
  const now = Date.now();

  if (tokens.expiresAt.getTime() - 60_000 <= now) {
    const refreshed = await client.refreshAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    const scope = refreshed.scope || tokens.scope;
    await storeEncryptedTokens({
      userId,
      accessToken: encrypt(refreshed.accessToken),
      refreshToken: encrypt(refreshToken),
      scope,
      expiresAt: new Date(refreshed.expiresAt)
    });
  }

  return execute(accessToken);
};

export const fetchSpotifyProfile = async (accessToken: string) => {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load Spotify profile: ${text}`);
  }

  const payload = (await response.json()) as {
    id: string;
    display_name: string | null;
    email: string | null;
    country: string | null;
    images?: Array<{ url: string }>;
  };

  return {
    id: payload.id,
    displayName: payload.display_name,
    email: payload.email,
    country: payload.country,
    avatarUrl: payload.images?.[0]?.url
  };
};
