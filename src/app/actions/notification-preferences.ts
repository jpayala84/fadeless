'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/db/client';
import {
  isNotificationChannel,
  type NotificationChannel
} from '@/lib/notifications/channels';

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

  const channelValue = formData.get('channel');
  if (!isNotificationChannel(channelValue)) {
    return { status: 'error', message: 'Invalid notification channel.' };
  }

  const channel: NotificationChannel = channelValue;
  const enabledValue = formData.get('enabled');
  const enabled = enabledValue === 'true';

  try {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        channel,
        enabled
      },
      create: {
        userId: user.id,
        channel,
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
