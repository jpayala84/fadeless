import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

import { deleteHistoryAction } from "@/app/actions/delete-history";
import { LandingHero } from "@/components/landing-hero";
import { DashboardHeader } from "@/components/dashboard-header";
import { RemovedList } from "@/components/removed-list";
import { NotificationPreferenceForm } from "@/components/notification-preference-form";
import { LibraryPanel } from "@/components/library-panel";
import { TrackTable } from "@/components/track-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { LikedBaselineBanner } from "@/components/liked-baseline-banner";
import { PlaylistOnboardingDialog } from "@/components/playlist-onboarding-dialog";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  listRemovalEvents,
  listRemovalEventsForWeek
} from "@/lib/db/removal-repository";
import { getBaselineStatus } from "@/lib/db/baseline-repository";
import { prisma } from "@/lib/db/client";
import { attachRemovalArtwork } from "@/lib/removals/with-artwork";
import { getLibraryOverview } from "@/lib/spotify/library";
import { getSpotifyClient, withAccessToken } from "@/lib/spotify/service";
import type { PlaylistTrack, SpotifyTrack } from "@/lib/spotify/client";

const subtractDays = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

type DashboardView = "weekly" | "archive" | "settings";

type PageProps = {
  searchParams?: {
    playlist?: string;
    playlistPage?: string;
    view?: DashboardView;
    collection?: string;
    collectionId?: string;
    collectionName?: string;
    collectionPage?: string;
  };
};

