'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/db/client';
import { createRemovalEventRepository } from '@/lib/db/removal-repository';
import { createSnapshotRepository } from '@/lib/db/snapshot-repository';
import { runDailyScan } from '@/lib/jobs/daily-scan';
import { getSpotifyClient, withAccessToken } from '@/lib/spotify/service';

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

  const client = getSpotifyClient();
  const repo = createSnapshotRepository();
  const removalRepo = createRemovalEventRepository();

  try {
    await withAccessToken(user.id, async (accessToken) =>
      runDailyScan(
        user.id,
        {
          repo,
          removalEvents: removalRepo,
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

    if (user.notificationsEnabled && user.notificationChannel === 'IN_APP') {
      await prisma.notificationPreference.updateMany({
        where: { userId: user.id },
        data: { lastNotifiedAt: new Date() }
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
    console.error('[RunScanAction]', error);
    return {
      status: 'error',
      message: 'Scan failed. Please try again.'
    };
  }
};
