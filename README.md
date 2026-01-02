# MoveKind Next Frontend (proxy to Umbraco)

## Setup
1. Copy `.env.example` to `.env.local` and adjust:
```
NEXT_PUBLIC_UMBRACO_URL=https://api:8443
```
For self-signed TLS during local dev, run:
```
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

2. Install and run:
```
npm i
npm run dev
```

3. Endpoints available at `http://localhost:3000/api/...` proxied to Umbraco:
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/register`
- POST `/api/auth/change-password`
- GET/PUT `/api/members/me`
- GET `/api/favorites`
- GET `/api/favorites/ids`
- POST/DELETE `/api/favorites/:workoutId`
- POST `/api/favorites/:workoutId/toggle`

## Pages
- `/` Home
- `/login` Login form
- `/profile` View/update profile, logout
- `/workouts` Minimal example list where you can favorite/unfavorite (uses hardcoded IDs 1090 & 1092 — replace with your Delivery API)
- `/favorites` Lists your favorited workouts (expects your Umbraco controller to return { id, name, url, imageUrl, title, duration } per item).

Adapt the mapping in your Umbraco controller to include `imageUrl`, `title`, `duration`, etc.
