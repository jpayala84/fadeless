"use client";

import { useAutoMonitorRunner } from "@/lib/scan/use-auto-monitor-runner";

type Props = {
  playlists: Array<{ id: string; name: string }>;
  runLikedScan?: boolean;
};

export const AutoMonitorRunner = ({ playlists, runLikedScan = true }: Props) => {
  useAutoMonitorRunner({ playlists, runLikedScan });

  return null;
};
