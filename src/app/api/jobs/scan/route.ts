import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createRemovalEventRepository } from "@/lib/db/removal-repository";
import { createScanHealthRepository } from "@/lib/db/scan-health-repository";
import { createSnapshotRepository } from "@/lib/db/snapshot-repository";
import { runDailyScan } from "@/lib/jobs/daily-scan";
import { mapSpotifyError } from "@/lib/errors/spotify-errors";
import { getSpotifyClient, withAccessToken } from "@/lib/spotify/service";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const mode = payload?.mode === "playlist" ? "playlist" : "liked";
  const playlistId =
    typeof payload?.playlistId === "string" ? payload.playlistId : undefined;
  const playlistName =
    typeof payload?.playlistName === "string" ? payload.playlistName : undefined;

  if (mode === "playlist" && !playlistId) {
    return NextResponse.json({ error: "missing_playlist" }, { status: 400 });
  }

  const rateKey = `scan:${user.id}:${mode}:${playlistId ?? "liked"}`;
  const rate = checkRateLimit(rateKey, 2, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rate.resetAt - Date.now()) / 1000).toString()
        }
      }
    );
  }

  const client = getSpotifyClient();
  const repo = createSnapshotRepository();
  const removalRepo = createRemovalEventRepository();
  const scanHealth = createScanHealthRepository();

  try {
    const diff = await withAccessToken(user.id, async (accessToken) =>
      runDailyScan(
        user.id,
        {
          repo,
          removalEvents: removalRepo,
          scanHealth,
          spotify: {
            fetchLikedTracks: () => client.fetchLikedTracks(accessToken),
            fetchPlaylistTracks: (id, name) =>
              client.fetchPlaylistTracks(accessToken, id, name)
          }
        },
        mode === "playlist" && playlistId
          ? { type: "playlist", playlistId, playlistName }
          : { type: "liked" }
      )
    );

    return NextResponse.json({
      removed: diff.removed.length
    });
  } catch (error) {
    const mapped = mapSpotifyError(error);
    console.error("[Daily Scan]", mapped.code);
    const status =
      mapped.code === "rate_limited"
        ? 429
        : mapped.code === "reauth_required"
          ? 401
          : 503;
    return NextResponse.json(
      { error: mapped.code, message: mapped.message },
      { status }
    );
  }
}
