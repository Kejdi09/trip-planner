# Architecture

TripSync is split into three runtime layers: client (`app/`), API (`backend/`), and data platform (`supabase/`).

## System Boundaries

`app/` is the React Native + Expo Router client. It owns UI, navigation, and user-scoped data access.

`backend/` is the Node.js + Express service. It owns privileged operations that require service-role credentials, cross-service orchestration, or server-side validation.

`supabase/` stores migration SQL for schema and policy changes. The migration history under `supabase/migrations/` is the authoritative schema record.

## Runtime Flow

1. The client authenticates through Supabase Auth.
2. User-scoped reads and writes run through Supabase with RLS.
3. The client calls backend endpoints for privileged operations.
4. The backend executes admin-level Supabase calls using server-side credentials.

## Where Logic Should Live

Keep presentation and user interaction in `app/src/app` and `app/src/components`. Keep external service orchestration and privileged data mutations in `backend/src`.

When a change needs a service key, it belongs in backend code. When a change fits RLS-protected CRUD with anon auth, it can stay in client code.

## Security Boundary

Service-role keys belong in backend environment variables only. Do not ship them in mobile or web runtime configuration. If a client flow currently depends on a service-role key, move that operation behind a backend endpoint before release.
