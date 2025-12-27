import crypto from 'node:crypto';

import { cookies, headers } from 'next/headers';

import { getEnv } from '@/lib/env';
import {
  createSession,
  deleteSession,
  getSession
} from '@/lib/db/user-repository';

const SESSION_COOKIE = 'sgs_session';
const SESSION_TTL_HOURS = 24;

const getSessionSecret = () => getEnv().SESSION_SECRET;

const sign = (value: string) => {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(value)
    .digest('hex');
};

const serializeSessionCookie = (sessionId: string) => {
  const signature = sign(sessionId);
  return `${sessionId}.${signature}`;
};

const parseSessionCookie = (cookieValue: string | undefined) => {
  if (!cookieValue) {
    return null;
  }
  const [sessionId, signature] = cookieValue.split('.');
  if (!sessionId || !signature) {
    return null;
  }
  const expected = sign(sessionId);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  return sessionId;
};

export const establishSession = async (userId: string) => {
  const session = await createSession({ userId, ttlHours: SESSION_TTL_HOURS });
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, serializeSessionCookie(session.id), {
    httpOnly: true,
    secure: headers().get('x-forwarded-proto') === 'https',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60
  });
};

export const readSession = async () => {
  const cookieStore = cookies();
  const sessionId = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (!sessionId) {
    return null;
  }
  return getSession(sessionId);
};

export const destroySession = async () => {
  const cookieStore = cookies();
  const sessionId = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (sessionId) {
    await deleteSession(sessionId);
  }
  cookieStore.delete(SESSION_COOKIE);
};
