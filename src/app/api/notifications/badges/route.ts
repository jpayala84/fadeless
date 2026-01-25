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
  const playlistSince = new Map(
    monitored.map((row) => [row.playlistId, row.lastAcknowledgedAt ?? new Date(0)] as const)
  );

  const events = await prisma.removalEvent.findMany({
    where: {
      userId: user.id
    },
    orderBy: { removedAt: "desc" },
    take: 500
  });

  const playlistBadgeCounts: Record<string, number> = {};
  let likedBadgeCount = 0;

  for (const event of events) {
    // Liked-only removals count toward the liked badge if they happened
    // after the user last acknowledged in-app notifications.
    if (!event.playlistIds.length && event.removedAt > likedSince) {
      likedBadgeCount += 1;
    }

    // Playlist removals increment the badge for the affected playlists
    // only if they happened after that playlist was last acknowledged.
    for (const playlistId of event.playlistIds) {
      const since = playlistSince.get(playlistId);
      if (!since) {
        continue;
      }
      if (event.removedAt > since) {
        playlistBadgeCounts[playlistId] = (playlistBadgeCounts[playlistId] ?? 0) + 1;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    enabled: true,
    likedBadgeCount,
    playlistBadgeCounts
  });
}
