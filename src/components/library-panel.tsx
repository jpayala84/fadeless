"use client";

import Image from "next/image";
import {
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { togglePlaylistMonitoring } from "@/app/actions/playlist-monitoring";
import { RunScanForm } from "@/components/run-scan-form";
import type {
  AlbumSummary,
  ArtistSummary,
  PlaylistTrack,
  PlaylistSummary,
  SpotifyTrack
} from "@/lib/spotify/client";
import { cn } from "@/lib/utils";

type Props = {
  likedSongsCount: number;
  savedAlbumsCount: number;
  playlists: PlaylistSummary[];
  topArtists: ArtistSummary[];
  savedAlbums: AlbumSummary[];
  playlistPreview?: PlaylistTrack[];
  monitoredPlaylists?: Record<string, boolean>;
  activeCollection?: {
    type?: "playlist" | "liked" | "album";
    id?: string;
  };
  page?: number;
};

const PANEL_TABS = [
  { id: "playlists", label: "Playlists" },
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" }
] as const;

const PAGE_SIZE = 5;

const clampPage = (value: number, totalPages: number) =>
  Math.min(Math.max(value, 0), Math.max(totalPages - 1, 0));

export const LibraryPanel = ({
  likedSongsCount,
  savedAlbumsCount,
  playlists,
  topArtists,
  savedAlbums,
  playlistPreview = [],
  monitoredPlaylists = {},
  activeCollection,
  page = 0
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortedPlaylists = useMemo(() => {
    const tracked = playlists.filter((playlist) => monitoredPlaylists[playlist.id]);
    const untracked = playlists.filter((playlist) => !monitoredPlaylists[playlist.id]);
    return [...tracked, ...untracked];
  }, [playlists, monitoredPlaylists]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedPlaylists.length / PAGE_SIZE)),
    [sortedPlaylists.length]
  );

  const [currentPage, setCurrentPage] = useState(clampPage(page, totalPages));
  const [activePanel, setActivePanel] = useState<(typeof PANEL_TABS)[number]["id"]>("playlists");
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>(
    () => playlistPreview.slice()
  );
  const [pendingMonitor, startMonitorTransition] = useTransition();
  const [pendingScanAll, startScanAllTransition] = useTransition();

  useEffect(() => {
    setCurrentPage(clampPage(page, totalPages));
  }, [page, totalPages]);

  useEffect(() => {
    setPlaylistTracks(playlistPreview.slice());
  }, [playlistPreview]);

  const updateRoute = (
    overrides: Record<string, string | number | undefined>,
    { replace = true }: { replace?: boolean } = {}
  ) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    const nav = replace ? router.replace : router.push;
    nav(next, { scroll: false });
  };

  const changePage = (nextPage: number) => {
    const clamped = clampPage(nextPage, totalPages);
    setCurrentPage(clamped);
    updateRoute({ playlistPage: clamped }, { replace: true });
  };

  const buildCollectionHref = (
    type: "playlist" | "liked" | "album",
    options?: { id?: string; name?: string }
  ) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("collection", type);
    if (options?.id) {
      params.set("collectionId", options.id);
    } else {
      params.delete("collectionId");
    }
    if (options?.name) {
      params.set("collectionName", options.name);
    } else {
      params.delete("collectionName");
    }
    params.delete("playlist");
    params.delete("playlistPage");
    params.delete("collectionPage");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const visiblePlaylists = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return sortedPlaylists.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedPlaylists]);

  const viewCollection = (
    type: "playlist" | "liked" | "album",
    options?: { id?: string; name?: string }
  ) => {
    const href = buildCollectionHref(type, options);
    router.push(href, { scroll: false });
  };

  const handlePlaylistFocus = (playlistId: string, playlistName: string) => {
    setCurrentPage(0);
    setActivePanel("playlists");
    viewCollection("playlist", { id: playlistId, name: playlistName });
  };

  const enabledMonitorCount = useMemo(
    () => Object.values(monitoredPlaylists).filter(Boolean).length,
    [monitoredPlaylists]
  );
  const trackedPlaylists = useMemo(
    () => sortedPlaylists.filter((playlist) => monitoredPlaylists[playlist.id]),
    [sortedPlaylists, monitoredPlaylists]
  );

  const toggleMonitor = (playlist: PlaylistSummary, nextEnabled: boolean) => {
    startMonitorTransition(async () => {
      try {
        const result = await togglePlaylistMonitoring({
          playlistId: playlist.id,
          playlistName: playlist.name,
          enabled: nextEnabled
        });
        if (result.status === "error") {
          toast.error(result.message);
          return;
        }
        toast.success(
          result.enabled
            ? `Tracking ${playlist.name}`
            : `Stopped tracking ${playlist.name}`
        );
      } catch {
        toast.error("Could not update playlist monitoring.");
      }
    });
  };

  const scanAllTracked = () => {
    if (!trackedPlaylists.length) {
      toast.info("Select playlists to track first.");
      return;
    }
    startScanAllTransition(async () => {
      for (const playlist of trackedPlaylists) {
        try {
          await fetch("/api/jobs/scan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              mode: "playlist",
              playlistId: playlist.id,
              playlistName: playlist.name
            })
          });
        } catch {
          // ignore
        }
      }
      toast.success("Scan started for tracked playlists.");
    });
  };

  const handleKeyActivate = (
    event: KeyboardEvent<HTMLElement>,
    callback: () => void
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  };

  return (
    <section className="surface-card space-y-5 rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur">
      <div
        role="button"
        tabIndex={0}
        onClick={() => viewCollection("liked")}
        onKeyDown={(event) => handleKeyActivate(event, () => viewCollection("liked"))}
        className={cn(
          "w-full rounded-3xl border border-border/40 bg-card/40 p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
          activeCollection?.type === "liked"
            ? "border-emerald-400/50 bg-emerald-400/10"
            : ""
        )}
      >
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

      <div className="flex flex-wrap gap-2">
        {PANEL_TABS.map((tab) => (
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
      </div>

      {activePanel === "playlists" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={scanAllTracked}
              disabled={!trackedPlaylists.length || pendingScanAll}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                trackedPlaylists.length
                  ? "border-border/40 text-muted-foreground hover:text-foreground"
                  : "border-border/20 opacity-40 cursor-not-allowed",
                pendingScanAll ? "opacity-60 cursor-not-allowed" : ""
              )}
              aria-label="Scan all tracked playlists"
            >
              Scan tracked
            </button>
            <div className="flex items-center gap-2">
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
          </div>
          <ul className="space-y-3">
            {visiblePlaylists.map((playlist) => {
              const isActive =
                activeCollection?.type === "playlist" &&
                activeCollection.id === playlist.id;
              const isTracked = monitoredPlaylists[playlist.id] ?? false;
              return (
                <li
                  key={playlist.id}
                  className={cn(
                    "cursor-pointer rounded-2xl border px-4 py-3 text-sm shadow-inner shadow-black/30 transition",
                    isActive
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-border/40 bg-card/30 hover:border-emerald-300/40"
                  )}
                  onClick={() => handlePlaylistFocus(playlist.id, playlist.name)}
                >
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
                        <p className="text-[0.65rem] text-muted-foreground">
                          {isTracked ? "Tracking enabled" : "Playlist not tracked"}
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
          {activeCollection?.type === "playlist" && playlistTracks.length > 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Playlist overview
                </p>
                <span className="text-xs text-muted-foreground">
                  {playlistTracks.length} tracks previewed
                </span>
              </div>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-2">
                {playlistTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/30 p-2 text-xs"
                  >
                    {track.imageUrl ? (
                      <Image
                        src={track.imageUrl}
                        alt={track.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-b from-emerald-400/20 to-transparent" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {track.name}
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {track.artists.join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() =>
                    viewCollection("album", { id: album.id, name: album.name })
                  }
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-sm shadow-inner transition",
                    isActive
                      ? "border-emerald-400/70 bg-emerald-400/10"
                      : "border-border/40 bg-card/30 hover:border-emerald-300/40"
                  )}
                >
                  {album.imageUrl ? (
                    <Image
                      src={album.imageUrl}
                      alt={album.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-emerald-400/20 to-transparent" />
                  )}
                  <div>
                    <p className="font-medium">{album.name}</p>
                    <p className="text-xs text-muted-foreground">{album.artist}</p>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      View tracks
                    </p>
                  </div>
                </button>
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
          {topArtists.map((artist) => (
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
          {topArtists.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              We’ll populate this list after your first scan.
            </p>
          ) : null}
        </div>
      ) : null}

    </section>
  );
};
