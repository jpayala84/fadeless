"use client";

import Image from "next/image";

import { RunScanForm } from "@/components/run-scan-form";
import type { AlbumSummary, ArtistSummary, PlaylistSummary } from "@/lib/spotify/client";
import { cn } from "@/lib/utils";
import { LIBRARY_PANEL_TABS } from "@/lib/dashboard/library-tabs";
import { useLibraryPanelState } from "@/lib/dashboard/use-library-panel";

type Props = {
  likedSongsCount: number;
  savedAlbumsCount: number;
  playlists: PlaylistSummary[];
  followedArtists: ArtistSummary[];
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
};

export const LibraryPanel = ({
  likedSongsCount,
  savedAlbumsCount,
  playlists,
  followedArtists,
  savedAlbums,
  monitoredPlaylists = {},
  playlistBadgeCounts = {},
  likedBadgeCount = 0,
  badgePollingEnabled = false,
  activeCollection,
  page = 0,
  preferredPanel
}: Props) => {
  const {
    badgeCountsState,
    likedBadgeCountState,
    currentPage,
    totalPages,
    activePanel,
    pendingMonitor,
    enabledMonitorCount,
    visiblePlaylists,
    setActivePanel,
    changePage,
    viewCollection,
    handlePlaylistFocus,
    toggleMonitor,
    handleKeyActivate,
    isNavigating
  } = useLibraryPanelState({
    likedSongsCount,
    savedAlbumsCount,
    playlists,
    followedArtists,
    savedAlbums,
    monitoredPlaylists,
    playlistBadgeCounts,
    likedBadgeCount,
    badgePollingEnabled,
    activeCollection,
    page,
    preferredPanel
  });

  return (
    <section
      className="surface-card space-y-5 rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur"
      aria-busy={isNavigating}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => viewCollection("liked")}
        onKeyDown={(event) => handleKeyActivate(event, () => viewCollection("liked"))}
        className={cn(
          "relative w-full min-h-[92px] rounded-3xl border border-border/40 bg-card/40 p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
          activeCollection?.type === "liked"
            ? "border-emerald-400/50 bg-emerald-400/10"
            : ""
        )}
      >
        {likedBadgeCountState > 0 ? (
          <span
            className="absolute -top-2 -left-2 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-900"
            style={{ backgroundColor: "#CFDB00" }}
          >
            {likedBadgeCountState > 99 ? "99+" : likedBadgeCountState}
          </span>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
              Liked Songs
            </p>
            <p className="text-3xl font-semibold">
              {likedSongsCount.toLocaleString()}
            </p>
          </div>
          <div onClick={(event) => event.stopPropagation()}>
            <RunScanForm mode="liked" showStatus={false} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LIBRARY_PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePanel(tab.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition",
              activePanel === tab.id
                ? "border-emerald-400/50 bg-emerald-400/10 text-foreground"
                : "border-border/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
        {isNavigating ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : null}
      </div>

      {activePanel === "playlists" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 0}
              className="rounded-full border border-border/30 px-2 py-1 disabled:opacity-30"
              aria-label="Previous playlists"
            >
              ‹
            </button>
            <span>
              {currentPage + 1}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="rounded-full border border-border/30 px-2 py-1 disabled:opacity-30"
              aria-label="Next playlists"
            >
              ›
            </button>
          </div>
          <ul className="space-y-3">
            {visiblePlaylists.map((playlist) => {
              const isActive =
                activeCollection?.type === "playlist" &&
                activeCollection.id === playlist.id;
              const isTracked = monitoredPlaylists[playlist.id] ?? false;
              const badgeCount = badgeCountsState[playlist.id] ?? 0;
              return (
                <li
                  key={playlist.id}
                  className={cn(
                    "relative min-h-[92px] cursor-pointer rounded-2xl border px-4 py-3 text-sm shadow-inner shadow-black/30 transition",
                    isActive
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-border/40 bg-card/30 hover:border-emerald-300/40"
                  )}
                  onClick={() => handlePlaylistFocus(playlist.id, playlist.name)}
                >
                  {badgeCount > 0 ? (
                    <span
                      className="absolute -top-2 -left-2 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-900"
                      style={{ backgroundColor: "#CFDB00" }}
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  ) : null}
                  <div className="flex items-center gap-3">
                    {playlist.imageUrl ? (
                      <Image
                        src={playlist.imageUrl}
                        alt={playlist.name}
                        width={52}
                        height={52}
                        className="h-[52px] w-[52px] rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-[52px] w-[52px] rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-200/10" />
                    )}
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <div>
                        <a
                          href={`https://open.spotify.com/playlist/${playlist.id}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {playlist.name}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {playlist.trackCount} tracks · {playlist.owner}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMonitor(playlist, !isTracked)}
                          disabled={pendingMonitor || (!isTracked && enabledMonitorCount >= 5)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[0.65rem] transition",
                            isTracked
                              ? "border-emerald-400/50 text-emerald-300 hover:bg-emerald-400/10"
                              : "border-border/40 text-muted-foreground hover:text-foreground",
                            pendingMonitor || (!isTracked && enabledMonitorCount >= 5)
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          )}
                        >
                          {isTracked ? "On" : "Off"}
                        </button>
                        {isTracked ? (
                          <RunScanForm
                            playlistId={playlist.id}
                            playlistName={playlist.name}
                            mode="playlist"
                            showStatus={false}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {activePanel === "albums" ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {savedAlbumsCount.toLocaleString()} albums
          </p>
          <div className="grid grid-cols-2 gap-3">
            {savedAlbums.map((album) => {
              const isActive =
                activeCollection?.type === "album" &&
                activeCollection.id === album.id;
              const albumHref = `https://open.spotify.com/album/${album.id}`;
              const artistHref = album.artistId
                ? `https://open.spotify.com/artist/${album.artistId}`
                : `https://open.spotify.com/search/${encodeURIComponent(
                    album.artist
                  )}`;
              return (
                <div
                  key={album.id}
                  onClick={() =>
                    viewCollection("album", { id: album.id, name: album.name })
                  }
                  onKeyDown={(event) =>
                    handleKeyActivate(event, () =>
                      viewCollection("album", { id: album.id, name: album.name })
                    )
                  }
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "min-h-[92px] flex items-center gap-3 rounded-2xl border p-3 text-sm shadow-inner transition",
                    isActive
                      ? "border-emerald-400/70 bg-emerald-400/10"
                      : "border-border/40 bg-card/30 hover:border-emerald-300/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {album.imageUrl ? (
                      <a
                        href={albumHref}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Image
                          src={album.imageUrl}
                          alt={album.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      </a>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-emerald-400/20 to-transparent" />
                    )}
                    <div>
                      <a
                        href={albumHref}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {album.name}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        <a
                          href={artistHref}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="underline-offset-4 hover:underline"
                        >
                          {album.artist}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {savedAlbums.length === 0 ? (
              <p className="col-span-2 text-xs text-muted-foreground">
                Albums populate after your next sync.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {activePanel === "artists" ? (
        <div className="grid gap-3">
          {followedArtists.map((artist) => (
            <a
              key={artist.id}
              href={`https://open.spotify.com/artist/${artist.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/30 p-3 text-sm transition hover:border-emerald-300/40"
            >
              {artist.imageUrl ? (
                <Image
                  src={artist.imageUrl}
                  alt={artist.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400/30 to-transparent" />
              )}
              <div className="flex flex-1 flex-col">
                <p className="font-medium">{artist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {artist.genres.slice(0, 2).join(" · ") || "Artist"}
                </p>
              </div>
              <span className="text-[0.65rem] text-muted-foreground">
                {Intl.NumberFormat("en", { notation: "compact" }).format(
                  artist.followers
                )}{" "}
                followers
              </span>
            </a>
          ))}
          {followedArtists.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              You are not following any artists on Spotify yet.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
