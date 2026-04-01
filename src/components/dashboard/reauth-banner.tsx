import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const ReauthBanner = () => (
  <div className="surface-card flex flex-col gap-4 rounded-3xl border border-amber-400/40 bg-amber-500/10 p-6 text-sm shadow-inner">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 rounded-full bg-amber-400/20 p-2 text-amber-200">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            Action needed
          </p>
          <h2 className="mt-1 text-xl font-semibold text-amber-100">
            Reconnect your Spotify account
          </h2>
          <p className="text-amber-100/80">
            Spotify asked us to refresh your permissions. Reconnect to resume automatic scans
            and keep your history intact.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/api/auth/login"
        className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
      >
        Reconnect Spotify
      </Link>
      <span className="rounded-full border border-amber-300/50 px-3 py-1 text-xs text-amber-100/80">
        Data paused
      </span>
      </div>
    </div>
    <div className="grid gap-2 text-xs text-amber-100/80 sm:grid-cols-2">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-500/5 px-3 py-2">
        Scans are paused until you reconnect.
      </div>
      <div className="rounded-2xl border border-amber-300/20 bg-amber-500/5 px-3 py-2">
        Your past removal history stays safe.
      </div>
    </div>
  </div>
);
