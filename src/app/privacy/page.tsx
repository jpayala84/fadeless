import Link from "next/link";
import { PageNav } from "@/components/page-nav";

const PrivacyPage = () => (
  <main className="min-h-screen bg-background text-foreground flex flex-col">
    <section className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-16">
      <header className="space-y-3">
        <PageNav />
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
          Fadeless
        </p>
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated January 28, 2026
        </p>
      </header>

      <section className="space-y-4 text-sm text-muted-foreground">
        <p>
          We want you to understand what data we use and why. This policy
          explains how Fadeless (the “Service”) collects, uses, and stores
          information when you connect your Spotify account.
        </p>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Data we collect
          </h2>
          <ul className="list-inside list-disc space-y-2">
            <li>Your Spotify profile basics (ID, display name, email).</li>
            <li>Playlist and liked song metadata needed for scans.</li>
            <li>Snapshots of tracks so we can detect removals over time.</li>
            <li>Your notification preferences (email).</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            How we use your data
          </h2>
          <ul className="list-inside list-disc space-y-2">
            <li>Compare snapshots to detect removed tracks.</li>
            <li>Show removals in the dashboard and optional summaries.</li>
            <li>Operate background scans and keep the service reliable.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Data storage
          </h2>
          <p>
            We store snapshots and removal events so your history stays
            available. We do not sell personal data and we do not use it for
            advertising.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Your choices
          </h2>
          <ul className="list-inside list-disc space-y-2">
            <li>You can disconnect at any time.</li>
            <li>You can delete your data from Settings.</li>
            <li>You can turn email notifications on or off in Settings.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Third‑party services
          </h2>
          <p>
            We rely on Spotify’s APIs to access your library data. We follow
            Spotify’s platform requirements and only use read‑only scopes.
          </p>
        </div>
      </section>
    </section>
    <footer className="mx-auto w-full max-w-3xl px-6 pb-6 md:pb-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Link href="/privacy" className="underline-offset-4 transition hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
        <span aria-hidden="true">•</span>
        <Link href="/terms" className="underline-offset-4 transition hover:text-foreground hover:underline">
          Terms of Service
        </Link>
      </div>
    </footer>
  </main>
);

export default PrivacyPage;
