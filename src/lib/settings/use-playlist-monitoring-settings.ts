"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import { togglePlaylistMonitoring } from "@/app/actions/playlist-monitoring";
import type { PlaylistSummary } from "@/lib/spotify/client";

export const usePlaylistMonitoringSettings = (
  playlists: PlaylistSummary[],
  monitored: Record<string, boolean>
) => {
  const [pending, startTransition] = useTransition();

  const enabledCount = useMemo(
    () => Object.values(monitored).filter(Boolean).length,
    [monitored]
  );

  const toggle = (playlist: PlaylistSummary, nextEnabled: boolean) => {
    startTransition(async () => {
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
        result.enabled ? `Tracking ${playlist.name}` : `Stopped tracking ${playlist.name}`
      );
    });
  };

  return { pending, enabledCount, toggle, playlists, monitored };
};
