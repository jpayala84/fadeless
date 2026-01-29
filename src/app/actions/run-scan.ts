'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/db/client';
import { createRemovalEventRepository } from '@/lib/db/removal-repository';
import { createScanHealthRepository } from "@/lib/db/scan-health-repository";
import { createSnapshotRepository } from '@/lib/db/snapshot-repository';
import { runDailyScan } from '@/lib/jobs/daily-scan';
import { mapSpotifyError } from "@/lib/errors/spotify-errors";
import { getSpotifyClient, withAccessToken } from '@/lib/spotify/service';
import { checkRateLimit } from '@/lib/rate-limit';

export type RunScanState =
  | { status: 'idle' }
  | { status: 'success'; scope: string }
  | { status: 'error'; message: string };

export const runScanAction = async (
  _prevState: RunScanState,
  formData: FormData
): Promise<RunScanState> => {
  const user = await getCurrentUser();
  if (!user) {
    return { status: 'error', message: 'You must sign in first.' };
  }

  const mode = formData.get('mode');
  const playlistId =
    typeof formData.get('playlistId') === 'string'
      ? (formData.get('playlistId') as string)
      : undefined;
  const playlistName =
    typeof formData.get('playlistName') === 'string'
      ? (formData.get('playlistName') as string)
      : undefined;

  if (mode === 'playlist' && !playlistId) {
    return { status: 'error', message: 'Missing playlist identifier.' };
  }

  const rateKey = `scan:${user.id}:${mode}:${playlistId ?? 'liked'}`;
  const rate = checkRateLimit(rateKey, 2, 60_000);
  if (!rate.allowed) {
    const retrySeconds = Math.ceil((rate.resetAt - Date.now()) / 1000);
    return {
      status: 'error',
      message: `Rate limited. Try again in ${retrySeconds}s.`
    };
  }

  const client = getSpotifyClient();
  const repo = createSnapshotRepository();
  const removalRepo = createRemovalEventRepository();
  const scanHealth = createScanHealthRepository();

  try {
    await withAccessToken(user.id, async (accessToken) =>
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
        mode === 'playlist' && playlistId
          ? { type: 'playlist', playlistId, playlistName }
          : { type: 'liked' }
      )
    );

    if (mode === 'liked') {
      await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        update: { lastAcknowledgedAt: new Date() },
        create: {
          userId: user.id,
          channel: 'EMAIL',
          enabled: false,
          lastAcknowledgedAt: new Date()
        }
      });
    } else if (mode === 'playlist' && playlistId) {
      await prisma.monitoredPlaylist.updateMany({
        where: { userId: user.id, playlistId },
        data: { lastAcknowledgedAt: new Date() }
      });
    }

    revalidatePath('/', 'page');
    return {
      status: 'success',
      scope:
        mode === 'playlist' && playlistName
          ? playlistName
          : mode === 'playlist'
            ? playlistId ?? 'playlist'
            : 'Liked Songs'
    };
  } catch (error) {
    const mapped = mapSpotifyError(error);
    console.error("[RunScanAction]", mapped.code);
    return {
      status: 'error',
      message: mapped.message
    };
  }
};
