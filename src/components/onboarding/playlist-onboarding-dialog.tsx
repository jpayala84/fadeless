"use client";

import type { PlaylistSummary } from "@/lib/spotify/client";
import { cn } from "@/lib/utils";
import { usePlaylistOnboarding } from "@/lib/onboarding/use-playlist-onboarding";

type Props = {
  playlists: PlaylistSummary[];
  open: boolean;
};

export const PlaylistOnboardingDialog = ({ playlists, open }: Props) => {
  const { pending, selected, limitedPlaylists, maxSelect, toggle, submit } =
    usePlaylistOnboarding({ playlists });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur">
      <div className="surface-card w-full max-w-2xl space-y-5 rounded-3xl border border-border/40 bg-card/60 p-8 shadow-2xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
            Welcome
          </p>
          <h2 className="text-2xl font-semibold">Pick playlists to monitor</h2>
          <p className="text-sm text-muted-foreground">
            Choose up to {maxSelect} playlists to track.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {limitedPlaylists.map((playlist) => {
            const isSelected = selected.includes(playlist.id);
            return (
              <button
                key={playlist.id}
                type="button"
                onClick={() => toggle(playlist.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left shadow-inner transition",
                  isSelected
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-border/40 bg-card/30 hover:border-emerald-300/40"
                )}
              >
                <p className="font-medium text-foreground">{playlist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {playlist.trackCount} tracks · {playlist.owner}
                </p>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {selected.length}/{maxSelect} selected
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            Start monitoring
          </button>
        </div>
      </div>
    </div>
  );
};
