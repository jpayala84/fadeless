-- CreateTable
CREATE TABLE "BaselineState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "SnapshotScope" NOT NULL,
    "playlistId" TEXT,
    "snapshotId" TEXT NOT NULL,
    "nextUrl" TEXT,
    "indexedCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaselineState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoredPlaylist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "playlistName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BaselineState_userId_scope_playlistId_key" ON "BaselineState"("userId", "scope", "playlistId");

-- CreateIndex
CREATE INDEX "MonitoredPlaylist_userId_enabled_idx" ON "MonitoredPlaylist"("userId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredPlaylist_userId_playlistId_key" ON "MonitoredPlaylist"("userId", "playlistId");

-- AddForeignKey
ALTER TABLE "BaselineState" ADD CONSTRAINT "BaselineState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaselineState" ADD CONSTRAINT "BaselineState_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoredPlaylist" ADD CONSTRAINT "MonitoredPlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
