# Resolva

**University Maintenance and Service Request System** — MIT 8333 full-stack project (React + Express + MongoDB).

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas). **Use a fresh database** after multi-org updates if you had old data.

## Backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

## Frontend

```bash
cd client
npm install
npm run dev
```

App: `http://localhost:5173`

## Flow

1. Open the home page → **Get started as admin** → enter **organisation name** + admin details.
2. On the dashboard, use **Share registration link** (Team & Access → Staff & Students) for your organisation (`/o/{slug}/register`).
3. **Invite** other admins or maintenance officers (copy invite link).
4. Students register only via your organisation’s link; requests stay scoped to that org.

Staff log in at `/login`. Students use `/o/{your-slug}/login`.

Preview without local Mongo: `npm run dev:preview` in `server`.

## Deploy to Render

Step-by-step guide: **[docs/DEPLOY-RENDER.md](./docs/DEPLOY-RENDER.md)** — start with **Step 1** (API Web Service).

See [AGENTS.md](./AGENTS.md).
