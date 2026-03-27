# trip-planner

A full MERN stack monorepo for planning and managing trips.

## Structure

```
trip-planner/
├── backend/    # Node.js + Express REST API
├── web/        # React web application
└── mobile/     # Expo + React Native mobile application
```

## Getting Started

Each sub-project is independent. Navigate to the desired folder and follow the instructions in its own README or run `npm install` followed by `npm start`.

## MongoDB Atlas Setup (Team Safe)

Use environment variables for Atlas credentials. Do not commit real secrets.

1. In Atlas, create a database user and allow network access for your dev IP (or temporary `0.0.0.0/0` for testing).
2. Copy your Atlas URI from `Connect -> Drivers`.
3. In `backend/`, create `.env` by copying `.env.example`.
4. Set `MONGODB_URI` in `backend/.env` with your real URI.
5. Keep `.env` local only (already gitignored). Commit only `.env.example`.

Example local file:

```env
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster-url/tripplanner?retryWrites=true&w=majority&appName=TripPlanner
MONGODB_DB_NAME=tripplanner
```

For production/staging, put `MONGODB_URI` in your hosting provider secrets (not in git).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch workflow, PR rules, and developer guidelines.
