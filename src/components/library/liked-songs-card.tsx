import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { RunScanForm } from "@/components/scan/run-scan-form";
import { cn } from "@/lib/utils";

type LikedSongsCardProps = {
  likedSongsCount: number;
  likedBadgeCount: number;
  isActive: boolean;
  onViewLiked: () => void;
  onKeyActivate: (event: ReactKeyboardEvent, action: () => void) => void;
  onClearBadge: () => void;
};

export const LikedSongsCard = ({
  likedSongsCount,
  likedBadgeCount,
  isActive,
  onViewLiked,
  onKeyActivate,
  onClearBadge
}: LikedSongsCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onViewLiked}
    onKeyDown={(event) => onKeyActivate(event, onViewLiked)}
    className={cn(
      "mobile-liked-card neon-row-card relative min-h-[92px] w-full rounded-3xl border border-emerald-200/20 bg-card/40 p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40",
      isActive ? "bg-card/55" : ""
    )}
  >
    {likedBadgeCount > 0 ? (
      <span
        className="absolute -left-2 -top-2 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-900"
        style={{ backgroundColor: "#CFDB00" }}
      >
        {likedBadgeCount > 99 ? "99+" : likedBadgeCount}
      </span>
    ) : null}
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-green-500">
          Liked Songs
        </p>
        <p className="text-3xl font-semibold">{likedSongsCount.toLocaleString()}</p>
      </div>
      <div onClick={(event) => event.stopPropagation()}>
        <RunScanForm mode="liked" showStatus={false} onSuccess={onClearBadge} />
      </div>
    </div>
  </div>
);
