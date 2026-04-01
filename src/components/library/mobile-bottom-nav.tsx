import Link from "next/link";
import { Home, Music2, SquarePlay, Users } from "lucide-react";

import { SpotifyMarkIcon } from "@/components/auth/auth-buttons";
import type { LibraryPanelTabId } from "@/lib/dashboard/library-tabs";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  mobileSection: "library" | "removals";
  mobileRemovalsHref: string;
  activePanel: LibraryPanelTabId;
  onSelectPanel: (panel: LibraryPanelTabId) => void;
};

export const MobileBottomNav = ({
  mobileSection,
  mobileRemovalsHref,
  activePanel,
  onSelectPanel
}: MobileBottomNavProps) => (
  <nav className="mobile-bottom-nav md:hidden" aria-label="Mobile navigation">
    <Link
      href={mobileRemovalsHref}
      className={cn("mobile-bottom-link", mobileSection === "removals" ? "is-active" : "")}
    >
      <Home className="h-5 w-5" />
      <span>Home</span>
    </Link>
    <button
      type="button"
      onClick={() => onSelectPanel("playlists")}
      className={cn(
        "mobile-bottom-link",
        mobileSection === "library" && activePanel === "playlists" ? "is-active" : ""
      )}
    >
      <Music2 className="h-5 w-5" />
      <span>Playlists</span>
    </button>
    <button
      type="button"
      onClick={() => onSelectPanel("artists")}
      className={cn(
        "mobile-bottom-link",
        mobileSection === "library" && activePanel === "artists" ? "is-active" : ""
      )}
    >
      <Users className="h-5 w-5" />
      <span>Artists</span>
    </button>
    <button
      type="button"
      onClick={() => onSelectPanel("albums")}
      className={cn(
        "mobile-bottom-link",
        mobileSection === "library" && activePanel === "albums" ? "is-active" : ""
      )}
    >
      <SquarePlay className="h-5 w-5" />
      <span>Albums</span>
    </button>
    <a
      href="https://open.spotify.com"
      target="_blank"
      rel="noreferrer"
      className="mobile-bottom-link mobile-bottom-link--spotify"
    >
      <span className="flex h-5 w-5 items-center justify-center">
        <SpotifyMarkIcon className="h-[0.92rem] w-[0.92rem]" />
      </span>
      <span>Spotify</span>
    </a>
  </nav>
);
