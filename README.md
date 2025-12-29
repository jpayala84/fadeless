# Spotify Gone Songs

A minimal web app that tracks Spotify songs removed or replaced from your playlists or Liked Songs due to reposts, rights changes, or new track IDs.

## Why This Exists
Spotify silently removes songs when artists repost them under new IDs. This app makes those changes visible and preserves your personal music history.

---

## Features (MVP)
- Spotify OAuth login
- Track Liked Songs and playlists
- Detect removed or replaced tracks
- Weekly change summaries
- Clean, Spotify-inspired UI

---

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix)
- PostgreSQL
- Prisma
- Spotify Web API

---

## Architecture Overview
- Frontend: React + Next.js
- Backend: Route Handlers / Server Actions
- Database: PostgreSQL with Prisma
- Jobs: Scheduled scans via cron
- Optional AI: Embeddings for replacement matching

---

## Security & Privacy
- OAuth PKCE (no passwords stored)
- Encrypted token storage
- Read-only Spotify access
- User data isolation
- One-click data deletion

---

## Accessibility
- Keyboard-first navigation
- Semantic HTML
- Accessible components
- WCAG-compliant contrast

---

## Development Notes
- Start with auth + Spotify client
- Build the diff engine before UI
- UI comes last
- Reliability > features

---

## Status
Early development / personal project

---

## Development Setup
1. Install dependencies (Node 18+): `npm install`
2. Run the dev server: `npm run dev`
3. Visit `http://localhost:3000`

> Tooling: Next.js App Router + TypeScript + Tailwind + shadcn/ui primitives.

---

## Project Layout
- `src/app`: App Router routes + API handlers + server actions
- `src/components`: UI building blocks (dashboard, notifications, scan form, auth buttons)
- `src/lib`: Services (auth, Spotify API, Prisma repositories, jobs, encryption helpers)
- `src/ui`: shadcn/ui components starting with `Button`
- `requirements.md` / `agents.md`: Product + engineering rules (keep them close)

Add TODO comments where requirements need clarification rather than guessing. Security, accessibility, and reliability directives in the PRD/agent brief remain authoritative.

---

## Environment Variables

Create `.env.local` with:

| Key | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify app credentials |
| `SPOTIFY_REDIRECT_URI` | Must match your Spotify app callback (e.g., `http://localhost:3000/api/auth/callback`) |
| `SPOTIFY_SCOPES` | Optional override (defaults to read-only playlist/library scopes plus `user-top-read user-read-recently-played`) |
| `ENCRYPTION_SECRET` | 32+ byte secret for AES-GCM token encryption |
| `SESSION_SECRET` | 32+ byte secret for signing session cookies |
| `NEXT_PUBLIC_APP_URL` | Public base URL (e.g., `http://localhost:3000`) |
| `RESEND_API_KEY` | (Optional) Resend API key for weekly digest emails |
| `EMAIL_FROM` | Verified sender address for digests (e.g., `alerts@yourdomain.com`) |

---

## Database & Prisma

1. Update `DATABASE_URL` in `.env.local`.
2. Run `npx prisma migrate dev` to create tables (User, Session, Snapshot, RemovalEvent, NotificationPreference).
3. Regenerate the client when schema changes: `npx prisma generate`.

The snapshot repository and removal-event repository read/write via Prisma, keeping history append-only per requirements.

---

## Spotify OAuth & Tokens

- `/api/auth/login` kicks off OAuth PKCE (code verifier stored in httpOnly cookie).
- `/api/auth/callback` exchanges the code, persists encrypted access/refresh tokens, fetches the Spotify profile, and establishes a signed session cookie.
- `/api/auth/logout` destroys the DB-backed session.

Tokens are encrypted at rest via AES-256-GCM (see `src/lib/security/encryption.ts`).

---

## Detection Engine & Jobs

- `runDailyScan` combines Liked Songs + playlist tracks, snapshots to PostgreSQL, and records removal events.
- Kick it off manually via the “Run daily scan” button on the dashboard (server action) or call `POST /api/jobs/scan`.
- For cron-style execution deploy an external scheduler (e.g., GitHub Actions, Fly, Railway) that hits the scan route per user daily.

---

## Notifications

Users can configure weekly summaries (email or in-app) from the dashboard. Preferences are stored in `NotificationPreference`. Email delivery uses Resend via the `POST /api/jobs/send-weekly-digest` route, which is triggered every Monday by `.github/workflows/weekly-digest.yml`. Summaries include the last 7 days of `RemovalEvent` entries, and we skip users who need to re-authenticate.
