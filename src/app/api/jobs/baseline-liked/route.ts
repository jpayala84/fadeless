import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createOrGetLikedBaseline, getBaselineStatus } from "@/lib/db/baseline-repository";
import { prisma } from "@/lib/db/client";
import { withAccessToken } from "@/lib/spotify/service";

export const dynamic = "force-dynamic";

const INITIAL_PAGES = 10; // ~500 tracks
const STEADY_PAGES = 2;

type SpotifySavedTrackItem = {
  track: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string };
  } | null;
};

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const baseline = (await getBaselineStatus(user.id, "LIKED", null)) ?? (await createOrGetLikedBaseline(user.id));
  if (baseline.completed) {
    return NextResponse.json({ completed: true, indexedCount: baseline.indexedCount });
  }

  const pagesThisTick = baseline.indexedCount === 0 ? INITIAL_PAGES : STEADY_PAGES;

  const result = await withAccessToken(user.id, async (accessToken) => {
    let nextUrl: string | null =
      baseline.nextUrl ?? "https://api.spotify.com/v1/me/tracks?limit=50";
    let pages = 0;
    const tracksToInsert: Array<{
      trackId: string;
      trackName: string;
      artists: string;
      albumName: string;
      playlistIds: string[];
      playlistNames: string[];
      likedSource: boolean;
    }> = [];

    while (nextUrl && pages < pagesThisTick) {
      const response: Response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: "no-store"
      });

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        return { throttled: true, retryAfterSeconds: Math.max(retryAfter, 1) };
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Spotify baseline fetch failed: ${text}`);
      }

      const payload: { items: SpotifySavedTrackItem[]; next: string | null } =
        await response.json();

      payload.items.forEach((item) => {
        const track = item.track;
        if (!track?.id) {
          return;
        }
        tracksToInsert.push({
          trackId: track.id,
          trackName: track.name,
          artists: track.artists.map((artist) => artist.name).join(", "),
          albumName: track.album.name,
          playlistIds: [],
          playlistNames: [],
          likedSource: true
        });
      });

      nextUrl = payload.next;
      pages += 1;
    }

    if (tracksToInsert.length > 0) {
      await prisma.snapshotTrack.createMany({
        data: tracksToInsert.map((track) => ({
          snapshotId: baseline.snapshotId,
          ...track
        }))
      });
    }

    const indexedCount = baseline.indexedCount + tracksToInsert.length;
    const completed = !nextUrl;

    await prisma.baselineState.update({
      where: { id: baseline.id },
      data: {
        indexedCount,
        completed,
        nextUrl
      }
    });

    return { throttled: false, completed, indexedCount };
  });

  return NextResponse.json(result);
}
