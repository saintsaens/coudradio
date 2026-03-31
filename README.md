# Coudradio

An internet radio application with synchronized continuous playback, and adaptive bitrate streaming.

## Features

- Channels with MPEG-DASH adaptive streaming
- Google OAuth authentication
- Stripe subscription support
- Web and mobile ([PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app))

## Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=
MINIO_ENDPOINT=
MINIO_PORT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SESSION_SECRET=
SSL_KEY_PATH=
SSL_CERT_PATH=
```

**Frontend** (`frontend/.env`):
```
VITE_BACKEND_URL=
VITE_CHANNELS_DEFAULT=
VITE_CHANNELS_LOGGEDIN=
SSL_KEY_PATH=
SSL_CERT_PATH=
```

## Running

### Backend

```bash
cd backend && npm install
npm run start-server-dev   # Development (auto-reload)
npm run start-server       # Production
```

### Frontend

```bash
cd frontend && npm install
npm run dev      # Development
npm run build    # Production build
```

For architecture, API routes, channel creation, and development details, see [CLAUDE.md](CLAUDE.md).
