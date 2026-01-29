import { prisma } from "@/lib/db/client";
import {
  listRemovalEvents,
  listRemovalEventsForWeek
} from "@/lib/db/removal-repository";
import { getBaselineStatus } from "@/lib/db/baseline-repository";
import type { BaselineStatus } from "@/lib/db/baseline-repository";
import { attachRemovalArtwork } from "@/lib/removals/with-artwork";
import { getLibraryOverview } from "@/lib/spotify/library";
import { getSpotifyClient, withAccessToken } from "@/lib/spotify/service";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { SpotifyTrack } from "@/lib/spotify/client";
import { subtractDays } from "@/lib/dashboard/formatters";
import { parseDashboardParams } from "@/lib/dashboard/params";
import type {
  DashboardView,
  PageSearchParams,
  TrackTableData
} from "@/lib/dashboard/types";

type DashboardModel = {
  view: DashboardView;
  playlistPage: number;
  collectionType?: "playlist" | "liked" | "album";
  collectionId?: string;
  collectionName?: string;
  collectionPage: number;
  collectionPageSize: number;
  library: Awaited<ReturnType<typeof getLibraryOverview>>;
  weekly: ReturnType<typeof attachRemovalArtwork> extends Promise<infer T>
    ? T
    : never;
  all: ReturnType<typeof attachRemovalArtwork> extends Promise<infer T>
    ? T
    : never;
  weeklyEmptyMessage: string;
  archiveEmptyMessage: string;
  tabs: Array<{ id: DashboardView; label: string }>;
  trackTableData: TrackTableData | null;
  needsOnboarding: boolean;
  monitoredPlaylists: Record<string, boolean>;
  playlistBadgeCounts: Record<string, number>;
  likedBadgeCount: number;
  scanHealthLabel: string;
  activeScanHealth:
    | {
        lastSuccessAt: Date | null;
        lastRemovedCount: number | null;
        lastTrackCount: number | null;
      }
    | null;
  likedBaseline: BaselineStatus | null;
  showLikedBaseline: boolean;
  isLocalEnv: boolean;
  playlistsAffected: number;
  affectedPlaylistIds: string[];
  playlistLastRemovedAt: Map<string, Date>;
  trackedPlaylistNameById: Map<string, string>;
  affectedPlaylistPreview: string;
};

const mapToRows = (tracks: SpotifyTrack[]) =>
  tracks.map((track) => ({
    id: track.id ?? `${track.name}-${track.album}`,
    name: track.name,
    artists: track.artists,
    imageUrl: track.imageUrl,
    durationMs: track.durationMs,
    externalUrl: track.id
      ? `https://open.spotify.com/track/${track.id}`
      : undefined
  }));

const buildPagination = (
  totalItems: number,
  collectionPage: number,
  collectionPageSize: number,
  buildHref: (overrides: Record<string, string | undefined>) => string
) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / collectionPageSize));
  const currentPage = Math.min(collectionPage, totalPages - 1);
  return totalPages > 1
    ? {
        currentPage,
        totalPages,
        startIndex: currentPage * collectionPageSize,
        prevHref:
          currentPage > 0
            ? buildHref({ collectionPage: String(currentPage - 1) })
            : undefined,
        nextHref:
          currentPage < totalPages - 1
            ? buildHref({ collectionPage: String(currentPage + 1) })
            : undefined
      }
    : undefined;
};

