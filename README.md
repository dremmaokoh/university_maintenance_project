# University Maintenance & Service Request System

MIT 8333 full-stack project — React (Vite) + Node.js (Express) + MongoDB.

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

## Backend setup

```bash
cd server
npm install
copy .env.example .env
```

Edit `server/.env` (especially `JWT_SECRET` and `MONGODB_URI`).

```bash
npm run seed
npm run dev
```

- API: `http://localhost:5000`
- Health: `GET /api/health`
- Swagger: `http://localhost:5000/api/docs`

1. Open `http://localhost:5173` and **Create administrator account** (only when no admin exists).
2. Invite maintenance officers from **Invite users** (copy link).
3. Students use **Student sign up**; everyone logs in at `/login`.

## Frontend setup

```bash
cd client
npm install
npm run dev
```

App: `http://localhost:5173` (API calls are proxied to port 5000).

## Project standards

See [AGENTS.md](./AGENTS.md).
