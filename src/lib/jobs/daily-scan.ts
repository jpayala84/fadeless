import type { PlaylistTrack, SpotifyTrack } from '@/lib/spotify/client';

export type TrackSnapshot = {
  trackId: string;
  trackName: string;
  artists: string[];
  albumName: string;
  playlistIds: string[];
  playlistNames: string[];
  likedSource: boolean;
  capturedAt: Date;
};

export type RemovalRecord = TrackSnapshot & {
  removedAt: Date;
};

export type DiffResult = {
  removed: RemovalRecord[];
  potentialReplacements: Array<{
    previous: TrackSnapshot;
    next: SpotifyTrack;
  }>;
};

export type SnapshotTarget =
  | { type: 'liked' }
  | { type: 'playlist'; playlistId: string; playlistName?: string };

export type SnapshotRepository = {
  latestSnapshot: (
    userId: string,
    target: SnapshotTarget
  ) => Promise<TrackSnapshot[]>;
  appendSnapshot: (
    userId: string,
    snapshot: TrackSnapshot[],
    target: SnapshotTarget
  ) => Promise<void>;
};

export type RemovalEventRepository = {
  record: (userId: string, removed: RemovalRecord[]) => Promise<void>;
};

export type ScanDependencies = {
  repo: SnapshotRepository;
  removalEvents: RemovalEventRepository;
  spotify: {
    fetchLikedTracks: () => Promise<SpotifyTrack[]>;
    fetchPlaylistTracks: (
      playlistId: string,
      playlistName?: string,
      options?: { maxPages?: number }
    ) => Promise<PlaylistTrack[]>;
  };
};

export const runDailyScan = async (
  userId: string,
  { repo, removalEvents, spotify }: ScanDependencies,
  target: SnapshotTarget
): Promise<DiffResult> => {
  const scopeLabel =
    target.type === 'liked'
      ? 'LIKED'
      : `PLAYLIST:${target.playlistId}`;
  const startedAt = Date.now();
  console.info('[ScanStarted]', {
    userId,
    scope: scopeLabel
  });
  const now = new Date();
  const previousSnapshot = await repo.latestSnapshot(userId, target);

  const currentSnapshotData =
    target.type === 'liked'
      ? buildSnapshot({
          likedTracks: await spotify.fetchLikedTracks(),
          playlistTracks: [],
          capturedAt: now
        })
      : buildSnapshot({
          likedTracks: [],
          playlistTracks: await spotify.fetchPlaylistTracks(
            target.playlistId,
            target.playlistName
          ),
          capturedAt: now
        });

  await repo.appendSnapshot(userId, currentSnapshotData, target);

  const diff =
    previousSnapshot.length === 0
      ? { removed: [], potentialReplacements: [] }
      : diffSnapshots(previousSnapshot, currentSnapshotData);
  if (diff.removed.length > 0) {
    await removalEvents.record(userId, diff.removed);
  }

  const durationMs = Date.now() - startedAt;
  console.info('[ScanCompleted]', {
    userId,
    scope: scopeLabel,
    tracks: currentSnapshotData.length,
    removed: diff.removed.length,
    durationMs
  });

  return diff;
};

const diffSnapshots = (
  previous: TrackSnapshot[],
  current: TrackSnapshot[]
): DiffResult => {
  const currentIndex = new Map(current.map((track) => [track.trackId, track]));
  const removed = previous
    .filter((track) => !currentIndex.has(track.trackId))
    .map<RemovalRecord>((track) => ({
      ...track,
      removedAt: new Date()
    }));

  return {
    removed,
    potentialReplacements: []
    // TODO: compare metadata similarity to propose replacements.
  };
};

const buildSnapshot = ({
  likedTracks,
  playlistTracks,
  capturedAt
}: {
  likedTracks: SpotifyTrack[];
  playlistTracks: PlaylistTrack[];
  capturedAt: Date;
}): TrackSnapshot[] => {
  const trackMap = new Map<string, TrackSnapshot>();

  const addOrUpdate = (
    track: SpotifyTrack,
    options: { liked?: boolean; playlist?: PlaylistTrack }
  ) => {
    const existing = trackMap.get(track.id);
    const playlistInfo = options.playlist
      ? {
          playlistId: options.playlist.playlistId,
          playlistName: options.playlist.playlistName
        }
      : null;

    if (!existing) {
      trackMap.set(track.id, {
        trackId: track.id,
        trackName: track.name,
        artists: track.artists,
        albumName: track.album,
        playlistIds: playlistInfo ? [playlistInfo.playlistId] : [],
        playlistNames: playlistInfo ? [playlistInfo.playlistName] : [],
        likedSource: Boolean(options.liked),
        capturedAt
      });
      return;
    }

    if (playlistInfo && !existing.playlistIds.includes(playlistInfo.playlistId)) {
      existing.playlistIds.push(playlistInfo.playlistId);
      existing.playlistNames.push(playlistInfo.playlistName);
    }

    if (options.liked) {
      existing.likedSource = true;
    }
  };

  likedTracks.forEach((track) => addOrUpdate(track, { liked: true }));
  playlistTracks.forEach((track) =>
    addOrUpdate(track, { playlist: track, liked: false })
  );

  return [...trackMap.values()];
};
