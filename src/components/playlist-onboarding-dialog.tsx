"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { initializeMonitoring } from "@/app/actions/playlist-monitoring";
import type { PlaylistSummary } from "@/lib/spotify/client";
import { cn } from "@/lib/utils";

type Props = {
  playlists: PlaylistSummary[];
  open: boolean;
};

export const PlaylistOnboardingDialog = ({ playlists, open }: Props) => {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const limitedPlaylists = useMemo(() => playlists.slice(0, 12), [playlists]);

  if (!open) {
    return null;
  }

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((value) => value !== id);
      }
      if (current.length >= 5) {
        toast.error("Pick up to 5 playlists.");
        return current;
      }
      return [...current, id];
    });
  };

  const handleSubmit = () => {
    if (!selected.length) {
      toast.error("Select at least one playlist.");
      return;
    }
    startTransition(async () => {
      const payload = limitedPlaylists.filter((playlist) =>
        selected.includes(playlist.id)
      );
      await initializeMonitoring(payload.map((playlist) => ({
        playlistId: playlist.id,
        playlistName: playlist.name
      })));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl space-y-5 rounded-3xl border border-white/10 bg-black/90 p-8 shadow-2xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
            Welcome
          </p>
          <h2 className="text-2xl font-semibold">Pick playlists to monitor</h2>
          <p className="text-sm text-muted-foreground">
            Choose up to 5 playlists. We’ll keep them scanned automatically so you don’t miss removals.
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
                  "rounded-2xl border p-4 text-left shadow-inner shadow-black/30 transition",
                  isSelected
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/10 bg-black/20 hover:border-emerald-400/60"
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
          <span>{selected.length}/5 selected</span>
          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
          >
            Start monitoring
          </button>
        </div>
      </div>
    </div>
  );
};

