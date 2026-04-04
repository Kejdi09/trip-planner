# Architecture

TripSync runs as three layers: Expo client, Express backend, and Supabase.

## Repository Boundaries

```text
trip-planner/
├── app/                  Expo client for Android, iOS, and web
├── backend/              Server-side API and integrations
└── supabase/
    └── migrations/       SQL schema change history
```

## Layer Responsibilities

### app/

The app owns UI, navigation, client state, and standard user-facing data operations. It talks to Supabase for auth, CRUD, and storage.

### backend/

The backend owns server-only logic. Put privileged operations here, especially anything that needs private keys, strict validation, or orchestration across services.

### supabase/migrations/

This directory is the source of truth for schema changes. Every table, column, index, and RLS policy change needs a migration file committed with the related feature.

## Runtime Data Flow

1. The app authenticates users with Supabase Auth.
2. The app reads and writes primary product data through Supabase.
3. The app calls backend endpoints when logic must run server-side.
4. The backend can use elevated Supabase access for controlled operations.

## Decision Rule: Supabase Direct vs Backend Endpoint

Use direct Supabase access for standard CRUD under row-level security.

Use backend endpoints when the action needs a secret key, cross-service orchestration, or stronger server-side enforcement than client code can guarantee.

## Security Boundaries

Do not keep service-role operations in the client runtime. Move privileged flows to the backend and store sensitive keys in deployment environment settings.
