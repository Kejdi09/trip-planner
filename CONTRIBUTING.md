# Contributing

Follow one branch path: `feature/* -> dev -> main`.

Create every feature branch from `dev`, then open a PR back to `dev`.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<short-name>
```

Do not push directly to `dev` or `main`. Do not force-push shared branches.

## Pull Requests

Open focused PRs. Keep each PR to one change set.

Before opening a PR, run lint and tests in both app and backend:

```bash
cd app
npm run lint
npm test -- --watch=false

cd ../backend
npm run lint
npm test
```

Open the PR from your feature branch into `dev`, wait for CI to pass, resolve every review comment, then merge after approval.

## Commit Messages

Use Conventional Commits. Write short, specific messages.

```text
feat: add trip invite flow
fix: prevent duplicate activity creation
chore: update expo dependencies
docs: rewrite onboarding docs
refactor: simplify trip list state handling
test: add unit test for trip card
```

## Secrets and Configuration

Never commit `.env` files. Never paste keys in issues, PRs, or chat.

When you add or rename an environment variable, update both `app/.env.example` and `README.md` in the same PR.
