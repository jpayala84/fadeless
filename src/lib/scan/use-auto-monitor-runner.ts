"use client";

import { useEffect } from "react";

type PlaylistTarget = {
  id: string;
  name: string;
};

export const useAutoMonitorRunner = (options: {
  playlists: PlaylistTarget[];
  runLikedScan?: boolean;
}) => {
  const { playlists, runLikedScan = true } = options;

  useEffect(() => {
    let canceled = false;

    const run = async () => {
      if (runLikedScan) {
        try {
          await fetch("/api/jobs/scan", {
            method: "POST"
          });
        } catch {
          // ignore
        }
      }

      for (const playlist of playlists) {
        if (canceled) {
          return;
        }
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
    };

    run();
    return () => {
      canceled = true;
    };
  }, [playlists, runLikedScan]);
};
