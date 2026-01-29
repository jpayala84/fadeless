export const LIBRARY_PANEL_TABS = [
  { id: "playlists", label: "Playlists" },
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" }
] as const;

export type LibraryPanelTabId = (typeof LIBRARY_PANEL_TABS)[number]["id"];
