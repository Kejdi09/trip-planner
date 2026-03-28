# Development Guide

This guide is the day-to-day workflow for TripSync developers.

## 1) Branch and Sync

Always start from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature
```

Rules:

- Branch from `dev`
- PR back into `dev`
- Never push directly to `dev` or `main`
- Never commit `.env`

## 2) Environment Variables

Get these values from DevOps privately:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

Set them in your local app environment file (`app/.env`).

## 3) Run the App (Expo)

```bash
cd app
npm install
npx expo start
```

How to test targets:

- Mobile: scan QR with Expo Go
- Web: press `w` in Expo terminal

## 4) Run Backend (if needed)

```bash
cd backend
npm install
npm start
```

Use backend only when logic cannot be handled directly in Supabase or requires server-side control.

## 5) Test and Lint Before PR

App:

```bash
cd app
npm run lint
npm test -- --watch=false
```

Backend:

```bash
cd backend
npm run lint
npm test
```

## 6) Open Pull Request

1. Push your feature branch.
2. Open PR into `dev`.
3. Wait for CI (lint, test, build) to pass.
4. Address review comments.
5. Merge only after approval.

## 7) Supabase Usage Rules

- App reads/writes data directly to Supabase.
- Auth and storage are handled through Supabase.
- If you need server-side business logic, add it in `backend/` and notify DevOps.

For schema changes:

1. Add a SQL migration file in `supabase/migrations/`.
2. Notify DevOps for rollout/coordination.
3. Do not make hidden schema changes outside migration files.

## 8) Staging and Production

- `dev` deploys to staging (including Vercel web preview).
- `main` deploys to production.
- Keep `dev` stable so staging is always testable.
