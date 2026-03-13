import Link from "next/link";
import { PageNav } from "@/components/page-nav";

const TermsPage = () => (
  <main className="min-h-screen bg-background text-foreground flex flex-col">
    <section className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-16">
      <header className="space-y-3">
        <PageNav />
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">
          Fadeless
        </p>
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated January 28, 2026
        </p>
      </header>

      <section className="space-y-4 text-sm text-muted-foreground">
        <p>
          By using the Service, you agree to these Terms. If you do not agree,
          do not use the Service.
        </p>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Service description
          </h2>
          <p>
            The Service tracks removals from your Spotify library and playlists
            by comparing snapshots over time. It is provided “as is,” without
            warranties.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Your responsibilities
          </h2>
          <ul className="list-inside list-disc space-y-2">
            <li>Keep your Spotify account in good standing.</li>
            <li>Use the Service only for personal, lawful purposes.</li>
            <li>Do not attempt to reverse engineer or abuse the Service.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Limitations
          </h2>
          <p>
            We do our best to detect removals, but results may vary due to
            Spotify data changes, API limitations, or connectivity issues.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Termination
          </h2>
          <p>
            You may stop using the Service at any time. We may suspend access if
            required by law or platform rules.
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

export default TermsPage;
