## Fadeless v1.0.0

Initial public portfolio release of Fadeless.

### Highlights
- Spotify OAuth 2.0 + PKCE authentication flow
- Encrypted token storage and server-managed sessions
- Snapshot-based removal detection for Liked Songs and monitored playlists
- Removal history views (weekly and all-time)
- Playlist monitoring controls with in-app badge notifications
- Weekly digest emails via Resend
- Removal archive export (JSON and CSV)
- User data deletion from settings

### Stack
- Next.js 16
- React 19
- TypeScript
- Prisma + PostgreSQL
- Tailwind CSS + shadcn/ui primitives
- Netlify background functions + scheduled GitHub Actions triggers

### Notes
- This release focuses on removal detection by exact Spotify track ID.
