"use client";

import { useRunScanForm } from "@/lib/scan/use-run-scan-form";
import { RunScanButton } from "@/components/run-scan-button";
import { ScanStatus } from "@/components/scan-status";
import { cn } from "@/lib/utils";

type Props = {
  mode: "liked" | "playlist";
  playlistId?: string;
  playlistName?: string;
  showStatus?: boolean;
  className?: string;
};

export const RunScanForm = ({
  mode,
  playlistId,
  playlistName,
  showStatus = true,
  className
}: Props) => {
  const { formAction } = useRunScanForm();

  return (
    <form
      action={formAction}
      className={cn(
        "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center",
        className
      )}
    >
      <input type="hidden" name="mode" value={mode} />
      {mode === "playlist" && playlistId ? (
        <input type="hidden" name="playlistId" value={playlistId} />
      ) : null}
      {mode === "playlist" && playlistName ? (
        <input type="hidden" name="playlistName" value={playlistName} />
      ) : null}

      <RunScanButton
        label={
          mode === "playlist"
            ? "Scan playlist"
            : "Scan liked songs"
        }
      />
      {showStatus ? <ScanStatus /> : null}
    </form>
  );
};
