import { NextRequest, NextResponse } from 'next/server';

import { getEnv } from '@/lib/env';
import { createPkcePair, storePkceValues } from '@/lib/auth/pkce';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const env = getEnv();
  const { codeChallenge, codeVerifier, state } = createPkcePair();
  await storePkceValues({ codeVerifier, state });
  const switchAccount = request.nextUrl.searchParams.get("switch_account") === "1";

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.SPOTIFY_CLIENT_ID,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: env.SPOTIFY_SCOPES,
    state
  });

  if (switchAccount) {
    params.set("show_dialog", "true");
  }

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
