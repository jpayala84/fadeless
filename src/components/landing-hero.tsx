import { SignInButton } from "@/components/auth-buttons";

export const LandingHero = () => (
  <section className="min-h-screen bg-gradient-to-br from-black via-[#050505] to-[#0a1a12] text-foreground">
    <div className="grid gap-10 px-6 py-16 md:px-12 lg:grid-cols-[1fr_420px] lg:px-24">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">
            Spotify Gone Songs
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Keep a crystal-clear record of every song Spotify removes.
          </h1>
          <p className="text-lg text-muted-foreground">
            Daily snapshots compare your Liked Songs and playlists with the previous capture,
            highlight what disappeared, and preserve the history for weekly review.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "OAuth 2.0 PKCE, encrypted tokens",
            "Deterministic diff engine",
            "Weekly summaries + alerts",
            "Append-only history"
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.65)] backdrop-blur">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
            Start now
          </p>
          <h2 className="text-2xl font-semibold">Sign in with Spotify</h2>
          <p className="text-sm text-muted-foreground">
            Secure PKCE flow, read-only scopes. We never store your password—Spotify issues tokens directly.
          </p>
          <SignInButton />
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>What you get:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Daily scans for playlists + liked catalog</li>
              <li>Removed songs timeline + context</li>
              <li>Settings mirrored from the production dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);
