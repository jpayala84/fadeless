import Link from "next/link";

export const ReauthBanner = () => (
  <div className="surface-card flex flex-col gap-4 rounded-3xl border border-amber-400/40 bg-amber-500/10 p-6 text-sm shadow-inner">
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Action needed</p>
      <h2 className="mt-1 text-xl font-semibold text-amber-100">Reconnect your Spotify account</h2>
      <p className="text-amber-100/80">
        Spotify asked us to refresh your permissions. Reconnect to resume automatic scans and
        daily tracking.
      </p>
    </div>
    <div className="flex flex-wrap gap-3">
      <Link
        href="/api/auth/login"
        className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
      >
        Reconnect Spotify
      </Link>
      <p className="text-xs text-amber-200/80">
        We&apos;ll keep your data paused until you reconnect.
      </p>
    </div>
  </div>
);
