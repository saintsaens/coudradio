# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coudradio is a multi-platform internet radio application with:
- **Backend**: Express.js API with MPEG-DASH audio streaming, Google OAuth, PostgreSQL, MinIO (S3) storage
- **Frontend**: React + Vite + Redux web app with DASH.js player and PWA support
- **Mobile**: Expo React Native app with native audio playback

## Commands

### Backend (`/backend`)
```bash
npm run start-server-dev   # Dev server with nodemon auto-reload
npm run start-server       # Production server
npm test                   # Run vitest tests
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
npm run channel -- status [name…]       # Overview of all channels (MPD, duration, track count, manifest, inconsistencies)
npm run channel -- tracks <name>        # Tracklist with start times and what's playing now (--sources to show source files)
npm run channel -- verify <name>        # Check every segment exists in MinIO and the live MPD matches the channel
npm run channel -- add <name> [file…]   # Encode bucket files not in the channel yet and append them (--sorted, --dry-run); creates the channel if needed
npm run channel -- reencode <name> <#|from-to…>  # Re-encode tracks from their source (--missing, --outdated, --all, --force, --dry-run)
npm run channel -- export <name> [path] # Save channel.json locally (default ./<name>.json) to edit titles, sources, order, or remove tracks
npm run channel -- sync <name…|--all>   # Regenerate the MPD and tracks.json from channel.json (--dry-run; --file <path> applies an edited copy to one channel)
npm run channel -- bootstrap <name…|--all> [--write]  # Create channel.json from the live MPD (dry run without --write, --force to overwrite)
```

### Frontend (`/frontend`)
```bash
npm run dev      # Vite dev server (HTTPS on localhost)
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Vitest
npm run lint     # ESLint
```

### Mobile (`/mobile`)
```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web version
```

## Architecture

### Streaming Pipeline
The core feature: audio tracks are encoded with FFmpeg into MPEG-DASH segments, stored in MinIO (S3-compatible), and served as adaptive bitrate streams. Channel management (steps 1–3) lives in `backend/channels/` and only writes to MinIO; the server (steps 4–5) only reads from it and never imports `channels/`. The flow is:
1. `channels/cli/` (`npm run channel`) → `channels/maintenance.js` — adds, re-encodes and publishes tracks
2. `channels/encoding/` — FFmpeg encoding of each source file and segment upload
3. `channels/manifest/` + `channels/mpd/` — the `channel.json` model, and the channel MPD (Media Presentation Description) built from it
4. `stream.js` route + `streamController.js` — serves MPD files; `segment.js` route serves audio chunks
5. Frontend `AudioPlayer.jsx` uses DASH.js to consume the stream

Both sides share the MinIO client (`db-media/`), the repositories and the playlist clock (`utils/playlistClock.js`), which places every channel's loop.

### Channel management (`backend/channels/`)
Dependencies point one way: `cli/` → `maintenance.js` → `encoding/`, `manifest/`, `mpd/` → repositories.
- `cli/` — argument parsing (`index.js`), one function per command (`commands.js`), console output (`format.js`), plus `upload.js` to fill a source bucket
- `maintenance.js` — every operation that reads or writes MinIO: add, re-encode, sync, publish, bootstrap, load a channel
- `manifest/` — pure: the `channel.json` model (`manifest.js`) and consistency checks against the MPD, the source bucket and the segments (`checks.js`)
- `mpd/` — pure: build, parse and ISO 8601 durations of DASH manifests
- `encoding/` — ffmpeg (`encodeTrack.js`), the encode-then-upload loop (`processTracks.js`), segment upload with retries, local working directories

Keep `manifest/` and `mpd/` free of I/O so they can be tested without mocks. Tests live in `channels/tests/`, mirroring these folders.

`mpd/<channel>/channel.json` is the source of truth for a channel: the ordered list of tracks with their segment prefix (`id`, e.g. `track12` → `track12_init.mp4`, `track12_$Number$.m4s`), source file, title, duration, segment template and `encodedAt`. The channel MPD and `tracks.json` are generated from it, so never edit them by hand: edit `channel.json` (`export`, then `sync --file`) instead. Track ids are stable, so reordering or removing tracks never needs re-encoding. `add` and `reencode` save `channel.json` after each track, so an interrupted run resumes when re-run.

### Backend Structure
- **Routes** → **Controllers** → **Services** → **Repositories** (DB layer via `pg`)
- `server.js` initializes loaders (CORS, session, Passport, Morgan) then mounts routes
- Sessions stored in PostgreSQL via `connect-pg-simple`
- Auth: Google OAuth 2.0 via Passport, with federated credentials in a separate table

### Frontend State (Redux)
Four slices in `/frontend/src/store/features/`:
- `audioPlayerSlice` — player state (muted, playing, error, duration)
- `userSlice` — authenticated user (id, username, role, subscription, channel list)
- `channelSwitcherSlice` — active channel
- `listenersSlice` — live listener count (polled from `/api/users/listeners`)

### Mobile
Expo Router with file-based routing. Key routes: `index.tsx` (channel list), `/channel/[channelName].tsx` (player). Uses `react-native-track-player` for native background audio.

## Environment Variables

**Backend** (`.env`): `DATABASE_URL`, `MINIO_*` (endpoint, port, access/secret key, bucket), `GOOGLE_CLIENT_ID/SECRET`, `STRIPE_*`, SSL cert paths, `SESSION_SECRET`

**Frontend** (`.env`): `VITE_BACKEND_URL`, `VITE_CHANNELS_DEFAULT` (comma-separated, shown to unauthenticated users), `VITE_CHANNELS_LOGGEDIN` (comma-separated, shown to authenticated users), SSL cert paths

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/:channel` | DASH manifest (MPD) for a channel |
| `GET` | `/api/segment` | Audio segment data |
| `GET` | `/api/auth/login` | Initiate Google OAuth |
| `GET` | `/api/auth/oauth2/redirect/google` | OAuth callback |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/user/profile` | Fetch user profile |
| `GET` | `/api/users/listeners` | Active listener count |
| `POST` | `/api/payment/webhook` | Stripe webhook |

## Database

PostgreSQL with three tables:
- `users` — accounts, roles, session tracking, time spent
- `sessions` — express session store (via `connect-pg-simple`)
- `federated_credentials` — Google OAuth credentials

## Creating a New Channel

1. Upload audio files to a new MinIO bucket named `<channel-name>` (`node channels/cli/upload.js <dir> <bucket>` in `/backend`)
2. Run `npm run channel -- add <channel-name>` in `/backend` — encodes every file with FFmpeg, uploads the segments, then publishes `channel.json`, the MPD and `tracks.json`
3. Add `<channel-name>` to `VITE_CHANNELS_DEFAULT` (public) or `VITE_CHANNELS_LOGGEDIN` (subscribers only) in `frontend/.env`

## Key Technical Notes

- Backend runs HTTPS locally (self-signed certs) and plain HTTP in production; trust proxy is enabled
- Frontend Vite dev server proxies API calls to `https://localhost:3001`
- Listener count is tracked via session activity timestamps; `/api/users/listeners` returns currently active sessions
- The `shared/` directory exists but is currently empty (intended for shared utilities)
- Playlist duration is read directly from the MPD's `mediaPresentationDuration` attribute at playback time — no need to track it manually
