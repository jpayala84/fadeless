"use client";

import { useScanStatus } from "@/lib/scan/use-scan-status";

export const ScanStatus = () => {
  const { pending } = useScanStatus();

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
        pending
          ? "bg-primary/15 text-primary"
          : "bg-white/10 text-muted-foreground"
      } backdrop-blur transition-colors`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          pending ? "bg-primary animate-pulse" : "bg-border"
        }`}
      />
      {pending ? "Scanning in progress..." : "Ready to scan"}
    </div>
  );
};
