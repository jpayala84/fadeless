"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/ui/button";
import { RemovedList } from "@/components/removed-list";
import { cn } from "@/lib/utils";
import {
  mockAllRemovals,
  mockWeeklyRemovals,
  type DemoRemoval
} from "@/data/mock-removals";

const tabs = [
  { id: "weekly", label: "Removed This Week" },
  { id: "all", label: "All Removed Songs" },
  { id: "settings", label: "Settings" }
] as const;

type TabId = (typeof tabs)[number]["id"];

const summaryCards = [
  {
    title: "Removed in July",
    value: "12 tracks",
    trend: "+3 vs last week"
  },
  {
    title: "Playlists affected",
    value: "7 playlists",
    trend: "Curatorial Mix, Roadtrip 2022, Coding Flow"
  },
  {
    title: "Replacement matches",
    value: "4 suggestions",
    trend: "All pending review"
  }
];

export const DemoExperience = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("weekly");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationChannel, setNotificationChannel] = useState<"EMAIL" | "IN_APP">("EMAIL");

  const activeContent = useMemo(() => {
    if (activeTab === "weekly") {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border/60 bg-card/40 p-4"
              >
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.trend}</p>
              </div>
            ))}
          </div>
          <RemovedList
            title="Removed This Week"
            events={mockWeeklyRemovals}
            emptyMessage="Your playlist history is quiet right now. Run a scan to double-check."
          />
        </div>
      );
    }

    if (activeTab === "all") {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <p className="text-sm font-semibold text-foreground">
              Historical archive
            </p>
            <p className="text-sm text-muted-foreground">
              An append-only timeline keeps every removal you care about. Filter by
              playlist, artist, or detection window (coming soon).
            </p>
          </div>
          <RemovedList
            title="All Removed Songs"
            events={mockAllRemovals}
            emptyMessage="Once detections run, your full removal log will appear here."
          />
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/30 p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Notification preferences
          </h3>
          <p className="text-sm text-muted-foreground">
            Decide how the weekly digest shows up. Emails summarize removals, while
            in-app keeps a queue in the sidebar.
          </p>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Enable weekly digest</p>
                <p className="text-xs text-muted-foreground">
                  {notificationsEnabled
                    ? "You will get a summary every Monday morning."
                    : "Notifications are paused until you re-enable them."}
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={notificationsEnabled}
                onChange={(event) => setNotificationsEnabled(event.target.checked)}
                aria-label="Toggle weekly digest"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {["EMAIL", "IN_APP"].map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() =>
                    setNotificationChannel(channel as "EMAIL" | "IN_APP")
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    notificationChannel === channel
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {channel === "EMAIL" ? "Email summary" : "In-app summary"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/30 p-6">
          <h3 className="text-lg font-semibold text-foreground">Danger zone</h3>
          <p className="text-sm text-muted-foreground">
            The PRD mandates one-click data deletion. This UI mirrors that flow
            without touching live data yet.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="justify-between border-destructive text-destructive"
            >
              Export removal archive
              <span className="text-xs text-muted-foreground">JSON / CSV</span>
            </Button>
            <Button variant="destructive">Delete my data</Button>
          </div>
        </div>
      </div>
    );
  }, [activeTab, notificationsEnabled, notificationChannel]);

  const handleSignIn = () => {
    setIsSignedIn(true);
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setActiveTab("weekly");
  };

  return (
    <section
      id="ui-demo"
      className="border-t border-border bg-background px-6 py-16 md:px-16 lg:px-32"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            UI preview
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Interact with the MVP</h2>
          <p className="text-sm text-muted-foreground">
            Toggle between signed-out and signed-in states and explore the tabs
            before real data is wired up.
          </p>
        </div>

        {!isSignedIn ? (
          <div className="rounded-3xl border border-border bg-card/40 p-6 shadow-lg shadow-primary/10 md:p-10">
            <div className="max-w-3xl space-y-4">
              <h3 className="text-2xl font-semibold">Sign in with Spotify</h3>
              <p className="text-sm text-muted-foreground">
                This preview keeps the flow local—no credentials required. Click
                below to step inside the dashboard that surfaces removals.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button size="lg" onClick={handleSignIn}>
                Continue to dashboard
              </Button>
              <Button variant="outline" size="lg">
                Read product brief
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card/20 p-6 shadow-lg shadow-primary/10 md:p-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-primary">
                  Spotify Gone Songs
                </p>
                <h3 className="text-2xl font-semibold">
                  Welcome back, Jordan.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Daily scans compare your latest playlists with the previous
                  snapshot.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">jordan@demo.fm</p>
                  <p className="text-xs text-muted-foreground">Read-only scopes</p>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80"
                  alt="Demo avatar"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            </header>

            <div className="mt-8 flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:border-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-8">{activeContent}</div>
          </div>
        )}
      </div>
    </section>
  );
};
