import type { Handler, HandlerContext, HandlerEvent } from "@netlify/functions";

import { prisma } from "../../src/lib/db/client";
import { createRemovalEventRepository } from "../../src/lib/db/removal-repository";
import { createSnapshotRepository } from "../../src/lib/db/snapshot-repository";
import { runDailyScan } from "../../src/lib/jobs/daily-scan";
import { getSpotifyClient, withAccessToken } from "../../src/lib/spotify/service";

export const config = {
  schedule: "0 7,19 * * *"
};

const MAX_PLAYLISTS_PER_USER = 5;

export const handler = (async (
  _event: HandlerEvent,
  _context: HandlerContext
): Promise<{ statusCode: number; body: string }> => {
  console.info("[cron] starting run", new Date().toISOString());
  const users = await prisma.user.findMany({
    include: {
      tokens: true,
      monitoredPlaylists: {
        where: { enabled: true },
        take: MAX_PLAYLISTS_PER_USER
      }
    }
  });

  const snapshotRepo = createSnapshotRepository();
  const removalRepo = createRemovalEventRepository();
  const client = getSpotifyClient();

  for (const user of users) {
    if (!user.tokens) {
      console.warn("[cron] skipping user without tokens", user.id);
      continue;
    }
    if (user.reauthRequired) {
      console.warn("[cron] skipping user pending reauth", user.id);
      continue;
    }
    // Liked scan (light: single page to reduce API load)
    try {
      await withAccessToken(user.id, async (accessToken) =>
        runDailyScan(
          user.id,
          {
            repo: snapshotRepo,
            removalEvents: removalRepo,
            spotify: {
              fetchLikedTracks: () => client.fetchLikedTracks(accessToken),
              fetchPlaylistTracks: (id, name) =>
                client.fetchPlaylistTracks(accessToken, id, name)
            }
          },
          { type: "liked" }
        )
      );
      console.info("[cron] liked scan complete", user.id);
    } catch (error) {
      console.error("[cron-liked-scan]", user.id, error);
    }

    // Tracked playlists
    for (const playlist of user.monitoredPlaylists) {
      try {
        await withAccessToken(user.id, async (accessToken) =>
          runDailyScan(
            user.id,
            {
              repo: snapshotRepo,
              removalEvents: removalRepo,
              spotify: {
                fetchLikedTracks: () => client.fetchLikedTracks(accessToken),
                fetchPlaylistTracks: (id, name) =>
                  client.fetchPlaylistTracks(accessToken, id, name)
              }
            },
            { type: "playlist", playlistId: playlist.playlistId, playlistName: playlist.playlistName }
          )
        );
        console.info("[cron] playlist scan complete", user.id, playlist.playlistId);
      } catch (error) {
        console.error("[cron-playlist-scan]", user.id, playlist.playlistId, error);
      }
    }
  }

  return {
    statusCode: 200,
    body: "ok"
  };
}) satisfies Handler;
