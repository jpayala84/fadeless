-- CreateTable
CREATE TABLE "ScanHealth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "SnapshotScope" NOT NULL,
    "playlistId" TEXT,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastDurationMs" INTEGER,
    "lastTrackCount" INTEGER,
    "lastRemovedCount" INTEGER,
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanHealth_userId_scope_playlistId_idx" ON "ScanHealth"("userId", "scope", "playlistId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanHealth_userId_scope_playlistId_key" ON "ScanHealth"("userId", "scope", "playlistId");

-- AddForeignKey
ALTER TABLE "ScanHealth" ADD CONSTRAINT "ScanHealth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
