# Architecture

TripSync is organized as a monorepo with clear responsibilities between app, backend, and database layer.

## Folder Structure

```text
tripsync/
├── app/                  # Expo app (React Native + Expo Router)
├── backend/              # Node/Express API (Render)
└── supabase/
    └── migrations/       # SQL schema changes
```

## Responsibilities

### app/

- Main product code for web and mobile from one codebase.
- Connects directly to Supabase for database, auth, and storage.
- Uses Expo Router for navigation/routing.

### backend/

- Server-side logic layer deployed on Render.
- Use for logic that should not live in the client:
  - sensitive operations
  - integration with external services requiring private keys
  - controlled server-side workflows
- If backend is not needed for a feature, prefer direct Supabase usage from app.

### supabase/migrations/

- Source of truth for schema changes.
- Every new table/column/index/policy change should be represented as a migration file.
- Migration files must be coordinated with DevOps.

## How Components Connect

1. App authenticates users via Supabase Auth.
2. App reads/writes trip data in Supabase.
3. App uses Supabase Storage for files/assets when needed.
4. App calls backend endpoints only for server-side logic.
5. Backend can interact with Supabase when privileged processing is required.

## Supabase vs Backend Decision Rule

Use Supabase directly when:

- standard CRUD is enough
- auth/session-based access is enough
- storage operations are straightforward

Use backend when:

- operation requires secrets not safe for client
- operation should be validated/enforced server-side
- operation coordinates multiple systems and needs orchestration

## Deployment Mapping

- `dev` branch -> staging environment
  - web staging on Vercel
  - backend staging on Render
- `main` branch -> production environment
  - backend production on Render

## CI

GitHub Actions run lint, test, and build checks to protect `dev` and `main` quality.
