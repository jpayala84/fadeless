-- CreateEnum
CREATE TYPE "SnapshotScope" AS ENUM ('LIKED', 'PLAYLIST');

-- DropIndex
DROP INDEX "Snapshot_userId_capturedAt_idx";

-- AlterTable
ALTER TABLE "Snapshot" ADD COLUMN     "playlistId" TEXT,
ADD COLUMN     "scope" "SnapshotScope" NOT NULL DEFAULT 'LIKED';

-- CreateIndex
CREATE INDEX "Snapshot_userId_scope_playlistId_capturedAt_idx" ON "Snapshot"("userId", "scope", "playlistId", "capturedAt");
