"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";

import {
  runScanAction,
  type RunScanState
} from "@/app/actions/run-scan";
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

const INITIAL_STATE: RunScanState = { status: "idle" };

export const RunScanForm = ({
  mode,
  playlistId,
  playlistName,
  showStatus = true,
  className
}: Props) => {
  const [state, formAction] = useFormState(runScanAction, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(`Scan started for ${state.scope}`);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className={cn(
        "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center",
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
