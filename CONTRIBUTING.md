# Contributing to TripSync

## Branch Strategy

- `main` -> production, PR approval required
- `dev` -> staging, CI must pass
- `feature/*` -> always branch from `dev`, PR back into `dev`

Required flow:

```text
feature/* -> dev -> main
```

Rules:

1. Never push directly to `dev` or `main`.
2. Never force-push `dev` or `main`.
3. Keep feature branches focused to one change set.

## Pull Request Rules

1. Open PR from `feature/*` into `dev`.
2. Ensure CI is green (lint, test, build).
3. At least one reviewer approval is required.
4. Resolve all review comments before merge.
5. Use small PRs with clear scope.

## Commit Message Format

Use Conventional Commits:

- `feat: add trip invite flow`
- `fix: prevent duplicate activity creation`
- `chore: update expo dependencies`
- `docs: update setup instructions`
- `refactor: simplify trip list state handling`
- `test: add unit test for trip card`

## Environment and Secrets

- Never commit `.env`.
- Never post secrets in PRs/issues/chat.
- Get env values from DevOps privately.

Required app env vars:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

## CI

- CI runs via GitHub Actions.
- CI validates lint, tests, and build.
- `dev` must stay green.
