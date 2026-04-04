# TripSync

TripSync is a cross-platform trip planning application. The mobile and web clients run from one Expo codebase, and an Express backend handles privileged server-side operations. Supabase provides authentication, Postgres storage, and file storage.

## Tech Stack

The app uses React Native, Expo Router, and TypeScript under `app/`. The data platform is Supabase. The API service under `backend/` runs on Node.js and Express.

## Prerequisites

Use Node.js 20.x and npm.

Install and verify the required CLIs:

```bash
npm install -g expo-cli eas-cli supabase
npx expo --version
eas --version
supabase --version
node --version
npm --version
```

## Clone and Local Setup

Clone the repository and install dependencies for both workspaces.

```bash
git clone https://github.com/Kejdi09/trip-planner.git
cd trip-planner
cd app
npm install
cd ../backend
npm install
```

Create environment files from templates.

PowerShell:

```powershell
Copy-Item app/.env.example app/.env
Copy-Item backend/.env.example backend/.env
```

macOS/Linux:

```bash
cp app/.env.example app/.env
cp backend/.env.example backend/.env
```

## Environment Variables

The app reads `EXPO_PUBLIC_*` variables from `app/.env`. The backend reads server variables from `backend/.env`.

| File | Variable | Purpose | Where to get it |
| --- | --- | --- | --- |
| `app/.env` | `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL used by the app client. | Supabase Dashboard -> Project Settings -> API -> Project URL |
| `app/.env` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anon key used by the app for client-side auth and RLS-scoped queries. | Supabase Dashboard -> Project Settings -> API -> Project API keys -> anon |
| `app/.env` | `EXPO_PUBLIC_API_URL` | Backend base URL used by the app when calling server endpoints. | Local: `http://localhost:3000`; hosted: your backend deployment URL |
| `app/.env` | `EXPO_PUBLIC_SUPABASE_SERVICE_KEY` | Service role key currently referenced by `app/lib/supabase.ts`. This key is privileged and should be moved to backend-only usage. | Supabase Dashboard -> Project Settings -> API -> Project API keys -> service_role |
| `backend/.env` | `SUPABASE_URL` | Supabase project URL used by backend admin client. | Same value as `EXPO_PUBLIC_SUPABASE_URL` |
| `backend/.env` | `SUPABASE_SERVICE_KEY` | Service role key used by backend admin client in `backend/src/app.js`. | Supabase Dashboard -> Project Settings -> API -> Project API keys -> service_role |
| `backend/.env` | `PORT` | Backend listen port. | Local default is `3000`; set explicitly in `backend/.env` |

## Run the App

Run the frontend from `app/` with Expo CLI:

```bash
cd app
npx expo start
```

Use the Expo terminal targets for Android, iOS, and web.

## Run the Backend

Run the backend from `backend/`:

```bash
cd backend
npm run dev
```

Health check endpoint:

```bash
curl http://localhost:3000/health
```

## Folder Structure

`app/` contains the React Native + Expo Router client, including screens in `app/src/app`, UI components in `app/src/components`, and Supabase client setup in `app/lib`.

`backend/` contains the Express API. `backend/src/app.js` configures middleware and clients, while `backend/src/index.js` starts the HTTP server.

`supabase/migrations/` stores SQL migrations. Treat this directory as the schema source of truth.

## Git Workflow

Create feature branches from `dev` and open PRs back into `dev`. Never push directly to `main`. Keep branch names consistent with `feature/<short-scope>`, `fix/<short-scope>`, or `chore/<short-scope>`.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<short-scope>
```

Every PR must pass CI and review before merge.

## Supabase Usage Rules for Developers

Use the anon key from the app for user-scoped reads and writes governed by RLS. Use the service role key only on the backend for privileged operations. Do not commit service-role credentials, do not move service-role usage into mobile/web runtime code, and do not make schema changes directly in the dashboard without committing a SQL migration file under `supabase/migrations`.

For contribution process details, use [CONTRIBUTING.md](./CONTRIBUTING.md). For architecture boundaries, use [ARCHITECTURE.md](./ARCHITECTURE.md).
