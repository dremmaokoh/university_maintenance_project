# Deploy Resolva to Render (step by step)

Work through **one step at a time**. Do not move on until the current step’s check passes.

| Step | What |
|------|------|
| **1** | Deploy the **API** (Web Service) — done |
| **2** | Deploy the **frontend** (Static Site) — *you are here* |
| 3 | Connect API ↔ frontend (`CLIENT_ORIGIN` on API) |
| 4 | Production smoke test |

---

## Step 1 — Deploy the API on Render

### Before you open Render

1. **GitHub:** This project is on GitHub and pushed (`master` or your deploy branch).
2. **MongoDB Atlas:** Same cluster/database you use locally (`university_maintenance` in the URI).
3. **Atlas Network Access:** Allow connections from Render (for coursework, **Allow access from anywhere** `0.0.0.0/0` is common; tighten later if you want).
4. **Secrets ready** (copy from local `server/.env` — do not commit `.env`):
   - `MONGODB_URI`
   - `JWT_SECRET` (use a **new** long random string for production if you prefer)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (key must allow **upload / create**)

### Create the Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
2. Connect your **GitHub** repo (`university-maintenance` / your repo name).
3. Use these settings:

   | Setting | Value |
   |---------|--------|
   | **Name** | e.g. `resolva-api` |
   | **Region** | Closest to you / users |
   | **Branch** | `master` (or your main branch) |
   | **Root Directory** | `server` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Plan** | Free (fine for demo; cold starts after idle) |

4. **Environment variables** (Render → your service → **Environment**):

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | Your Atlas URI (includes DB name before `?`) |
   | `JWT_SECRET` | Long random string |
   | `JWT_EXPIRES_IN` | `1d` (optional) |
   | `INVITE_EXPIRY_DAYS` | `7` (optional) |
   | `CLIENT_ORIGIN` | Temporary: `http://localhost:5173` — **Step 3** will change this to your Render frontend URL |
   | `CLOUDINARY_CLOUD_NAME` | From Cloudinary |
   | `CLOUDINARY_API_KEY` | From Cloudinary |
   | `CLOUDINARY_API_SECRET` | From Cloudinary |

   Render sets **`PORT`** automatically; the app reads it — do not hardcode `5000` on Render.

5. **Health check (optional but recommended):** Path `/api/health`.

6. Click **Create Web Service** and wait for the first deploy to finish (green “Live”).

### Step 1 — Pass / fail check

Open in a browser (replace with your service URL):

```text
https://YOUR-SERVICE-NAME.onrender.com/api/health
```

**Pass:** JSON like `{ "success": true, "message": "API is running.", "database": ... }` with database showing **atlas** (or connected), not an error page.

**Fail:** 502/503 — check Render **Logs** (Mongo URI, Atlas IP allowlist, missing env var).  
**Fail:** App crash on boot — logs often say `Missing required environment variable: ...`.

Copy your API base URL for later steps:

```text
https://YOUR-SERVICE-NAME.onrender.com
```

Swagger (after Step 1 passes): `https://YOUR-SERVICE-NAME.onrender.com/api/docs`

---

## Step 2 — Frontend (Static Site)

Do this after Step 1 `/api/health` works.

Your API base (from Step 1):

```text
https://university-maintenance-project.onrender.com
```

### Create the Static Site

1. [Render Dashboard](https://dashboard.render.com/) → **New +** → **Static Site**.
2. Connect the same GitHub repo: `university_maintenance_project`.
3. Settings:

   | Setting | Value |
   |---------|--------|
   | **Name** | e.g. `resolva-web` |
   | **Branch** | `master` |
   | **Root Directory** | `client` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |
   | **Plan** | Free |

4. **Environment variable** (required — baked in at build time):

   | Key | Value |
   |-----|--------|
   | `VITE_API_BASE_URL` | `https://university-maintenance-project.onrender.com/api` |

   If your API URL differs, use `https://YOUR-API.onrender.com/api` (must end with `/api`).

5. **Routing:** The app uses hash URLs (`/#/login`, `/#/dashboard`) so new-tab links work on Render without extra rewrite rules. Optional: add **Rewrite** `/*` → `/index.html` if you later switch back to path-based URLs.

6. **Create Static Site** and wait until deploy is **Live**.

### Step 2 — Pass / fail check

Open your static site URL (e.g. `https://resolva-web.onrender.com`):

- **Pass:** Resolva landing page loads (not a blank page or 404 on `/`).
- **Pass:** Browser devtools → Network: requests go to `university-maintenance-project.onrender.com/api/...` (after you try login or register), not `localhost:5000`.

Copy your **frontend URL** for Step 3:

```text
https://YOUR-STATIC-SITE.onrender.com
```

---

## Step 3 — Link API and frontend

After Step 2, update CORS on the API:

1. Render → **university_maintenance_project** (Web Service) → **Environment**.
2. Set **`CLIENT_ORIGIN`** to your static site URL exactly, e.g. `https://resolva-web.onrender.com` (no trailing slash).
3. **Save** and let the API redeploy (or Manual Deploy).

If you change `VITE_API_BASE_URL`, **redeploy the static site** (new build required).

---

## Step 4 — Smoke test

*After Step 3.* Register admin, submit a request with evidence, confirm Cloudinary badge and login flows.

---

## Optional: Blueprint (`render.yaml`)

The repo includes a minimal `render.yaml` for the **API only**. You can use **New → Blueprint** and point at this repo instead of filling the form manually; you still must enter secret env vars in the dashboard after sync.
