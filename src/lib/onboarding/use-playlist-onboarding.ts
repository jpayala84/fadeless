"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { initializeMonitoring } from "@/app/actions/playlist-monitoring";
import type { PlaylistSummary } from "@/lib/spotify/client";

type Options = {
  playlists: PlaylistSummary[];
  maxSelect?: number;
  maxPreview?: number;
};

export const usePlaylistOnboarding = ({
  playlists,
  maxSelect = 5,
  maxPreview = 12
}: Options) => {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const limitedPlaylists = useMemo(
    () => playlists.slice(0, maxPreview),
    [playlists, maxPreview]
  );

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((value) => value !== id);
      }
      if (current.length >= maxSelect) {
        toast.error(`Pick up to ${maxSelect} playlists.`);
        return current;
      }
      return [...current, id];
    });
  };

  const submit = () => {
    if (!selected.length) {
      toast.error("Select at least one playlist.");
      return;
    }
    startTransition(async () => {
      const payload = limitedPlaylists.filter((playlist) =>
        selected.includes(playlist.id)
      );
      await initializeMonitoring(
        payload.map((playlist) => ({
          playlistId: playlist.id,
          playlistName: playlist.name
        }))
      );
    });
  };

  return {
    pending,
    selected,
    limitedPlaylists,
    maxSelect,
    toggle,
    submit
  };
};
