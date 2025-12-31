'use server';

import { revalidatePath } from 'next/cache';

import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export const acknowledgeInAppDigest = async () => {
  const session = await readSession();
  if (!session) {
    return { status: 'error', message: 'Not authenticated' };
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: { userId: session.userId }
  });

  if (!preference || preference.channel !== 'IN_APP') {
    return { status: 'ok' };
  }

  await prisma.notificationPreference.update({
    where: { userId: session.userId },
    data: { lastNotifiedAt: new Date() }
  });

  revalidatePath('/');
  return { status: 'ok' };
};
