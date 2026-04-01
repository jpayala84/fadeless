"use client";

import { useEffect, useRef } from "react";

import { useRunScanForm } from "@/lib/scan/use-run-scan-form";
import { RunScanButton } from "@/components/scan/run-scan-button";
import { ScanStatus } from "@/components/scan/scan-status";
import { cn } from "@/lib/utils";

type Props = {
  mode: "liked" | "playlist";
  playlistId?: string;
  playlistName?: string;
  showStatus?: boolean;
  className?: string;
  onSuccess?: () => void;
};

export const RunScanForm = ({
  mode,
  playlistId,
  playlistName,
  showStatus = true,
  className,
  onSuccess
}: Props) => {
  const { formAction, state } = useRunScanForm();
  const lastStatus = useRef(state.status);

  useEffect(() => {
    if (lastStatus.current !== "success" && state.status === "success") {
      onSuccess?.();
    }
    lastStatus.current = state.status;
  }, [onSuccess, state.status]);

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
