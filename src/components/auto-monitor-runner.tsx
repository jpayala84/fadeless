"use client";

import { useEffect } from "react";

type Props = {
  playlists: Array<{ id: string; name: string }>;
  runLikedScan?: boolean;
};

export const AutoMonitorRunner = ({ playlists, runLikedScan = true }: Props) => {
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

  return null;
};
