"use client";

import { usePlaylistMonitoringSettings } from "@/lib/settings/use-playlist-monitoring-settings";
import type { PlaylistSummary } from "@/lib/spotify/client";
import { cn } from "@/lib/utils";

type Props = {
  playlists: PlaylistSummary[];
  monitored: Record<string, boolean>;
};

export const PlaylistMonitoringSettings = ({ playlists, monitored }: Props) => {
  const { pending, enabledCount, toggle } = usePlaylistMonitoringSettings(
    playlists,
    monitored
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {enabledCount}/5 enabled
      </p>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
        {playlists.map((playlist) => {
          const isEnabled = monitored[playlist.id] ?? false;
          return (
            <div
              key={playlist.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/30 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{playlist.name}</p>
              </div>
              <button
                type="button"
                disabled={pending || (!isEnabled && enabledCount >= 5)}
                onClick={() => toggle(playlist, !isEnabled)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs transition",
                  isEnabled
                    ? "border-emerald-400/70 text-emerald-300 hover:bg-emerald-400/10"
                    : "border-border/40 text-muted-foreground hover:text-foreground",
                  pending ? "opacity-60" : ""
                )}
              >
                {isEnabled ? "On" : "Off"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
