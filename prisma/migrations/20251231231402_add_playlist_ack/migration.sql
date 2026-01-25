-- Ensure the per-playlist acknowledgement timestamp exists.
-- This is used to hide playlist removals until a user explicitly reviews/scans that playlist.
ALTER TABLE "MonitoredPlaylist"
ADD COLUMN IF NOT EXISTS "lastAcknowledgedAt" TIMESTAMP(3);

-- Prisma expects TIMESTAMP(3) for DateTime in PostgreSQL.
ALTER TABLE "MonitoredPlaylist"
ALTER COLUMN "lastAcknowledgedAt" SET DATA TYPE TIMESTAMP(3);
