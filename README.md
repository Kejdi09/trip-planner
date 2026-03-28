# TripSync

TripSync is a social trip planning app.

This monorepo contains:

- an Expo app for web and mobile
- a Node/Express backend (deployed on Render, currently minimal)
- Supabase migrations for database changes

## Project Structure

```text
tripsync/
├── app/                  # Expo (React Native + Expo Router)
├── backend/              # Node/Express API (Render)
└── supabase/
	└── migrations/       # SQL migration files
```

Note: if `supabase/migrations/` is missing in your local checkout, sync with `dev` and create it before adding migrations.

## Tech Stack

- Frontend/Mobile: Expo (React Native) + Expo Router
- Database/Auth/Storage: Supabase
- Mobile testing: Expo Go
- Web staging: Vercel (`dev` branch)
- Backend hosting: Render (`dev` and `main`)
- CI: GitHub Actions (lint, test, build)

## Local Setup

### Prerequisites

- Node.js 20+
- npm

### 1) App

```bash
cd app
npm install
npx expo start
```

- Scan the QR code with Expo Go for mobile testing
- Press `w` to run on web

### 2) Backend

```bash
cd backend
npm install
npm start
```

## Environment Variables

Do not commit `.env`.

Get these values from DevOps privately:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

## CI and Branches

- `main` is production and requires PR approval
- `dev` is staging and CI must pass
- `feature/*` branches must be created from `dev` and merged back to `dev` via PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the exact PR and commit rules.
See [DEVELOPMENT.md](./DEVELOPMENT.md) for daily workflow.
See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and responsibilities.
