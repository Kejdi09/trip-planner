# TripSync

TripSync is a monorepo for a cross-platform trip planning product. The Expo app ships Android, iOS, and web from one codebase. The backend handles server-side endpoints. Supabase handles auth, database, and storage.

## Prerequisites

Use Node.js 20 or newer and npm.

## Local Setup

Clone the repo, install dependencies, create your app env file, then run app and backend.

```bash
git clone <repository-url>
cd trip-planner

cd app
npm install

cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env

cd ../backend
npm install
```

## Environment Variables

TripSync reads app env values from `app/.env`. Start from `app/.env.example`.

| Variable | What it does | Where to get it |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL used by the app clients. | Supabase Dashboard -> Project Settings -> API -> Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client-side Supabase access. | Supabase Dashboard -> Project Settings -> API -> Project API keys -> anon |
| `EXPO_PUBLIC_SUPABASE_SERVICE_KEY` | Service role key used by the `supabaseAdmin` client in `app/lib/supabase.ts`. This key has elevated privileges. Do not expose it in public builds. Move privileged operations to backend endpoints. | Supabase Dashboard -> Project Settings -> API -> Project API keys -> service_role |
| `EXPO_PUBLIC_API_URL` | Base URL for backend API calls. | Local: `http://localhost:3000`. Hosted: your backend service URL (for example Render). |

## Run Locally

Start backend first:

```bash
cd backend
npm start
```

The backend health endpoint responds at `http://localhost:3000/health`.

Start app in a second terminal:

```bash
cd app
npm start
```

Use Expo Go to open mobile builds from the QR code. Press `w` in the Expo terminal to open web. Use `npm run android` or `npm run ios` for native run targets.

## Quality Checks

Run checks before you open a PR.

```bash
cd app
npm run lint
npm test -- --watch=false

cd ../backend
npm run lint
npm test
```

## Repository Layout

```text
trip-planner/
├── app/                  Expo app (React Native + Expo Router)
│   ├── src/              App screens, components, hooks, constants
│   ├── lib/              Supabase clients and external integrations
│   └── .env.example      App environment template
├── backend/              Node.js/Express API
│   └── src/              API source files
└── supabase/
    └── migrations/       SQL schema migrations
```

## Deployment Notes

Use this branch flow: `feature/* -> dev -> main`.

`dev` is the staging line. Keep it green. `main` is production.

App web previews deploy from `dev` when Vercel is connected. Backend deploys from branch targets on Render. Keep deployment secrets in platform env settings, not in repo files.

When you change database schema, add a SQL migration file under `supabase/migrations` in the same PR.

For contribution rules, read [CONTRIBUTING.md](./CONTRIBUTING.md). For system boundaries, read [ARCHITECTURE.md](./ARCHITECTURE.md).
