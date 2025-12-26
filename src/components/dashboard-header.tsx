import Image from "next/image";
import Link from "next/link";

import type { CurrentUser } from "@/lib/auth/current-user";
import { SignOutButton } from "@/components/auth-buttons";

type Props = {
  user: CurrentUser;
  view: "weekly" | "archive" | "settings";
};

export const DashboardHeader = ({ user, view }: Props) => (
  <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-[#050505]/60 px-6 py-6 backdrop-blur">
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
        Spotify Gone Songs
      </p>
      <h1 className="text-3xl font-semibold">
        Welcome back{user.displayName ? `, ${user.displayName}` : "."}
      </h1>
      <p className="text-sm text-muted-foreground">
        Daily scans compare your latest playlists with the previous snapshot.
      </p>
    </div>
    <div className="flex items-center gap-3">
      <Link
        href={view === "settings" ? "/" : "/?view=settings"}
        className={`flex h-11 w-11 items-center justify-center rounded-full border text-xs transition ${
          view === "settings"
            ? "border-emerald-400/70 text-foreground"
            : "border-white/15 text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Settings"
      >
        ⚙️
      </Link>
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.displayName ?? "Spotify user avatar"}
          width={44}
          height={44}
          className="h-11 w-11 rounded-full border border-white/10 object-cover"
        />
      ) : null}
      <div className="text-right">
        <p className="text-sm font-medium">
          {user.email ?? user.displayName ?? "Spotify user"}
        </p>
        <p className="text-xs text-muted-foreground">Read-only scopes</p>
      </div>
      <SignOutButton />
    </div>
  </header>
);
