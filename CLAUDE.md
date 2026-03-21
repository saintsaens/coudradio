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
npm run create-channel <name>  # Create a new radio channel
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
The core feature: audio tracks are encoded with FFmpeg into MPEG-DASH segments, stored in MinIO (S3-compatible), and served as adaptive bitrate streams. The flow is:
1. `channelCreationService/` — sets up a channel with encoded segments
2. `mpdService.js` — generates/parses MPD (Media Presentation Description) manifests
3. `trackEncodingService.js` / `segmentsService.js` — FFmpeg encoding and segment management
4. `stream.js` route + `streamController.js` — serves MPD files; `segment.js` route serves audio chunks
5. Frontend `AudioPlayer.jsx` uses DASH.js to consume the stream

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

## Key Technical Notes

- Backend runs HTTPS locally (self-signed certs) and plain HTTP in production; trust proxy is enabled
- Frontend Vite dev server proxies API calls to `https://localhost:3001`
- Listener count is tracked via session activity timestamps; `/api/users/listeners` returns currently active sessions
- The `shared/` directory exists but is currently empty (intended for shared utilities)
