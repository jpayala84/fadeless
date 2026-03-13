import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AlertTriangle, Archive, Bell, Clock, Download, ListMusic, MoonStar, Palette, ShieldCheck } from "lucide-react";

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
import { loadDashboardData } from "@/lib/dashboard/load-dashboard";
import { makeBuildHref } from "@/lib/dashboard/navigation";
import type { DashboardView, PageSearchParams } from "@/lib/dashboard/types";
import { getLandingAuthError } from "@/lib/marketing/access-request";

type PageProps = {
  searchParams?: Promise<PageSearchParams>;
};

type SettingsCardProps = {
  children: ReactNode;
  className?: string;
};

const SETTINGS_CARD_BASE_CLASS =
  "surface-card settings-card space-y-4 rounded-[1.75rem] border bg-card/50 p-5 xl:p-6";

const SettingsCard = ({ children, className = "" }: SettingsCardProps) => (
  <div className={`${SETTINGS_CARD_BASE_CLASS} ${className}`.trim()}>{children}</div>
);

const HomePage = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const themeCookieValue = cookieStore.get("theme")?.value;
  const themeCookie =
    themeCookieValue === "light"
      ? "light"
      : "dark";

  if (!user) {
    const authError = getLandingAuthError(resolvedSearchParams);
    return (
      <main className="min-h-screen bg-background text-foreground">
        <LandingHero authError={authError} errorId={resolvedSearchParams?.errorId} />
      </main>
    );
  }

  const buildHref = makeBuildHref(resolvedSearchParams);
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
    likedBaseline,
    isLocalEnv,
    playlistsAffected,
    affectedPlaylistIds,
    playlistLastRemovedAt,
    trackedPlaylistNameById,
    affectedPlaylistPreview
  } = await loadDashboardData({ user, searchParams: resolvedSearchParams, buildHref });

  const weeklyAcknowledged = weekly;
  const allAcknowledged = all;
  const tabIcons: Record<DashboardView, ReactNode> = {
    weekly: <Clock className="h-4 w-4" />,
    archive: <Archive className="h-4 w-4" />,
    playlists: <ListMusic className="h-4 w-4" />,
    settings: <Palette className="h-4 w-4" />
  };
  const mobileHistoryTabs = tabs.filter(
    (tab) => tab.id === "weekly" || tab.id === "archive" || tab.id === "playlists"
  );
  const mobileSection = resolvedSearchParams?.mobileSection === "removals" ? "removals" : "library";
  const mobileRemovalTabLabels: Record<DashboardView, string> = {
    weekly: "This Week",
    archive: "All Time",
    playlists: "Playlists",
    settings: "Settings"
  };

  return (
    <main className={`desktop-glass-shell min-h-screen bg-background text-foreground ${view === "settings" ? "settings-screen" : ""}`}>
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
      {!trackTableData && view !== "settings" ? (
        <div className="hidden px-6 pt-6 md:block">
          <div className="neon-main-tabs dashboard-tab-strip flex flex-wrap items-center gap-2 rounded-3xl bg-card/30 p-3 shadow-inner backdrop-blur">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={buildHref({ view: tab.id === "weekly" ? undefined : tab.id })}
                className={`history-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  view === tab.id
                    ? "is-active border-emerald-300/80 bg-emerald-500/12 text-foreground"
                    : "border-emerald-200/25 bg-black/25 text-slate-300 hover:text-foreground"
                }`}
                data-active={view === tab.id}
              >
                {tabIcons[tab.id]}
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {!trackTableData && view !== "settings" && mobileSection === "removals" ? (
        <div className="px-4 pt-4 md:hidden">
          <div className="dashboard-tab-strip mobile-removal-tab-strip flex w-full items-center gap-2 pb-1">
            {mobileHistoryTabs.map((tab) => (
              <Link
                key={tab.id}
                href={buildHref({ view: tab.id === "weekly" ? undefined : tab.id })}
                className={`history-pill mobile-removal-pill inline-flex flex-1 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                  view === tab.id
                    ? "is-active border-emerald-300/80 bg-emerald-500/12 text-foreground"
                    : "border-emerald-200/25 bg-black/25 text-slate-300"
                }`}
                data-active={view === tab.id}
                aria-label={tab.label}
                title={tab.label}
              >
                {mobileRemovalTabLabels[tab.id]}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div
        className={`dashboard-content-grid px-4 py-6 lg:px-6 lg:py-10 ${
          view === "settings"
            ? "settings-content mx-auto w-full max-w-[1420px]"
            : "grid gap-8 md:grid-cols-[minmax(0,2.1fr)_420px]"
        }`}
      >
        <section
          className={`${view === "settings" ? "" : "order-1 min-w-0 "}space-y-6 ${
            view !== "settings" && mobileSection === "library" ? "hidden md:block" : ""
          }`}
        >
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
                <div className="settings-page settings-grid grid gap-4 lg:grid-cols-2 lg:gap-5">
                  <div className="settings-column space-y-4 lg:space-y-5">
                    <SettingsCard className="border-border/50">
                      <div className="settings-card-title settings-section-heading flex items-center gap-3 font-medium tracking-tight">
                        <MoonStar className="settings-section-icon h-[1.35rem] w-[1.35rem] text-emerald-200" />
                        Appearance
                      </div>
                      <div className="settings-divider" />
                      <ThemeToggle currentTheme={themeCookie} />
                    </SettingsCard>

                    <SettingsCard className="settings-card--primary border-border/50">
                      <div className="settings-card-title settings-section-heading flex items-center gap-3 font-medium tracking-tight">
                        <Bell className="settings-section-icon h-[1.35rem] w-[1.35rem] text-emerald-200" />
                        Notification Preferences
                      </div>
                      <div className="settings-divider" />
                      <NotificationPreferenceForm
                        enabled={user.notificationsEnabled}
                      />
                    </SettingsCard>

                    {isLocalEnv ? (
                      <SettingsCard className="settings-card--primary border-emerald-400/25">
                        <DevEmailTestPanel />
                      </SettingsCard>
                    ) : null}
                  </div>

                  <div className="settings-column space-y-4 lg:space-y-5">
                    <SettingsCard className="border-border/50">
                      <div className="settings-card-title settings-section-heading flex items-center gap-3 font-medium tracking-tight">
                        <ShieldCheck className="settings-section-icon h-[1.35rem] w-[1.35rem] text-emerald-200" />
                        Legal
                      </div>
                      <div className="settings-divider" />
                      <div className="settings-legal-links flex flex-col gap-2 text-[1rem] text-muted-foreground">
                        <a
                          href="/privacy"
                          className="transition hover:text-foreground"
                        >
                          Privacy Policy
                        </a>
                        <a
                          href="/terms"
                          className="transition hover:text-foreground"
                        >
                          Terms of Service
                        </a>
                      </div>
                    </SettingsCard>

                    <SettingsCard className="settings-card--primary border-border/50">
                      <div className="settings-card-title settings-section-heading flex items-center gap-3 font-medium tracking-tight">
                        <Download className="settings-section-icon h-[1.35rem] w-[1.35rem] text-emerald-200" />
                        Data & Export
                      </div>
                      <div className="settings-divider" />
                      <div className="text-[1rem] text-muted-foreground">
                        Export removal archive
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <a
                          href="/api/exports/removals?format=json"
                          className="settings-pill-btn neon-chip inline-flex items-center justify-center rounded-full border border-emerald-300/55 bg-transparent px-6 py-2 text-[1rem] text-foreground transition"
                        >
                          Download JSON
                        </a>
                        <a
                          href="/api/exports/removals?format=csv"
                          className="settings-pill-btn neon-chip inline-flex items-center justify-center rounded-full border border-emerald-300/55 bg-transparent px-6 py-2 text-[1rem] text-foreground transition"
                        >
                          Download CSV
                        </a>
                      </div>
                    </SettingsCard>

                    <SettingsCard className="neon-danger border-red-500/30 bg-red-500/5 shadow-inner">
                      <div className="settings-card-title settings-section-heading flex items-center gap-3 font-medium tracking-tight text-red-200">
                        <AlertTriangle className="settings-section-icon h-[1.35rem] w-[1.35rem]" />
                        Danger Zone
                      </div>
                      <div className="settings-divider settings-divider-danger" />
                      <DeleteHistoryForm action={deleteHistoryAction} />
                    </SettingsCard>
                  </div>

                </div>
              ) : null}
            </>
          )}
        </section>

        {view !== "settings" ? (
          <aside className="order-2 min-w-0 space-y-6 pb-0 lg:pb-0">
              <LibraryPanel
                likedSongsCount={library.likedSongsCount}
                savedAlbumsCount={library.savedAlbumsCount}
                playlists={library.playlists}
                followedArtists={library.followedArtists}
                followedArtistsAvailable={library.followedArtistsAvailable}
                savedAlbums={library.savedAlbums}
                monitoredPlaylists={monitoredPlaylists}
                playlistBadgeCounts={playlistBadgeCounts}
                likedBadgeCount={likedBadgeCount}
              badgePollingEnabled
              activeCollection={{ type: collectionType, id: collectionId }}
              page={playlistPage}
              preferredPanel={view === "playlists" ? "playlists" : undefined}
              mobileSection={mobileSection}
              mobileRemovalsHref={buildHref({ mobileSection: "removals" })}
              mobileLibraryHref={buildHref({ mobileSection: "library" })}
            />
          </aside>
        ) : null}
      </div>
    </main>
  );
};

export default HomePage;
