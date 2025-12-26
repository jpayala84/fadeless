"use client";

import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  likedSongs: SpotifyTrack[];
  playlistPreview?: PlaylistTrack[];
  activeCollection?: {
    type?: "playlist" | "liked" | "album";
    id?: string;
  };
  page?: number;
};

const PANEL_TABS = [
  { id: "playlists", label: "Playlists" },
  { id: "albums", label: "Saved albums" },
  { id: "artists", label: "Artists" }
] as const;

const PAGE_SIZE = 4;

type LikedSongState = SpotifyTrack & { liked: boolean };
type PlaylistTrackState = PlaylistTrack & { removed: boolean };

const clampPage = (value: number, totalPages: number) =>
  Math.min(Math.max(value, 0), Math.max(totalPages - 1, 0));

export const LibraryPanel = ({
  likedSongsCount,
  savedAlbumsCount,
  playlists,
  topArtists,
  savedAlbums,
  likedSongs,
  playlistPreview = [],
  activeCollection,
  page = 0
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(playlists.length / PAGE_SIZE)),
    [playlists.length]
  );

  const [currentPage, setCurrentPage] = useState(
    clampPage(page, totalPages)
  );
  const [activePanel, setActivePanel] = useState<(typeof PANEL_TABS)[number]["id"]>("playlists");
  const [likedShelf, setLikedShelf] = useState<LikedSongState[]>(
    () => likedSongs.map((song) => ({ ...song, liked: true }))
  );
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrackState[]>(
    () => playlistPreview.map((track) => ({ ...track, removed: false }))
  );

  useEffect(() => {
    setCurrentPage(clampPage(page, totalPages));
  }, [page, totalPages]);

  useEffect(() => {
    setPlaylistTracks(
      playlistPreview.map((track) => ({ ...track, removed: false }))
    );
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
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const visiblePlaylists = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return playlists.slice(start, start + PAGE_SIZE);
  }, [currentPage, playlists]);

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

  const toggleLikedSong = (songId: string) => {
    const song = likedShelf.find((item) => item.id === songId);
    setLikedShelf((songs) =>
      songs.map((item) =>
        item.id === songId ? { ...item, liked: !item.liked } : item
      )
    );
    if (song) {
      toast.info(
        song.liked
          ? `${song.name} queued for removal. Changes sync once Spotify write scopes are approved.`
          : `${song.name} moved back into liked songs.`
      );
    }
  };

  const togglePlaylistTrack = (trackId: string) => {
    const track = playlistTracks.find((item) => item.id === trackId);
    setPlaylistTracks((tracks) =>
      tracks.map((item) =>
        item.id === trackId ? { ...item, removed: !item.removed } : item
      )
    );
    if (track) {
      toast.info(
        track.removed
          ? `${track.name} restored to ${track.playlistName ?? "playlist"}.`
          : `${track.name} marked for removal from playlist.`
      );
    }
  };

  return (
    <section className="space-y-5 rounded-3xl border border-white/5 bg-gradient-to-b from-[#151515] to-[#0c0c0c] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.55)] backdrop-blur">
      <button
        type="button"
        onClick={() => viewCollection("liked")}
        className={cn(
          "w-full rounded-3xl border border-white/10 bg-black/30 p-5 text-left shadow-inner shadow-black/30 transition",
          activeCollection?.type === "liked"
            ? "border-emerald-400/60 bg-emerald-400/10"
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
            <p className="text-sm text-muted-foreground">
              Tap to browse or stage changes to your liked catalog.
            </p>
          </div>
          <div onClick={(event) => event.stopPropagation()}>
            <RunScanForm mode="liked" showStatus={false} />
            <Link
              href={buildCollectionHref("liked")}
              scroll={false}
              className="mt-2 block rounded-full border border-white/20 px-3 py-1 text-center text-xs text-muted-foreground transition hover:border-emerald-400 hover:text-foreground"
            >
              Open
            </Link>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Snapshot scans always include your liked songs. We’ll sync edits once Spotify grants write scopes.
        </p>
      </button>

      <div className="flex flex-wrap gap-2">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePanel(tab.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition",
              activePanel === tab.id
                ? "border-emerald-400/80 bg-emerald-400/10 text-foreground"
                : "border-white/10 text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activePanel === "playlists" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Playlists sorted by last listened</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 0}
                className="rounded-full border border-white/15 px-2 py-1 disabled:opacity-30"
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
                className="rounded-full border border-white/15 px-2 py-1 disabled:opacity-30"
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
              return (
                <li
                  key={playlist.id}
                  className={cn(
                    "cursor-pointer rounded-2xl border px-4 py-3 text-sm shadow-inner shadow-black/30 transition",
                    isActive
                      ? "border-emerald-400/70 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:border-emerald-300/50"
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
                        <p className="font-medium text-foreground">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {playlist.trackCount} tracks · {playlist.owner}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <RunScanForm
                          playlistId={playlist.id}
                          playlistName={playlist.name}
                          mode="playlist"
                          showStatus={false}
                        />
                        <Link
                          href={buildCollectionHref("playlist", {
                            id: playlist.id,
                            name: playlist.name
                          })}
                          scroll={false}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-muted-foreground transition hover:border-emerald-400 hover:text-foreground"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {activeCollection?.type === "playlist" && playlistTracks.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner shadow-black/30">
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
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-2 text-xs"
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
                    <button
                      type="button"
                      onClick={() => togglePlaylistTrack(track.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[0.65rem]",
                        track.removed
                          ? "border-emerald-400/80 text-emerald-300"
                          : "border-red-400/80 text-red-300"
                      )}
                    >
                      {track.removed ? "Undo" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
              <p className="pt-2 text-[0.65rem] text-muted-foreground">
                Changes reflect locally until Spotify grants modify scopes.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {activePanel === "albums" ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {savedAlbumsCount.toLocaleString()} saved albums
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
                    "flex items-center gap-3 rounded-2xl border p-3 text-sm shadow-inner shadow-black/30 transition",
                    isActive
                      ? "border-emerald-400/70 bg-emerald-400/10"
                      : "border-white/10 bg-black/25 hover:border-emerald-400/60"
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
                    <span className="text-[0.65rem] text-emerald-400">
                      View tracks
                    </span>
                  </div>
                </button>
              );
            })}
            {savedAlbums.length === 0 ? (
              <p className="col-span-2 text-xs text-muted-foreground">
                Saved albums will populate after your next sync.
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
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm shadow-inner shadow-black/25 transition hover:border-emerald-300"
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
