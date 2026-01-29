import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

import { deleteHistoryAction } from "@/app/actions/delete-history";
import { LandingHero } from "@/components/landing-hero";
import { DashboardHeader } from "@/components/dashboard-header";
import { RemovedList } from "@/components/removed-list";
import { NotificationPreferenceForm } from "@/components/notification-preference-form";
import { DevEmailTestPanel } from "@/components/dev-email-test-panel";
import { LibraryPanel } from "@/components/library-panel";
import { TrackTable } from "@/components/track-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { LikedBaselineBanner } from "@/components/liked-baseline-banner";
import { PlaylistOnboardingDialog } from "@/components/playlist-onboarding-dialog";
import { ReauthBanner } from "@/components/reauth-banner";
import { DeleteHistoryForm } from "@/components/delete-history-form";
import { PlaylistsAffected } from "@/components/playlists-affected";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatDate, formatTimeAgo } from "@/lib/dashboard/formatters";
import { loadDashboardData } from "@/lib/dashboard/load-dashboard";
import { makeBuildHref } from "@/lib/dashboard/navigation";
import type { PageSearchParams } from "@/lib/dashboard/types";

type PageProps = {
  searchParams?: PageSearchParams;
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

  const buildHref = makeBuildHref(searchParams);
  const {
    view,
    playlistPage,
    collectionType,
    collectionId,
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
    showLikedBaseline,
    isLocalEnv,
    playlistsAffected,
    affectedPlaylistIds,
    playlistLastRemovedAt,
    trackedPlaylistNameById,
    affectedPlaylistPreview
  } = await loadDashboardData({ user, searchParams, buildHref });

  const weeklyAcknowledged = weekly;
  const allAcknowledged = all;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PlaylistOnboardingDialog
        playlists={library.playlists}
        open={needsOnboarding}
      />
      <DashboardHeader user={user} view={view} />
      {user.reauthRequired ? (
        <div className="px-6 pt-6">
          <ReauthBanner />
        </div>
      ) : null}
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
                <div className="flex flex-wrap items-center gap-2">
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
              

              {view === "weekly" ? (
                <RemovedList
                  title="Removed This Week"
                  events={weeklyAcknowledged}
                  emptyMessage={weeklyEmptyMessage}
                />
              ) : null}

              {view === "archive" ? (
                <RemovedList
                  title="All Removed Songs"
                  events={allAcknowledged}
                  emptyMessage={archiveEmptyMessage}
                />
              ) : null}

              {view === "playlists" ? (
                <PlaylistsAffected
                  total={playlistsAffected}
                  items={affectedPlaylistIds
                    .map((id) => {
                      const name = trackedPlaylistNameById.get(id);
                      if (!name) return null;
                      const playlist = library.playlists.find(
                        (item) => item.id === id
                      );
                      const lastRemovedAt = playlistLastRemovedAt.get(id) ?? new Date();
                      return {
                        id,
                        name,
                        spotifyHref: `https://open.spotify.com/playlist/${id}`,
                        dashboardHref: buildHref({
                          view: "playlists",
                          collection: "playlist",
                          collectionId: id,
                          collectionName: name,
                          collectionPage: "0"
                        }),
                        imageUrl: playlist?.imageUrl ?? null,
                        lastRemovedAt: lastRemovedAt.toISOString()
                      };
                    })
                    .filter((item): item is NonNullable<typeof item> => Boolean(item))}
                  emptyMessage={affectedPlaylistPreview}
                />
              ) : null}

              {view === "settings" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="surface-card space-y-4 rounded-3xl border border-border/40 bg-card/50 p-6">
                    <h2 className="text-xl font-semibold">Notification preferences</h2>
                    <NotificationPreferenceForm
                      enabled={user.notificationsEnabled}
                    />
                  </div>
                  {isLocalEnv ? (
                    <div className="surface-card space-y-4 rounded-3xl border border-emerald-400/20 bg-card/50 p-6">
                      <DevEmailTestPanel />
                    </div>
                  ) : null}
                  <div className="surface-card space-y-4 rounded-3xl border border-border/40 bg-card/50 p-6">
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    <ThemeToggle currentTheme={themeCookie} />
                  </div>
                  <div className="surface-card space-y-4 rounded-3xl border border-border/40 bg-card/50 p-6">
                    <h2 className="text-xl font-semibold">Legal</h2>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <a
                        href="/privacy"
                        className="underline-offset-4 transition hover:text-foreground hover:underline"
                      >
                        Privacy Policy
                      </a>
                      <a
                        href="/terms"
                        className="underline-offset-4 transition hover:text-foreground hover:underline"
                      >
                        Terms of Service
                      </a>
                    </div>
                  </div>
                  <div className="space-y-4 rounded-3xl border border-red-500/30 bg-red-500/5 p-6 shadow-inner">
                    <h2 className="text-xl font-semibold text-red-200">Danger zone</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/40 px-4 py-2 text-sm text-muted-foreground">
                        Export removal archive
                        <span className="text-xs text-muted-foreground">JSON / CSV</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="/api/exports/removals?format=json"
                          className="inline-flex items-center justify-center rounded-full border border-border/40 bg-card/40 px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground"
                        >
                          Download JSON
                        </a>
                        <a
                          href="/api/exports/removals?format=csv"
                          className="inline-flex items-center justify-center rounded-full border border-border/40 bg-card/40 px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground"
                        >
                          Download CSV
                        </a>
                      </div>
                      <DeleteHistoryForm action={deleteHistoryAction} />
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
                followedArtists={library.followedArtists}
                savedAlbums={library.savedAlbums}
                monitoredPlaylists={monitoredPlaylists}
                playlistBadgeCounts={playlistBadgeCounts}
                likedBadgeCount={likedBadgeCount}
              badgePollingEnabled
              activeCollection={{ type: collectionType, id: collectionId }}
              page={playlistPage}
              preferredPanel={view === "playlists" ? "playlists" : undefined}
            />
          </aside>
        ) : null}
      </div>
    </main>
  );
};

export default HomePage;
