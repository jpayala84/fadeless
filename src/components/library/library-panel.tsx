"use client";

import { useRouter } from "next/navigation";

import { AlbumGrid } from "@/components/library/album-grid";
import { ArtistGrid } from "@/components/library/artist-grid";
import { LikedSongsCard } from "@/components/library/liked-songs-card";
import { MobileBottomNav } from "@/components/library/mobile-bottom-nav";
import { PlaylistList } from "@/components/library/playlist-list";
import type { AlbumSummary, ArtistSummary, PlaylistSummary } from "@/lib/spotify/client";
import { cn } from "@/lib/utils";
import { LIBRARY_PANEL_TABS } from "@/lib/dashboard/library-tabs";
import { useLibraryPanelState } from "@/lib/dashboard/use-library-panel";

type Props = {
  likedSongsCount: number;
  savedAlbumsCount: number;
  playlists: PlaylistSummary[];
  followedArtists: ArtistSummary[];
  followedArtistsAvailable?: boolean;
  savedAlbums: AlbumSummary[];
  monitoredPlaylists?: Record<string, boolean>;
  playlistBadgeCounts?: Record<string, number>;
  likedBadgeCount?: number;
  badgePollingEnabled?: boolean;
  activeCollection?: {
    type?: "playlist" | "liked" | "album";
    id?: string;
  };
  page?: number;
  preferredPanel?: "playlists" | "artists" | "albums";
  mobileSection?: "library" | "removals";
  mobileRemovalsHref?: string;
  mobileLibraryHref?: string;
};

export const LibraryPanel = ({
  likedSongsCount,
  savedAlbumsCount,
  playlists,
  followedArtists,
  followedArtistsAvailable = true,
  savedAlbums,
  monitoredPlaylists = {},
  playlistBadgeCounts = {},
  likedBadgeCount = 0,
  badgePollingEnabled = false,
  activeCollection,
  page = 0,
  preferredPanel,
  mobileSection = "library",
  mobileRemovalsHref = "/?mobileSection=removals",
  mobileLibraryHref = "/?mobileSection=library"
}: Props) => {
  const router = useRouter();
  const {
    badgeCountsState,
    likedBadgeCountState,
    currentPage,
    totalPages,
    activePanel,
    pendingMonitor,
    enabledMonitorCount,
    visiblePlaylists,
    monitorState,
    setActivePanel,
    changePage,
    viewCollection,
    handlePlaylistFocus,
    toggleMonitor,
    handleKeyActivate,
    isNavigating,
    clearLikedBadgeNow,
    clearPlaylistBadgeNow
  } = useLibraryPanelState({
    playlists,
    followedArtists,
    savedAlbums,
    monitoredPlaylists,
    playlistBadgeCounts,
    likedBadgeCount,
    badgePollingEnabled,
    page,
    preferredPanel
  });

  const handleSelectMobilePanel = (panel: "playlists" | "artists" | "albums") => {
    setActivePanel(panel);
    if (mobileSection !== "library") {
      router.push(mobileLibraryHref);
    }
  };

  return (
    <>
      <section
        className={cn(
          "surface-card neon-row-card mobile-library-shell no-neon-interaction space-y-5 rounded-3xl border border-emerald-200/20 bg-card/50 p-6",
          mobileSection === "removals" ? "hidden md:block" : ""
        )}
        aria-busy={isNavigating}
      >
        <LikedSongsCard
          likedSongsCount={likedSongsCount}
          likedBadgeCount={likedBadgeCountState}
          isActive={activeCollection?.type === "liked"}
          onViewLiked={() => viewCollection("liked")}
          onKeyActivate={handleKeyActivate}
          onClearBadge={clearLikedBadgeNow}
        />

        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {LIBRARY_PANEL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePanel(tab.id)}
              className={cn(
                "neon-chip rounded-full border px-4 py-1.5 text-sm transition",
                activePanel === tab.id
                  ? "border-emerald-400/50 bg-emerald-400/10 text-foreground"
                  : "border-emerald-200/20 text-muted-foreground hover:border-emerald-200/30 hover:text-foreground"
              )}
              data-active={activePanel === tab.id}
            >
              {tab.label}
            </button>
          ))}
          {isNavigating ? (
            <span className="text-xs text-muted-foreground">Loading…</span>
          ) : null}
        </div>

        {activePanel === "playlists" ? (
          <PlaylistList
            visiblePlaylists={visiblePlaylists}
            activeCollectionId={activeCollection?.type === "playlist" ? activeCollection.id : undefined}
            monitorState={monitorState}
            badgeCountsState={badgeCountsState}
            currentPage={currentPage}
            totalPages={totalPages}
            pendingMonitor={pendingMonitor}
            enabledMonitorCount={enabledMonitorCount}
            onChangePage={changePage}
            onFocusPlaylist={handlePlaylistFocus}
            onToggleMonitor={toggleMonitor}
            onClearPlaylistBadge={clearPlaylistBadgeNow}
          />
        ) : null}

        {activePanel === "albums" ? (
          <AlbumGrid
            savedAlbums={savedAlbums}
            savedAlbumsCount={savedAlbumsCount}
            activeCollectionId={activeCollection?.type === "album" ? activeCollection.id : undefined}
            onViewAlbum={(album) => viewCollection("album", { id: album.id, name: album.name })}
            onKeyActivate={handleKeyActivate}
          />
        ) : null}

        {activePanel === "artists" ? (
          <ArtistGrid
            followedArtists={followedArtists}
            followedArtistsAvailable={followedArtistsAvailable}
          />
        ) : null}
      </section>

      <MobileBottomNav
        mobileSection={mobileSection}
        mobileRemovalsHref={mobileRemovalsHref}
        activePanel={activePanel}
        onSelectPanel={handleSelectMobilePanel}
      />
    </>
  );
};
