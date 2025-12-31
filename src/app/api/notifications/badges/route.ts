import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  if (!user.notificationsEnabled || user.notificationChannel !== "IN_APP") {
    return NextResponse.json({
      ok: true,
      enabled: false,
      likedBadgeCount: 0,
      playlistBadgeCounts: {}
    });
  }

  const since = user.notificationLastNotifiedAt
    ? user.notificationLastNotifiedAt
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const events = await prisma.removalEvent.findMany({
    where: {
      userId: user.id,
      removedAt: { gt: since }
    },
    orderBy: { removedAt: "desc" },
    take: 500
  });

  const playlistBadgeCounts: Record<string, number> = {};
  let likedBadgeCount = 0;

  for (const event of events) {
    if (!event.playlistIds.length) {
      likedBadgeCount += 1;
    }

    for (const playlistId of event.playlistIds) {
      playlistBadgeCounts[playlistId] = (playlistBadgeCounts[playlistId] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    ok: true,
    enabled: true,
    likedBadgeCount,
    playlistBadgeCounts
  });
}
