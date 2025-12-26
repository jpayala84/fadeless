export const NOTIFICATION_CHANNELS = ['EMAIL', 'IN_APP'] as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[number];

export const isNotificationChannel = (
  value: unknown
): value is NotificationChannel =>
  typeof value === 'string' &&
  (NOTIFICATION_CHANNELS as readonly string[]).includes(value);
