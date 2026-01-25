import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  // We treat "badges" as "pending review" markers.
  // - Liked badge counts liked-only removals since the user's last acknowledgement.
  // - Playlist badges count removals since that playlist was last acknowledged.
  const likedSince = user.notificationLastAcknowledgedAt ?? new Date(0);

  const monitored = await prisma.monitoredPlaylist.findMany({
    where: { userId: user.id, enabled: true },
    select: { playlistId: true, lastAcknowledgedAt: true }
  });

  const [likedBadgeCount, playlistCounts] = await Promise.all([
    prisma.removalEvent.count({
      where: {
        userId: user.id,
        playlistIds: { equals: [] },
        removedAt: { gt: likedSince }
      }
    }),
    Promise.all(
      monitored.map(async (row) => {
        const since = row.lastAcknowledgedAt ?? new Date(0);
        const count = await prisma.removalEvent.count({
          where: {
            userId: user.id,
            playlistIds: { has: row.playlistId },
            removedAt: { gt: since }
          }
        });
        return [row.playlistId, count] as const;
      })
    )
  ]);

  const playlistBadgeCounts: Record<string, number> = {};
  playlistCounts.forEach(([playlistId, count]) => {
    if (count > 0) {
      playlistBadgeCounts[playlistId] = count;
    }
  });

  return NextResponse.json({
    ok: true,
    enabled: true,
    likedBadgeCount,
    playlistBadgeCounts
  });
}
