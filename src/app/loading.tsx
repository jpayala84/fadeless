export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 rounded-full border border-border/40 bg-card/40 px-5 py-3 text-sm text-muted-foreground shadow-lg">
        <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400/70" />
        Loading…
      </div>
    </div>
  );
}
