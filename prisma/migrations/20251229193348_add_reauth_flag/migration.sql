-- Add reauthRequired flag to users so we can prompt for Spotify reconnects
ALTER TABLE "User"
  ADD COLUMN "reauthRequired" BOOLEAN NOT NULL DEFAULT false;
