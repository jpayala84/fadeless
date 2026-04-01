import Image from "next/image";

import { RunScanForm } from "@/components/scan/run-scan-form";
import type { PlaylistSummary } from "@/lib/spotify/client";
import { cn } from "@/lib/utils";

type PlaylistListProps = {
  visiblePlaylists: PlaylistSummary[];
  activeCollectionId?: string;
  monitorState: Record<string, boolean>;
  badgeCountsState: Record<string, number>;
  currentPage: number;
  totalPages: number;
  pendingMonitor: boolean;
  enabledMonitorCount: number;
  onChangePage: (nextPage: number) => void;
  onFocusPlaylist: (playlistId: string, playlistName: string) => void;
  onToggleMonitor: (playlist: PlaylistSummary, nextEnabled: boolean) => void;
  onClearPlaylistBadge: (playlistId: string) => void;
};

export const PlaylistList = ({
  visiblePlaylists,
  activeCollectionId,
  monitorState,
  badgeCountsState,
  currentPage,
  totalPages,
  pendingMonitor,
  enabledMonitorCount,
  onChangePage,
  onFocusPlaylist,
  onToggleMonitor,
  onClearPlaylistBadge
}: PlaylistListProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => onChangePage(currentPage - 1)}
        disabled={currentPage === 0}
        className="library-pager-btn neon-chip neon-soft-hover rounded-full border border-emerald-200/20 px-2 py-1 disabled:opacity-70"
        aria-label="Previous playlists"
      >
        {"<"}
      </button>
      <span>
        {currentPage + 1}/{totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChangePage(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="library-pager-btn neon-chip neon-soft-hover rounded-full border border-emerald-200/20 px-2 py-1 disabled:opacity-70"
        aria-label="Next playlists"
      >
        {">"}
      </button>
    </div>
    <ul className="space-y-3">
      {visiblePlaylists.map((playlist) => {
        const isActive = activeCollectionId === playlist.id;
        const isTracked = monitorState[playlist.id] ?? false;
        const badgeCount = badgeCountsState[playlist.id] ?? 0;

        return (
          <li
            key={playlist.id}
            className={cn(
              "neon-row-card mobile-playlist-card relative min-h-[92px] cursor-pointer rounded-2xl border px-4 py-3 text-sm shadow-inner shadow-black/30 transition",
              isActive
                ? "border-emerald-400/50 bg-emerald-400/10"
                : "border-emerald-200/20 bg-card/30 hover:border-emerald-200/30"
            )}
            onClick={() => onFocusPlaylist(playlist.id, playlist.name)}
          >
            {badgeCount > 0 ? (
              <span
                className="absolute -left-2 -top-2 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-900"
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
                    onClick={() => onToggleMonitor(playlist, !isTracked)}
                    disabled={pendingMonitor || (!isTracked && enabledMonitorCount >= 5)}
                    className={cn(
                      "neon-chip neon-soft-hover rounded-full border px-3 py-1 text-[0.65rem] transition",
                      isTracked
                        ? "border-emerald-400/50 text-emerald-300 hover:border-emerald-300/70"
                        : "border-emerald-200/20 text-muted-foreground hover:border-emerald-200/30 hover:text-foreground",
                      pendingMonitor || (!isTracked && enabledMonitorCount >= 5)
                        ? "cursor-not-allowed opacity-40"
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
                      onSuccess={() => onClearPlaylistBadge(playlist.id)}
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
);
