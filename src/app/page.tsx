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
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  listRemovalEvents,
  listRemovalEventsForWeek
} from "@/lib/db/removal-repository";
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
  const [weekly, all] = await Promise.all([
    attachRemovalArtwork(user.id, weeklyRaw),
    attachRemovalArtwork(user.id, allRaw)
  ]);

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

  const paginateTrackList = (tracks: SpotifyTrack[]) => {
    const pageSize = 50;
    const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));
    const currentPage = Math.min(
      Math.max(collectionPageParam, 0),
      totalPages - 1
    );
    const start = currentPage * pageSize;
    const slice = tracks.slice(start, start + pageSize);
    const pagination =
      totalPages > 1
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
    return { slice, pagination };
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
    const playlistTracks = await withAccessToken(user.id, (accessToken) =>
      client
        .fetchPlaylistTracks(accessToken, collectionId, collectionName, {
          maxPages: 3
        })
        .catch(() => [])
    );
    const playlistMeta =
      library.playlists.find((playlist) => playlist.id === collectionId) ?? null;
    const { slice, pagination } = paginateTrackList(playlistTracks);
    trackTableData = {
      title: collectionName ?? playlistMeta?.name ?? "Playlist",
      subtitle: `${playlistTracks.length} tracks`,
      externalHref: `https://open.spotify.com/playlist/${collectionId}`,
      tracks: mapToRows(slice),
      pagination
    };
  } else if (collectionType === "liked") {
    const likedTracks = await withAccessToken(user.id, (accessToken) =>
      client.fetchLikedTracks(accessToken, { maxPages: 4 }).catch(() => [])
    );
    const { slice, pagination } = paginateTrackList(likedTracks);
    trackTableData = {
      title: "Liked Songs",
      subtitle: `${likedTracks.length} tracks`,
      externalHref: "https://open.spotify.com/collection/tracks",
      tracks: mapToRows(slice),
      pagination
    };
  } else if (collectionType === "album" && collectionId) {
    const albumTracks = await withAccessToken(user.id, (accessToken) =>
      client.fetchAlbumTracks(accessToken, collectionId).catch(() => [])
    );
    const { slice, pagination } = paginateTrackList(albumTracks);
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
  const replacementCount = all.filter(
    (event) => Boolean(event.replacementTrackId)
  ).length;

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
    },
    {
      label: "Replacement matches",
      value: `${replacementCount} suggestions`,
      helper: replacementCount ? "All pending review" : "Matches appear after scans"
    }
  ];

  const tabs: Array<{ id: DashboardView; label: string }> = [
    { id: "weekly", label: "Removed This Week" },
    { id: "archive", label: "All Removed Songs" }
  ];

  return (
    <main className="min-h-screen bg-[#020202] text-foreground">
      <DashboardHeader user={user} view={view} />
      <div className="grid gap-8 px-6 py-10 lg:grid-cols-[minmax(0,2.1fr)_420px]">
        <section className="space-y-6">
          <div className="surface-card flex flex-col gap-4 rounded-3xl border border-white/5 bg-gradient-to-r from-[#0d0d0d] to-[#050505] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
                Library health
              </p>
              <h2 className="text-2xl font-semibold">Run scans when you&apos;re ready</h2>
              <p className="text-sm text-muted-foreground">
                Kick off a liked-songs or playlist scan from the sidebar whenever you want a new snapshot. {hasHistory ? "Your previous scans are summarized below." : "Start by running your first scan to capture a baseline."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Scans consume Spotify API calls, so we now run them on demand.
            </p>
          </div>

          {trackTableData ? (
            <TrackTable
              title={trackTableData.title}
              subtitle={trackTableData.subtitle}
              tracks={trackTableData.tracks}
              externalHref={trackTableData.externalHref}
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
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={buildHref({ view: tab.id === "weekly" ? undefined : tab.id })}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      view === tab.id
                        ? "border-emerald-400 bg-emerald-400/15 text-foreground"
                        : "border-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>

              {view !== "settings" ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="surface-card rounded-2xl border border-white/5 bg-black/30 p-4 shadow-inner shadow-black/40"
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
                  <div className="surface-card space-y-4 rounded-3xl border border-white/5 bg-black/30 p-6 shadow-inner shadow-black/30">
                    <h2 className="text-xl font-semibold">Notification preferences</h2>
                    <p className="text-sm text-muted-foreground">
                      Decide how the weekly digest shows up. Emails summarize removals while in-app keeps an unread queue.
                    </p>
                    <NotificationPreferenceForm
                      channel={user.notificationChannel}
                      enabled={user.notificationsEnabled}
                    />
                  </div>
                  <div className="surface-card space-y-4 rounded-3xl border border-white/5 bg-black/30 p-6 shadow-inner shadow-black/30">
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    <ThemeToggle currentTheme={themeCookie} />
                  </div>
                  <div className="space-y-4 rounded-3xl border border-red-500/40 bg-red-500/5 p-6 shadow-inner shadow-red-900/40">
                    <h2 className="text-xl font-semibold text-red-200">Danger zone</h2>
                    <p className="text-sm text-red-100/80">
                      Export or delete your entire history. Actions are irreversible and comply with the PRD’s right-to-forget.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-black/20 px-4 py-2 text-sm text-muted-foreground">
                        Export removal archive
                        <span className="text-xs text-white/70">JSON / CSV</span>
                      </div>
                      <button className="w-full rounded-full border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20">
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
              likedSongs={library.likedSongsPreview}
              playlistPreview={playlistPreview}
              activeCollection={{ type: collectionType, id: collectionId }}
              page={playlistPage}
            />
            <section className="surface-card space-y-2 rounded-3xl border border-white/5 bg-black/30 p-5 text-sm text-muted-foreground shadow-inner shadow-black/40">
              <p className="text-sm font-semibold text-foreground">Scan health & rate limits</p>
              <p>
                Spotify calls are paginated + throttled to respect API caps. Cron runners should space scans per user.
              </p>
              <p className="text-sm font-semibold text-foreground pt-3">One-click deletion</p>
              <p>
                Product requirements demand reversible, append-only history with a delete option. Ensure the danger-zone flow stays wired to Prisma.
              </p>
            </section>
          </aside>
        ) : null}
      </div>
    </main>
  );
};

export default HomePage;
