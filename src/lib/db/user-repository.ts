import { prisma } from '@/lib/db/client';

export const upsertUserProfile = async ({
  id,
  email,
  displayName,
  avatarUrl,
  country
}: {
  id: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
}) => {
  await prisma.user.upsert({
    where: { id },
    update: {
      email: email ?? undefined,
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      country: country ?? undefined
    },
    create: {
      id,
      email,
      displayName,
      avatarUrl,
      country
    }
  });
};

export const storeEncryptedTokens = async ({
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
  expiresAt: Date;
}) => {
  await prisma.token.upsert({
    where: { userId },
    update: {
      accessToken,
      refreshToken,
      scope,
      expiresAt
    },
    create: {
      userId,
      accessToken,
      refreshToken,
      scope,
      expiresAt
    }
  });
};

export const loadEncryptedTokens = async (userId: string) => {
  const record = await prisma.token.findUnique({
    where: { userId }
  });

  if (!record) {
    return null;
  }

  return {
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    scope: record.scope,
    expiresAt: record.expiresAt
  };
};

export const deleteTokens = async (userId: string) => {
  await prisma.token.deleteMany({ where: { userId } });
};

export const setReauthRequired = async (
  userId: string,
  reauthRequired: boolean
) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { reauthRequired }
    });
  } catch (error) {
    console.error('[UserRepository] Failed to update reauth flag', {
      userId,
      reauthRequired,
      error
    });
  }
};

export const createSession = async ({
  userId,
  ttlHours
}: {
  userId: string;
  ttlHours: number;
}) => {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt
    }
  });

  return session;
};

export const getSession = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return null;
  }

  return session;
};

export const deleteSession = async (sessionId: string) => {
  await prisma.session.deleteMany({ where: { id: sessionId } });
};
