ALTER TABLE "NotificationPreference"
ADD COLUMN IF NOT EXISTS "lastAcknowledgedAt" TIMESTAMP(3);

