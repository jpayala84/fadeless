import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import type { NotificationChannel } from '@/lib/notifications/channels';

export type CurrentUser = {
  id: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  notificationChannel: NotificationChannel | null;
  notificationsEnabled: boolean;
  reauthRequired: boolean;
};

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      notification: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    notificationChannel: user.notification?.channel ?? null,
    notificationsEnabled: user.notification?.enabled ?? false,
    reauthRequired: user.reauthRequired
  };
};
