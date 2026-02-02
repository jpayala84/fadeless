import { NextResponse } from 'next/server';

import { establishSession } from '@/lib/auth/session';
import { readPkceValues } from '@/lib/auth/pkce';
import { getEnv } from '@/lib/env';
import { upsertUserProfile } from '@/lib/db/user-repository';
import {
  fetchSpotifyProfile,
  getSpotifyClient,
  persistTokens
} from '@/lib/spotify/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const env = getEnv();
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  if (error) {
    return redirectWithError(env, error);
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) {
    return redirectWithError(env, 'invalid_request');
  }

  const pkce = await readPkceValues();
  if (!pkce || pkce.state !== state) {
    return redirectWithError(env, 'state_mismatch');
  }

  try {
    const client = getSpotifyClient();
    const exchange = await client.exchangeCode({
      code,
      codeVerifier: pkce.codeVerifier
    });

    const profile = await fetchSpotifyProfile(exchange.accessToken);
    await upsertUserProfile(profile);
    await persistTokens({
      userId: profile.id,
      accessToken: exchange.accessToken,
      refreshToken: exchange.refreshToken,
      scope: exchange.scope,
      expiresAt: exchange.expiresAt
    });
    await establishSession(profile.id);

    return NextResponse.redirect(env.NEXT_PUBLIC_APP_URL);
  } catch (err) {
    const reason = inferAuthFailureReason(err);
    const errorId = crypto.randomUUID().slice(0, 8);
    console.error('[Spotify Callback Error]', { errorId, reason, err });
    if (reason === "spotify_profile") {
      return redirectWithError(env, "not_allowlisted", { errorId });
    }
    return redirectWithError(env, 'auth_failed', { reason, errorId });
  }
}

const redirectWithError = (
  env: ReturnType<typeof getEnv>,
  code: string,
  options?: { reason?: string; errorId?: string }
) => {
  const params = new URLSearchParams({ error: code });
  if (options?.reason) params.set('reason', options.reason);
  if (options?.errorId) params.set('errorId', options.errorId);
  return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}?${params.toString()}`);
};

const inferAuthFailureReason = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  if (/state_mismatch/i.test(message)) return 'state_mismatch';
  if (/invalid_client/i.test(message)) return 'invalid_client';
  if (/invalid_grant/i.test(message)) return 'invalid_grant';
  if (/Spotify token request failed/i.test(message)) return 'token_exchange';
  if (/Failed to load Spotify profile/i.test(message)) return 'spotify_profile';
  if (/Prisma/i.test(message) && /P1001|Can't reach database server/i.test(message))
    return 'db_unreachable';
  if (/Prisma/i.test(message)) return 'db_error';

  return 'unknown';
};
