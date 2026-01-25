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
  const earliestPlaylistAck = monitored.reduce<Date>(
    (min, row) => {
      const value = row.lastAcknowledgedAt ?? new Date(0);
      return value < min ? value : min;
    },
    new Date(8640000000000000)
  );
  const earliestSince =
    monitored.length > 0
      ? new Date(Math.min(likedSince.getTime(), earliestPlaylistAck.getTime()))
      : likedSince;

  const events = await prisma.removalEvent.findMany({
    where: {
      userId: user.id,
      removedAt: {
        gt: earliestSince
      }
    },
    orderBy: { removedAt: "desc" },
    take: 2000
  });

  const playlistBadgeCounts: Record<string, number> = {};
  let likedBadgeCount = 0;

  for (const event of events) {
    if (!event.playlistIds.length) {
      if (event.removedAt > likedSince) {
        likedBadgeCount += 1;
      }
      continue;
    }

    for (const playlistId of event.playlistIds) {
      const since = playlistSince.get(playlistId);
      if (!since) continue;
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
