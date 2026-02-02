import crypto from 'node:crypto';

import { cookies } from 'next/headers';

const PKCE_COOKIE = 'spotify_pkce';

const base64UrlEncode = (input: Buffer) =>
  input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

export const createPkcePair = () => {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(64));
  const codeChallenge = base64UrlEncode(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );

  const state = base64UrlEncode(crypto.randomBytes(32));
  return { codeVerifier, codeChallenge, state };
};

export const storePkceValues = async ({
  codeVerifier,
  state
}: {
  codeVerifier: string;
  state: string;
}) => {
  const cookieStore = await cookies();
  cookieStore.set(
    PKCE_COOKIE,
    JSON.stringify({
      codeVerifier,
      state,
      createdAt: Date.now()
    }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60,
      path: '/'
    }
  );
};

export const readPkceValues = async () => {
  const cookieStore = await cookies();
  const record = cookieStore.get(PKCE_COOKIE);
  if (!record) {
    return null;
  }

  try {
    const value = JSON.parse(record.value) as {
      codeVerifier: string;
      state: string;
      createdAt: number;
    };
    cookieStore.delete(PKCE_COOKIE);
    if (Date.now() - value.createdAt > 10 * 60 * 1000) {
      return null;
    }
    return value;
  } catch {
    cookieStore.delete(PKCE_COOKIE);
    return null;
  }
};
