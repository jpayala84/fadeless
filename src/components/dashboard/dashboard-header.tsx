import Link from "next/link";

import type { CurrentUser } from "@/lib/auth/current-user";
import { AccountMenuDropdown } from "@/components/auth/account-menu-dropdown";

type Props = {
  user: CurrentUser;
  view: "weekly" | "archive" | "playlists" | "settings";
};

export const DashboardHeader = ({ user, view }: Props) => (
  <header className="mobile-dashboard-header relative z-[70] flex items-start justify-between gap-2.5 overflow-visible border-b border-border/20 bg-background/30 px-4 py-3.5 backdrop-blur md:px-8 md:py-6">
    <div className="min-w-0 space-y-1">
      <Link
        href="/"
        className="inline-flex text-[0.8rem] font-medium uppercase tracking-[0.38em] text-green-500 transition hover:text-green-400 md:text-sm md:tracking-[0.44em]"
      >
        FADELESS
      </Link>
      <h1 className="hidden text-[2.2rem] font-normal tracking-tight md:block md:text-[3.05rem]">
        Welcome back{user.displayName ? `, ${user.displayName}` : "."}
      </h1>
      <div className="md:hidden">
        <p className="text-[1.72rem] leading-[1] font-normal tracking-[-0.02em]">
          Welcome back,
        </p>
        <p className="mt-0.5 max-w-[12.2ch] break-words text-[1.72rem] leading-[1] font-normal tracking-[-0.02em]">
          {user.displayName ?? "Spotify user"}
        </p>
      </div>
    </div>
    <div className="mobile-dashboard-actions flex shrink-0 items-start md:items-center">
      <AccountMenuDropdown user={user} view={view} />
    </div>
  </header>
);
