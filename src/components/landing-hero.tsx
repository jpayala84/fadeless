import { SignInButton } from "@/components/auth-buttons";

export const LandingHero = () => (
  <section className="min-h-screen bg-background text-foreground">
    <div className="grid gap-10 px-6 py-16 md:px-12 lg:grid-cols-[1fr_420px] lg:px-24">
      <div className="flex flex-col justify-center space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-400">
          Spotify Gone Songs
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Track songs that disappear.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Connect your Spotify account and run scans on demand.
        </p>
      </div>

      <div className="surface-card rounded-3xl border border-border/40 bg-card/60 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
            Sign in
          </p>
          <h2 className="text-2xl font-semibold">Continue with Spotify</h2>
          <SignInButton />
        </div>
      </div>
    </div>
  </section>
);