export const loadDashboardData = async (options: {
  user: CurrentUser;
  searchParams?: PageSearchParams;
  buildHref: (overrides: Record<string, string | undefined>) => string;
}): Promise<DashboardModel> => {
  const { user, searchParams, buildHref } = options;
  const params = parseDashboardParams(searchParams);
  const {
    view,
    playlistPage,
    collectionType,
    collectionId,
    collectionName,
    collectionPage,
    collectionPageSize
  } = params;

  const [weeklyRaw, allRaw, library, scanHealthRows] = await Promise.all([
    listRemovalEventsForWeek({
      userId: user.id,
      since: subtractDays(7)
    }),
    listRemovalEvents({
      userId: user.id,
      limit: 250
    }),
    getLibraryOverview(user.id),
    prisma.scanHealth.findMany({
      where: { userId: user.id }
    })
  ]);
  const [weeklyDecorated, allDecorated, monitoredRows] = await Promise.all([
    attachRemovalArtwork(user.id, weeklyRaw),
    attachRemovalArtwork(user.id, allRaw),
    prisma.monitoredPlaylist.findMany({
      where: { userId: user.id }
    })
  ]);

  const monitoredPlaylists: Record<string, boolean> = {};
  monitoredRows.forEach((row) => {
    monitoredPlaylists[row.playlistId] = row.enabled;
  });
  const trackedPlaylistNameById = new Map(
    monitoredRows
      .filter((row) => row.enabled)
      .map((row) => [row.playlistId, row.playlistName] as const)
  );
  const monitoredTargets = monitoredRows
    .filter((row) => row.enabled)
    .map((row) => ({ id: row.playlistId, name: row.playlistName }));
  const needsOnboarding = monitoredTargets.length === 0;

  const playlistAcknowledgedAt: Record<string, Date> = {};
  monitoredRows.forEach((row) => {
    if (row.lastAcknowledgedAt) {
      playlistAcknowledgedAt[row.playlistId] = row.lastAcknowledgedAt;
    }
  });

  const likedAcknowledgedAt = user.notificationLastAcknowledgedAt ?? new Date(0);

  const scanHealthByKey = new Map(
    scanHealthRows.map((row) => [`${row.scope}:${row.playlistId}`, row])
  );
  const likedScanHealth = scanHealthByKey.get("LIKED:");
  const playlistScanHealth =
    collectionType === "playlist" && collectionId
      ? scanHealthByKey.get(`PLAYLIST:${collectionId}`)
      : null;
  const playlistNameForHealth =
    collectionType === "playlist" && collectionId
      ? library.playlists.find((playlist) => playlist.id === collectionId)
          ?.name ??
        collectionName ??
        "Playlist"
      : null;
  const activeScanHealth = playlistScanHealth ?? likedScanHealth;
  const scanHealthLabel = playlistScanHealth
    ? playlistNameForHealth ?? "Playlist"
    : "Liked Songs";

  const acknowledgedPlaylistIdsFor = (
    event: typeof weeklyDecorated[number]
  ) =>
    event.playlistIds.filter((playlistId) => {
      if (!monitoredPlaylists[playlistId]) {
        return false;
      }
      const ack = playlistAcknowledgedAt[playlistId];
      if (!ack) return false;
      return event.removedAt.getTime() <= ack.getTime();
    });

  const acknowledgedPlaylistNamesFor = (
    event: typeof weeklyDecorated[number],
    playlistIds: string[]
  ) => {
    const nameById = new Map(
      event.playlistIds.map((id, index) => [id, event.playlistNames[index]])
    );
    return playlistIds.map(
      (playlistId) =>
        trackedPlaylistNameById.get(playlistId) ??
        nameById.get(playlistId) ??
        "Playlist"
    );
  };

  const isAcknowledgedLiked = (event: typeof weeklyDecorated[number]) =>
    event.playlistIds.length === 0 &&
    event.removedAt.getTime() <= likedAcknowledgedAt.getTime();

  const isRevealed = (event: typeof weeklyDecorated[number]) => {
    if (isAcknowledgedLiked(event)) {
      return true;
    }
    return acknowledgedPlaylistIdsFor(event).length > 0;
  };

  const groupRemovalEvents = (events: typeof weeklyDecorated) => {
    const map = new Map<string, (typeof weeklyDecorated)[number]>();
    events.forEach((event) => {
      const key = event.trackId
        ? `${event.trackId}-${event.removedAt.toISOString().slice(0, 10)}`
        : `${event.trackName}-${event.removedAt.toISOString()}`;
      const acknowledgedIds = acknowledgedPlaylistIdsFor(event);
      const acknowledgedNames = acknowledgedPlaylistNamesFor(
        event,
        acknowledgedIds
      );
      const playlistSources = [
        ...acknowledgedNames,
        ...(isAcknowledgedLiked(event) ? ["Liked Songs"] : [])
      ];
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...event,
          playlistIds: acknowledgedIds.slice(),
          playlistNames: [...new Set(playlistSources)]
        });
        return;
      }
      const combinedNames = new Set(existing.playlistNames);
      playlistSources.forEach((name) => combinedNames.add(name));
      existing.playlistNames = Array.from(combinedNames);

      if (acknowledgedIds.length) {
        const combinedIds = new Set(existing.playlistIds);
        acknowledgedIds.forEach((id) => combinedIds.add(id));
        existing.playlistIds = Array.from(combinedIds);
      }

      if (!existing.replacementTrackId && event.replacementTrackId) {
        existing.replacementTrackId = event.replacementTrackId;
        existing.replacementTrackName = event.replacementTrackName;
      }
      if (!existing.albumImageUrl && event.albumImageUrl) {
        existing.albumImageUrl = event.albumImageUrl;
      }
      if (event.removedAt > existing.removedAt) {
        existing.removedAt = event.removedAt;
      }
    });

    const revealAtFor = (event: (typeof weeklyDecorated)[number]) => {
      const times: number[] = [];
      if (event.playlistNames.includes("Liked Songs")) {
        times.push(likedAcknowledgedAt.getTime());
      }
      event.playlistIds.forEach((playlistId) => {
        const ack = playlistAcknowledgedAt[playlistId];
        if (ack) {
          times.push(ack.getTime());
        }
      });
      return times.length ? Math.max(...times) : event.removedAt.getTime();
    };

    return Array.from(map.values()).sort((a, b) => {
      const byRemoved = b.removedAt.getTime() - a.removedAt.getTime();
      if (byRemoved !== 0) return byRemoved;
      const byReveal = revealAtFor(b) - revealAtFor(a);
      if (byReveal !== 0) return byReveal;
      return a.trackName.localeCompare(b.trackName);
    });
  };

  const weeklyRevealed = weeklyDecorated.filter(isRevealed);
  const allRevealed = allDecorated.filter(isRevealed);

  const weekly = groupRemovalEvents(weeklyRevealed);
  const all = groupRemovalEvents(allRevealed);

  const client = getSpotifyClient();
  let trackTableData: TrackTableData | null = null;

  if (collectionType === "playlist" && collectionId) {
    const playlistPageData = await withAccessToken(user.id, (accessToken) =>
      client
        .fetchPlaylistTracksPage(accessToken, collectionId, collectionName, {
          offset: collectionPage * collectionPageSize,
          limit: collectionPageSize
        })
        .catch(() => ({ tracks: [], total: 0 }))
    );
    const playlistMeta =
      library.playlists.find((playlist) => playlist.id === collectionId) ?? null;
    trackTableData = {
      title: collectionName ?? playlistMeta?.name ?? "Playlist",
      subtitle: `${playlistPageData.total.toLocaleString()} tracks`,
      externalHref: `https://open.spotify.com/playlist/${collectionId}`,
      tracks: mapToRows(playlistPageData.tracks),
      pagination: buildPagination(
        playlistPageData.total,
        collectionPage,
        collectionPageSize,
        buildHref
      )
    };
  } else if (collectionType === "liked") {
    const likedPageData = await withAccessToken(user.id, (accessToken) =>
      client
        .fetchLikedTracksPage(accessToken, {
          offset: collectionPage * collectionPageSize,
          limit: collectionPageSize
        })
        .catch(() => ({ tracks: [], total: 0 }))
    );
    trackTableData = {
      title: "Liked Songs",
      subtitle: `${likedPageData.total.toLocaleString()} tracks`,
      footerCta: {
        href: "https://open.spotify.com/collection/tracks",
        label: "Open in Spotify"
      },
      tracks: mapToRows(likedPageData.tracks),
      pagination: buildPagination(
        likedPageData.total,
        collectionPage,
        collectionPageSize,
        buildHref
      )
    };
  } else if (collectionType === "album" && collectionId) {
    const albumTracks = await withAccessToken(user.id, (accessToken) =>
      client.fetchAlbumTracks(accessToken, collectionId).catch(() => [])
    );
    const totalPages = Math.max(
      1,
      Math.ceil(albumTracks.length / collectionPageSize)
    );
    const currentPage = Math.min(collectionPage, totalPages - 1);
    const start = currentPage * collectionPageSize;
    const slice = albumTracks.slice(start, start + collectionPageSize);
    trackTableData = {
      title: collectionName ?? "Album",
      subtitle: `${albumTracks.length} tracks`,
      externalHref: `https://open.spotify.com/album/${collectionId}`,
      tracks: mapToRows(slice),
      pagination: buildPagination(
        albumTracks.length,
        collectionPage,
        collectionPageSize,
        buildHref
      )
    };
  }

  if (view === "settings") {
    trackTableData = null;
  }

  const isLocalEnv =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_APP_URL?.includes("127.0.0.1") ||
    process.env.NEXT_PUBLIC_APP_URL?.includes("localhost");

  const playlistLastRemovedAt = new Map<string, Date>();
  all.forEach((event) => {
    event.playlistIds.forEach((id) => {
      if (!trackedPlaylistNameById.has(id)) return;
      const current = playlistLastRemovedAt.get(id);
      if (!current || event.removedAt > current) {
        playlistLastRemovedAt.set(id, event.removedAt);
      }
    });
  });
  const affectedPlaylistIds = Array.from(playlistLastRemovedAt.entries())
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .map(([id]) => id);
  const playlistsAffected = affectedPlaylistIds.length;
  const affectedPlaylistNames = affectedPlaylistIds
    .map((id) => trackedPlaylistNameById.get(id))
    .filter(Boolean) as string[];
  const affectedPlaylistPreview = affectedPlaylistNames.length
    ? affectedPlaylistNames.join(", ")
    : "No tracked playlist removals yet.";

  const hasHistory = all.length > 0;
  const weeklyEmptyMessage = hasHistory
    ? "No removals detected in the last 7 days."
    : "No scans yet. Run your first scan to start tracking removals.";
  const archiveEmptyMessage = hasHistory
    ? "Your full removal history will appear here after the next scan."
    : "Run a scan to start building your removal history.";

  const tabs: Array<{ id: DashboardView; label: string }> = [
    { id: "weekly", label: "Removed This Week" },
    { id: "archive", label: "All Removed Songs" },
    { id: "playlists", label: "Playlists affected" }
  ];

  const [likedBaseline, likedSnapshotCount] = await Promise.all([
    getBaselineStatus(user.id, "LIKED", null),
    prisma.snapshot.count({
      where: { userId: user.id, scope: "LIKED" }
    })
  ]);
  const showLikedBaseline =
    view !== "settings" &&
    !trackTableData &&
    (likedBaseline ? !likedBaseline.completed : likedSnapshotCount === 0);

  const playlistBadgeCounts: Record<string, number> = {};
  let likedBadgeCount = 0;
  allDecorated.forEach((event) => {
    if (!event.playlistIds.length) {
      if (event.removedAt.getTime() > likedAcknowledgedAt.getTime()) {
        likedBadgeCount += 1;
      }
      return;
    }

    event.playlistIds.forEach((playlistId) => {
      if (!monitoredPlaylists[playlistId]) {
        return;
      }
      const ack = playlistAcknowledgedAt[playlistId] ?? new Date(0);
      if (event.removedAt.getTime() > ack.getTime()) {
        playlistBadgeCounts[playlistId] =
          (playlistBadgeCounts[playlistId] ?? 0) + 1;
      }
    });
  });

  return {
    view,
    playlistPage,
    collectionType,
    collectionId,
    collectionName,
    collectionPage,
    collectionPageSize,
    library,
    weekly,
    all,
    weeklyEmptyMessage,
    archiveEmptyMessage,
    tabs,
    trackTableData,
    needsOnboarding,
    monitoredPlaylists,
    playlistBadgeCounts,
    likedBadgeCount,
    scanHealthLabel,
    activeScanHealth: activeScanHealth
      ? {
          lastSuccessAt: activeScanHealth.lastSuccessAt,
          lastRemovedCount: activeScanHealth.lastRemovedCount,
          lastTrackCount: activeScanHealth.lastTrackCount
        }
      : null,
    likedBaseline,
    showLikedBaseline,
    isLocalEnv,
    playlistsAffected,
    affectedPlaylistIds,
    playlistLastRemovedAt,
    trackedPlaylistNameById,
    affectedPlaylistPreview
  };
};
