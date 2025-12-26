import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { createRemovalEventRepository } from '@/lib/db/removal-repository';
import { createSnapshotRepository } from '@/lib/db/snapshot-repository';
import { runDailyScan } from '@/lib/jobs/daily-scan';
import { getSpotifyClient, withAccessToken } from '@/lib/spotify/service';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const client = getSpotifyClient();
  const repo = createSnapshotRepository();
  const removalRepo = createRemovalEventRepository();

  try {
    const diff = await withAccessToken(user.id, async (accessToken) =>
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
        { type: 'liked' }
      )
    );

    return NextResponse.json({
      removed: diff.removed.length,
      potentialReplacements: diff.potentialReplacements.length
    });
  } catch (error) {
    console.error('[Daily Scan]', error);
    return NextResponse.json({ error: 'scan_failed' }, { status: 500 });
  }
}