const HomePage = async ({ searchParams }: PageProps) => {
  const user = await getCurrentUser();
  const themeCookie = cookies().get("theme")?.value === "light" ? "light" : "dark";

  if (!user) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <LandingHero />
      </main>
    );
  }

  const playlistPage = Number(searchParams?.playlistPage ?? "0") || 0;
  const viewParam = searchParams?.view;
  const view: DashboardView =
    viewParam === "archive" || viewParam === "settings" ? viewParam : "weekly";

  const collectionParam = searchParams?.collection;
  const collectionType: "playlist" | "liked" | "album" | undefined =
    collectionParam === "playlist" ||
    collectionParam === "liked" ||
    collectionParam === "album"
      ? collectionParam
      : undefined;
  const collectionId = searchParams?.collectionId;
  const collectionName = searchParams?.collectionName;
  const collectionPageParam =
    Number(searchParams?.collectionPage ?? "0") || 0;
  const collectionPage = Math.max(0, collectionPageParam);
  const collectionPageSize = 50;

  const [weeklyRaw, allRaw, library] = await Promise.all([
    listRemovalEventsForWeek({
      userId: user.id,
      since: subtractDays(7)
    }),
    listRemovalEvents({
      userId: user.id,
      limit: 250
    }),
    getLibraryOverview(user.id)
  ]);
  const [weeklyDecorated, allDecorated] = await Promise.all([
    attachRemovalArtwork(user.id, weeklyRaw),
    attachRemovalArtwork(user.id, allRaw)
  ]);

  const groupRemovalEvents = (
    events: typeof weeklyDecorated
  ): typeof weeklyDecorated => {
    const map = new Map<string, (typeof weeklyDecorated)[number]>();
    events.forEach((event) => {
      const key = event.trackId
        ? `${event.trackId}-${event.removedAt.toISOString().slice(0, 10)}`
        : `${event.trackName}-${event.removedAt.toISOString()}`;
      const playlistSources =
        event.playlistNames.length > 0
          ? event.playlistNames
          : ["Liked Songs"];
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...event,
          playlistNames: [...new Set(playlistSources)]
        });
        return;
      }
      const combined = new Set(existing.playlistNames);
      playlistSources.forEach((name) => combined.add(name));
      existing.playlistNames = Array.from(combined);
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
    return Array.from(map.values()).sort(
      (a, b) => b.removedAt.getTime() - a.removedAt.getTime()
    );
  };

  const weekly = groupRemovalEvents(weeklyDecorated);
  const all = groupRemovalEvents(allDecorated);

  const monitoredRows = await prisma.monitoredPlaylist.findMany({
    where: { userId: user.id }
  });
  const monitoredPlaylists: Record<string, boolean> = {};
  monitoredRows.forEach((row) => {
    monitoredPlaylists[row.playlistId] = row.enabled;
  });
  const monitoredTargets = monitoredRows
    .filter((row) => row.enabled)
    .map((row) => ({ id: row.playlistId, name: row.playlistName }));
  const needsOnboarding = monitoredTargets.length === 0;

  const client = getSpotifyClient();
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

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (!value || Array.isArray(value)) {
          return;
        }
        params.set(key, value);
      });
    }
    Object.entries(overrides).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const query = params.toString();
    return query ? `/?${query}` : "/";
  };

  const buildPagination = (totalItems: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / collectionPageSize));
    const currentPage = Math.min(collectionPage, totalPages - 1);
    return totalPages > 1
      ? {
          currentPage,
          totalPages,
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

  let playlistPreview: PlaylistTrack[] = [];
  if (collectionType === "playlist" && collectionId) {
    playlistPreview = await withAccessToken(user.id, (accessToken) =>
      client
        .fetchPlaylistPreview(accessToken, collectionId, collectionName)
        .catch(() => [])
    );
  }

  type TrackTableData = {
    title: string;
    subtitle?: string;
    externalHref?: string;
    footerCta?: { href: string; label: string };
    tracks: Array<{
      id: string;
      name: string;
      artists: string[];
      imageUrl?: string;
      durationMs?: number;
      externalUrl?: string;
    }>;
    pagination?: {
      currentPage: number;
      totalPages: number;
      prevHref?: string;
      nextHref?: string;
    };
  };

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
    const pagination = buildPagination(playlistPageData.total);
    trackTableData = {
      title: collectionName ?? playlistMeta?.name ?? "Playlist",
      subtitle: `${playlistPageData.total.toLocaleString()} tracks`,
      externalHref: `https://open.spotify.com/playlist/${collectionId}`,
      tracks: mapToRows(playlistPageData.tracks),
      pagination
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
    const pagination = buildPagination(likedPageData.total);
    trackTableData = {
      title: "Liked Songs",
      subtitle: `${likedPageData.total.toLocaleString()} tracks`,
      footerCta: {
        href: "https://open.spotify.com/collection/tracks",
        label: "Open in Spotify"
      },
      tracks: mapToRows(likedPageData.tracks),
      pagination
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
    const pagination = buildPagination(albumTracks.length);
    trackTableData = {
      title: collectionName ?? "Album",
      subtitle: `${albumTracks.length} tracks`,
      externalHref: `https://open.spotify.com/album/${collectionId}`,
      tracks: mapToRows(slice),
      pagination
    };
  }

  if (view === "settings") {
    trackTableData = null;
  }

  const now = new Date();
  const monthlyRemoved = all.filter(
    (event) =>
      event.removedAt.getMonth() === now.getMonth() &&
      event.removedAt.getFullYear() === now.getFullYear()
  ).length;
  const playlistsAffected = new Set(
    all.flatMap((event) => event.playlistNames ?? [])
  ).size;

  const hasHistory = all.length > 0;
  const weeklyEmptyMessage = hasHistory
    ? "No removals recorded in the last 7 days."
    : "We need a baseline snapshot first. Run a scan to capture your library.";
  const archiveEmptyMessage = hasHistory
    ? "All detected removals will show here once the next scan completes."
    : "Run your first scan to populate the archive.";

  const stats = [
    {
      label: "Removed this month",
      value: `${monthlyRemoved} tracks`,
      helper: weekly.length ? `+${weekly.length} this week` : "Run a scan to begin"
    },
    {
      label: "Playlists affected",
      value: `${playlistsAffected} playlists`,
      helper:
        library.playlists.slice(0, 3).map((playlist) => playlist.name).join(", ") ||
        "Scans populate playlist impact."
    }
  ];

  const tabs: Array<{ id: DashboardView; label: string }> = [
    { id: "weekly", label: "Removed This Week" },
    { id: "archive", label: "All Removed Songs" }
  ];

  const [likedBaseline, likedSnapshotCount] = await Promise.all([
    getBaselineStatus(user.id, "LIKED", null),
    prisma.snapshot.count({
      where: { userId: user.id, scope: "LIKED" }
    })
  ]);
  const showLikedBaseline =
    view !== "settings" && !trackTableData && (likedBaseline ? !likedBaseline.completed : likedSnapshotCount === 0);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PlaylistOnboardingDialog
        playlists={library.playlists}
        open={needsOnboarding}
      />
      <DashboardHeader user={user} view={view} />
      <div className="grid gap-8 px-6 py-10 lg:grid-cols-[minmax(0,2.1fr)_420px]">
        <section className="space-y-6">
          {trackTableData ? (
            <TrackTable
              title={trackTableData.title}
              subtitle={trackTableData.subtitle}
              tracks={trackTableData.tracks}
              externalHref={trackTableData.externalHref}
              footerCta={trackTableData.footerCta}
              pagination={trackTableData.pagination}
              backHref={buildHref({
                collection: undefined,
                collectionId: undefined,
                collectionName: undefined,
                collectionPage: undefined
              })}
            />
          ) : (
            <>
              {showLikedBaseline ? (
                <LikedBaselineBanner
                  totalCount={library.likedSongsCount}
                  initialIndexedCount={likedBaseline?.indexedCount ?? 0}
                  initiallyCompleted={likedBaseline?.completed ?? false}
                />
              ) : null}
              {view !== "settings" ? (
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.id}
                      href={buildHref({ view: tab.id === "weekly" ? undefined : tab.id })}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        view === tab.id
                          ? "border-emerald-400/50 bg-emerald-400/10 text-foreground"
                          : "border-border/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              ) : null}

              {view !== "settings" ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="surface-card rounded-2xl border border-border/40 bg-card/50 p-4 shadow-inner"
                    >
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.helper}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {view === "weekly" ? (
                <RemovedList
                  title="Removed This Week"
                  events={weekly}
                  emptyMessage={weeklyEmptyMessage}
                />
              ) : null}

              {view === "archive" ? (
                <RemovedList
                  title="All Removed Songs"
                  events={all}
                  emptyMessage={archiveEmptyMessage}
                />
              ) : null}

              {view === "settings" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="surface-card space-y-4 rounded-3xl border border-border/40 bg-card/50 p-6">
                    <h2 className="text-xl font-semibold">Notification preferences</h2>
                    <NotificationPreferenceForm
                      channel={user.notificationChannel}
                      enabled={user.notificationsEnabled}
                    />
                  </div>
                  <div className="surface-card space-y-4 rounded-3xl border border-border/40 bg-card/50 p-6">
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    <ThemeToggle currentTheme={themeCookie} />
                  </div>
                  <div className="space-y-4 rounded-3xl border border-red-500/30 bg-red-500/5 p-6 shadow-inner">
                    <h2 className="text-xl font-semibold text-red-200">Danger zone</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/40 px-4 py-2 text-sm text-muted-foreground">
                        Export removal archive
                        <span className="text-xs text-muted-foreground">JSON / CSV</span>
                      </div>
                      <button className="w-full rounded-full border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10">
                        Export archive
                      </button>
                      <form action={deleteHistoryAction}>
                        <button className="w-full rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500/80">
                          Delete my data
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        {view !== "settings" ? (
          <aside className="space-y-6">
            <LibraryPanel
              likedSongsCount={library.likedSongsCount}
              savedAlbumsCount={library.savedAlbumsCount}
              playlists={library.playlists}
              topArtists={library.topArtists}
              savedAlbums={library.savedAlbums}
              playlistPreview={playlistPreview}
              monitoredPlaylists={monitoredPlaylists}
              activeCollection={{ type: collectionType, id: collectionId }}
              page={playlistPage}
            />
          </aside>
        ) : null}
      </div>
    </main>
  );
};

export default HomePage;
