# Contributing

TripSync uses a protected branch workflow. All feature work starts from `dev`, merges back into `dev`, then ships through `main`.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<short-scope>
```

Direct pushes to `main` are not allowed. Keep branch scope tight and avoid mixed feature/fix commits in the same PR.

## Pull Request Standard

Open PRs into `dev` only. Keep each PR limited to one coherent change and include code, tests, and docs in the same branch when needed.

Run checks locally before opening the PR:

```bash
cd app
npm run lint
npm test -- --watch=false
cd ../backend
npm run lint
npm test
```

Resolve every review comment, re-run checks after rebases, and merge only when CI is green.

## Commit Convention

Use Conventional Commits with specific scopes and verbs.

```text
feat: add trip invitation endpoint
fix: handle missing itinerary date in mobile form
refactor: move supabase calls to service layer
test: add backend health route test
docs: update environment setup section
```

## Secrets and Configuration Rules

Never commit `.env` files or paste secrets in PR comments. When a variable changes, update `app/.env.example`, `backend/.env.example`, and `README.md` in the same PR so onboarding stays correct.
