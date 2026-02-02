import { NextResponse } from 'next/server';

import { getEnv } from '@/lib/env';
import { createPkcePair, storePkceValues } from '@/lib/auth/pkce';
import { getSpotifyScopes } from "@/lib/spotify/scopes";

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getEnv();
  const { codeChallenge, codeVerifier, state } = createPkcePair();
  storePkceValues({ codeVerifier, state });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.SPOTIFY_CLIENT_ID,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: getSpotifyScopes(env),
    state
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
