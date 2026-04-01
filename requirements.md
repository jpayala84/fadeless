# Product Requirements Document (PRD)

## Product Summary
A minimal web application that tracks Spotify songs removed in a user’s library or playlists due to reposts, rights changes, or new track IDs. The app detects silent removals, records them, and notifies users.

The product focuses on reliability, clarity, and preservation of a user’s music history.

---

## Problem Statement
Spotify silently removes tracks from playlists and Liked Songs when songs are reposted under new IDs. Users receive no notification and lose visibility into what disappeared, when it happened, and from which playlist.

---

## Target Users
- Spotify users who curate playlists long-term
- Users who value music emotionally and historically
- Playlist archivists and collectors

---

## Core Goals
1. Detect removed Spotify tracks
2. Preserve historical records (non-destructive)
3. Notify users of changes
4. Provide a clean, accessible UI

---

## MVP Functional Requirements

### Authentication
- Spotify OAuth 2.0 with PKCE
- Read-only scopes
- Secure session handling
- No password storage

### Data Ingestion
- Fetch Liked Songs and user-created playlists
- Store:
  - Track ID
  - Track name
  - Artist(s)
  - Album
  - Playlist source(s)
  - Detection timestamp
- Append-only historical snapshots

### Detection Engine
- Daily background scans
- Compare current vs previous snapshot
- Detect:
  - Removed tracks
- Idempotent and reliable processing

### UI
- Spotify-inspired, dark-first
- Views:
  - Removed This Week
  - All Removed Songs
- Each entry shows:
  - Song metadata
  - Date removed
  - Playlist(s) affected

### Notifications
- Weekly summary (email or in-app)
- User-configurable

---

## Post-MVP Features
- One-click re-add (explicit user action)
- UI color theme presets
- Feedback form

---

## Out of Scope
- Playback
- Social features
- Discovery feeds
- Music timelines

---

## Technical Stack (Production-Oriented)

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix)

### Backend
- Next.js Route Handlers / Server Actions
- Modular service layer

### Database
- PostgreSQL
- Prisma ORM

### Background Jobs
- Scheduled cron scans
- Queue/rate control for Spotify API limits

### Optional AI
- Embeddings for similarity detection
- Vector DB only if enabled

---

## Security Requirements
- OAuth PKCE
- Encrypted token storage
- Least-privilege scopes
- HTTPS enforced
- CSRF protection
- Rate limiting
- Secure headers
- Full user data deletion

---

## Accessibility Requirements
- Semantic HTML
- Keyboard navigation
- Visible focus states
- WCAG-compliant contrast
- Reduced-motion support

---

## Engineering Standards
- End-to-end type safety
- Validation at boundaries
- Separation of concerns
- No business logic in UI
- Predictable error handling

---

## Success Metrics
- Successful Spotify connections
- Accurate detection of removed tracks
- Reliable scheduled scans
- Multi-week user retention
