"use client";

import { useScanStatus } from "@/lib/scan/use-scan-status";
import { Button } from "@/ui/button";

type Props = {
  label?: string;
};

export const RunScanButton = ({ label = "Scan now" }: Props) => {
  const status = useScanStatus();

  return (
    <Button
      type="submit"
      disabled={status.pending}
      className="relative"
    >
      {status.pending ? (
        <>
          <span className="absolute -left-6 flex h-3 w-3">
            <span className="absolute h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          Scanning...
        </>
      ) : (
        label
      )}
    </Button>
  );
};
