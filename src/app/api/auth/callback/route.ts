import { NextResponse } from 'next/server';

import { establishSession } from '@/lib/auth/session';
import { readPkceValues } from '@/lib/auth/pkce';
import { env } from '@/lib/env';
import { upsertUserProfile } from '@/lib/db/user-repository';
import {
  fetchSpotifyProfile,
  getSpotifyClient,
  persistTokens
} from '@/lib/spotify/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  if (error) {
    return redirectWithError(error);
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) {
    return redirectWithError('invalid_request');
  }

  const pkce = readPkceValues();
  if (!pkce || pkce.state !== state) {
    return redirectWithError('state_mismatch');
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
    console.error('[Spotify Callback Error]', err);
    return redirectWithError('auth_failed');
  }
}

const redirectWithError = (code: string) =>
  NextResponse.redirect(
    `${env.NEXT_PUBLIC_APP_URL}?error=${encodeURIComponent(code)}`
  );
