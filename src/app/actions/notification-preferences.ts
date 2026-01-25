'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/db/client';

export type NotificationPreferenceState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const updateNotificationPreference = async (
  _prevState: NotificationPreferenceState,
  formData: FormData
): Promise<NotificationPreferenceState> => {
  const user = await getCurrentUser();
  if (!user) {
    return { status: 'error', message: 'Please sign in first.' };
  }

  const enabled = formData.get('enabled') !== null;

  try {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        channel: 'EMAIL',
        enabled
      },
      create: {
        userId: user.id,
        channel: 'EMAIL',
        enabled
      }
    });

    revalidatePath('/');
    return { status: 'success' };
  } catch (error) {
    console.error('[NotificationPreferenceAction]', error);
    return {
      status: 'error',
      message: 'Failed to update preferences. Please retry.'
    };
  }
};
