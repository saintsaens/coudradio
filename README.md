# Coudradio

A full-stack music streaming platform with themed channels, continuous playback, and multi-platform support (web, mobile).

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express, PostgreSQL, MinIO, FFmpeg, DASH/MPEG-DASH, Passport (Google OAuth), Stripe |
| **Frontend** | React, Vite, Redux Toolkit, Material-UI, dash.js |
| **Mobile** | Expo (React Native), TypeScript, Expo Router, react-native-video |

## Project Structure

```
Coudradio/
├── backend/      # Express API server
├── frontend/     # React + Vite web app
├── mobile/       # Expo React Native app
└── shared/       # Shared utilities
```

## Features

- MPEG-DASH streaming with synchronized playback
- Google OAuth authentication
- User session tracking and time-spent logging
- Stripe payment integration
- Web and native mobile apps

## Setup

### Prerequisites

- Node.js
- PostgreSQL
- MinIO (S3-compatible object storage)
- FFmpeg
- SSL certificates (for local HTTPS)
- Google OAuth app credentials
- Stripe account

### Environment Variables

**Backend** (`.env`):
```
DATABASE_URL=
MINIO_ENDPOINT=
MINIO_PORT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SSL_KEY_PATH=
SSL_CERT_PATH=
```

**Frontend** (`.env`):
```
VITE_BACKEND_URL=
VITE_CHANNELS=
SSL_KEY_PATH=
SSL_CERT_PATH=
```

## Running

### Backend

```bash
cd backend
npm install

# Development (auto-reload)
npm run start-server-dev

# Production
npm run start-server

# Create a new channel
npm run create-channel <channelName>
```

### Frontend

```bash
cd frontend
npm install

# Development
npm run dev

# Production build
npm run build
```

### Mobile

```bash
cd mobile
npm install

# Start Expo dev server
npm start

# Platform-specific
npm run ios
npm run android
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/:channel` | DASH manifest (MPD) for a channel |
| `GET` | `/api/segment` | Audio segment data |
| `GET` | `/api/auth/login` | Initiate Google OAuth |
| `GET` | `/api/auth/oauth2/redirect/google` | OAuth callback |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/user/profile` | Fetch user profile |
| `POST` | `/api/payment/webhook` | Stripe webhook |

## Database

PostgreSQL with three tables:

- `users` — accounts, roles, session tracking, time spent
- `sessions` — express session store
- `federated_credentials` — Google OAuth credentials

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```
