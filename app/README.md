# Trip Planner App

Expo app for Trip Planner, targeting Android, iOS, and Web from one codebase.

## Tech Stack

- Expo + React Native
- Expo Router
- TypeScript
- Jest (unit tests)

## Scripts

- `npm start` - start Expo dev server
- `npm run android` - open Android target
- `npm run ios` - open iOS target
- `npm run web` - run web target
- `npm run lint` - run lint checks
- `npm test` - run Jest tests

## Setup

```bash
npm install
npm start
```

If dependency resolution fails because of Expo canary peer dependencies, run:

```bash
npm install --legacy-peer-deps
```

## Test Command

```bash
npm test -- --watch=false
```

## App Structure

- `src/app/` route and screen files
- `src/components/` reusable UI components
- `src/hooks/` reusable hooks
- `src/constants/` app constants and theme config
- `lib/` external service clients

## Team Workflow

1. Branch from `dev` into `feature/<name>`
2. Implement changes with tests
3. Open PR into `dev`
4. Merge into `main` only through release PRs
