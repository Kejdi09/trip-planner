# Contributing

This file describes only how developers should work in this repo.

Keep work simple, focused, and easy to review.

## Branching

Start from `dev`, then create your branch:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<short-scope>
```

Open PRs into `dev`. Do not push directly to `main`.

## PR Rules

Keep each PR focused on one clear change.
Prefer small PRs over large mixed changes.
Run lint and tests before opening the PR.
Merge only when CI is green and review comments are resolved.

Include related docs updates in the same PR when behavior or setup changes.

## Commits

Use concise Conventional Commit messages (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
Keep commit messages specific to what changed.

## Secrets

Never commit `.env` files or secrets.
Never paste credentials in issues, PRs, or comments.
