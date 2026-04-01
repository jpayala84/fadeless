"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronDown, Home, Settings, UserRound } from "lucide-react";

import type { CurrentUser } from "@/lib/auth/current-user";
import { AccountMenuSignOutItem } from "@/components/auth/account-menu-signout-item";

type AccountMenuDropdownProps = {
  user: CurrentUser;
  view: "weekly" | "archive" | "playlists" | "settings";
};

export const AccountMenuDropdown = ({ user, view }: AccountMenuDropdownProps) => {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  const closeMenu = () => {
    if (detailsRef.current?.open) {
      detailsRef.current.open = false;
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const detailsEl = detailsRef.current;
      if (!detailsEl?.open) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!detailsEl.contains(target)) {
        detailsEl.open = false;
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <details ref={detailsRef} className="account-menu relative">
      <summary
        className="account-menu-trigger neon-chip flex h-8 min-w-[3.2rem] list-none items-center justify-between gap-1.5 rounded-full border border-border/40 px-2 text-foreground/95 md:h-12 md:min-w-[4.2rem] md:px-3"
        aria-label="Open account menu"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName ?? "Spotify user avatar"}
            width={32}
            height={32}
            className="h-6 w-6 rounded-full border border-border/30 object-cover md:h-8 md:w-8"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border/35 bg-card/40 text-[0.66rem] font-semibold md:h-8 md:w-8 md:text-[0.95rem] md:font-medium">
            {(user.displayName ?? "SP").slice(0, 2).toUpperCase()}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground md:h-4 md:w-4" />
      </summary>
      <div className="account-menu-panel absolute right-0 z-[120] mt-2 w-[12.5rem] rounded-2xl border border-border/35 bg-card/95 p-1.5 shadow-2xl backdrop-blur">
        <a
          href={`https://open.spotify.com/user/${user.id}`}
          target="_blank"
          rel="noreferrer"
          className="account-menu-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.96rem] text-foreground/95 transition"
          aria-label="Open Spotify profile"
          onClick={closeMenu}
        >
          <UserRound className="h-4 w-4 text-muted-foreground" />
          Profile
        </a>
        <Link
          href={view === "settings" ? "/" : "/?view=settings"}
          className="account-menu-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.96rem] text-foreground/95 transition"
          onClick={closeMenu}
        >
          {view === "settings" ? (
            <Home className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Settings className="h-4 w-4 text-muted-foreground" />
          )}
          {view === "settings" ? "Home" : "Settings"}
        </Link>
        <AccountMenuSignOutItem
          onSelect={closeMenu}
          className="account-menu-item signout-btn mt-0.5 flex h-auto w-full items-center justify-start gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-[0.96rem] font-normal text-foreground/95 shadow-none"
        />
      </div>
    </details>
  );
};
