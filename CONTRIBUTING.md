# Contributing to trip-planner

## Branch Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production releases |
| `dev` | Integration / staging |
| `feature/*` | Individual feature development |

### Flow

```
feature/* → dev → main
```

1. Create a `feature/<name>` branch off `dev`.
2. Open a pull request from `feature/<name>` → `dev` when the work is ready.
3. After QA on `dev`, open a pull request from `dev` → `main` for a production release.

## Pull Request Rules

- **1 approval** is required before merging any pull request.
- All CI checks must pass before merging.
- Pull request titles should be descriptive (e.g. `feat: add trip details page`).
- Keep pull requests small and focused — one feature or fix per PR.

## Developer Guidelines

1. **Code style** – Each sub-project (`backend`, `web`, `mobile`) has its own ESLint configuration. Run `npm run lint` inside the sub-project before pushing.
2. **Tests** – Add or update tests for every change. Run `npm test` inside the sub-project. CI will fail if tests are not green.
3. **Environment variables** – Never commit `.env` files. Use `.env.example` files to document required variables.
4. **Commits** – Use [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` new feature
   - `fix:` bug fix
   - `chore:` tooling / config
   - `docs:` documentation only
5. **Dependencies** – Discuss adding new dependencies in the PR description. Avoid unnecessary packages.
