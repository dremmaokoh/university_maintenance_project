# Resolva — Technical Documentation

**University Maintenance and Service Request System**  
MIT 8333 — Advanced Web Application Development

Only **Section 8** needs your screenshot images pasted into the Word/PDF copy. Live URLs and deployment details below match the Render services in use. Do not paste secrets, `.env` values, or database passwords.

---

## 1. Introduction and problem statement

Universities receive maintenance complaints through informal channels such as phone calls, paper forms, WhatsApp messages, and visits to an estates office. Those channels make it difficult to know who owns a job, what the current status is, and whether the work was completed.

**Resolva** is a web application that gives each institution a single place to submit, assign, and track maintenance requests. Staff and students report issues. Administrators assign work to maintenance officers. Officers update progress. Requesters can follow the same ticket from submission through completion.

The system is multi-organisation: each campus (or department) has its own users, categories, and requests. A student at one organisation cannot see another organisation’s data.

---

## 2. System objectives

1. Allow staff and students to submit maintenance requests with a title, description, location, category, and optional evidence file.
2. Allow administrators to invite maintenance officers and other admins, share a registration link, and assign or unassign work.
3. Allow officers to view only requests assigned to them and to move status along a fixed path: pending → assigned → in progress → completed.
4. Preserve a status history, comments, and an optional star rating after a request is completed.
5. Enforce the three roles on the **server**. The browser must not be the only access control.
6. Provide a REST API, automated tests, and an online deployment (Render, MongoDB Atlas, Cloudinary).

---

## 3. Requirement analysis

### 3.1 User roles

| Role in the product | Stored value | Typical access |
|---------------------|--------------|----------------|
| Student / Staff | `student` (`memberType` is `student` or `staff`) | Own requests only; submit new requests; rate completed work |
| Maintenance officer | `officer` | Assigned requests only; update status; view categories |
| Administrator | `admin` | Organisation-wide requests, assignment, team, categories, dashboard |

### 3.2 Functional requirements (implemented)

- An administrator can create an organisation and an admin account (`POST /api/auth/setup-admin`).
- Staff and students register only through the organisation link (`/o/{slug}/register`).
- Users authenticate with email and password. The API issues a JWT.
- Students create requests; lists and detail views are filtered by role.
- Admins assign an active officer; assignment can be cancelled while status is still `assigned`.
- Status may only follow allowed transitions.
- Each status change is stored as a history record.
- Comments can be added on a request; visibility to the requester is controlled.
- Completed requests can be rated 1–5 stars by the requester.
- Categories are seeded per organisation and can be managed by admins.
- Admins invite officers/admins with a time-limited token; the invitee sets a password.
- Evidence files are uploaded to Cloudinary (with local disk as a fallback).
- Signed-in users are logged out automatically after **10 minutes** of inactivity (no mouse, keyboard, touch, scroll, or click).
- Password reset uses a copyable link (the coursework app does not send email).

### 3.3 Non-functional requirements

- Passwords are hashed with bcrypt; they are never stored in plaintext.
- JWT secrets and database credentials come from environment variables.
- Inputs are validated with express-validator.
- Data is scoped by `organisation`.
- The API returns JSON in a consistent shape: `{ success, data }` or `{ success, message }`.
- The application is deployed on Render and remains usable over HTTPS.

---

## 4. Frontend technologies used

| Technology | Role |
|------------|------|
| React 19 | User interface (functional components and hooks) |
| Vite 6 | Development server and production build |
| React Router 7 | Client-side routes (`HashRouter` in production so Render’s static CDN can open `/#/login` without extra rewrite rules) |
| Fetch wrapper (`client/src/api/client.js`) | All HTTP calls use one API base URL |
| CSS | Shared layout and page styles (no third-party UI kit) |
| Vitest + Testing Library + jsdom | Automated UI tests |

The client does not store passwords in `localStorage`. It stores only the JWT under a session key and loads the current user from `GET /api/auth/me`.

Local development: Vite proxies `/api` to `http://localhost:5000`. Production: `VITE_API_BASE_URL` is baked in at build time (must end with `/api`).

---

## 5. Backend technologies used

| Technology | Role |
|------------|------|
| Node.js (18+) | Runtime |
| Express 4 | HTTP API |
| Mongoose 8 | MongoDB schemas and queries |
| JSON Web Tokens | Session tokens |
| bcrypt | Password hashing |
| express-validator | Request body and query validation |
| Multer | Multipart upload of evidence |
| Cloudinary | Cloud storage for evidence |
| swagger-ui-express | API explorer at `/api/docs` |
| Node test runner, Supertest, mongodb-memory-server | Automated API tests |

Architecture (layers used in this project):

- **Routes** — HTTP paths
- **Validators** — input rules
- **Middleware** — JWT auth, role checks, errors, file upload
- **Services** — business rules (assign, status, login)
- **Models** — MongoDB documents

---

## 6. Database and relationships

**Database:** MongoDB (MongoDB Atlas in production).  
**ODM:** Mongoose.

MongoDB is a document database. It does not use SQL foreign keys. This project still models **relationships** with `ObjectId` references (`ref`) and, where it is simpler, **embedded** subdocuments.

### 6.1 Collections

| Collection | Purpose |
|------------|---------|
| organisations | One tenant (name, unique slug, creator email) |
| users | Accounts; role is a field on the user |
| categories | Issue types per organisation |
| requests | Maintenance tickets |
| assignments | Record of who was assigned, by which admin |
| statusupdates | Status history for a request |
| requestcomments | Comments on a request |

Roles are **not** a separate collection. They are validated enum values on `users` (`admin`, `officer`, `student`).

### 6.2 Relationship types

These are the relationships a marker should see in an ER-style diagram:

```text
Organisation 1 ──< Users
Organisation 1 ──< Categories
Organisation 1 ──< Requests

User (requester) 1 ──< Requests
User (officer)   0..1 ──< Requests.assignedOfficer
User (admin)     1 ──< Assignments.assignedBy

Request N >── 1 Category
Request 1 ──< Assignments
Request 1 ──< StatusUpdates
Request 1 ──< RequestComments

Assignment N >── 1 User (officer)
```

| From | To | Type | How it is stored |
|------|-----|------|------------------|
| Organisation → Users | One-to-many | `User.organisation` → Organisation |
| Organisation → Requests | One-to-many | `Request.organisation` → Organisation |
| Organisation → Categories | One-to-many | `Category.organisation` → Organisation |
| User → Requests (as requester) | One-to-many | `Request.requester` → User |
| Request → Category | Many-to-one | `Request.category` → Category |
| Request → assigned officer | Many-to-one (optional) | `Request.assignedOfficer` → User |
| Request → Assignments | One-to-many | `Assignment.request` → Request |
| Request → Status updates | One-to-many | `StatusUpdate.request` → Request |
| Request → Comments | One-to-many | `RequestComment.request` → Request |
| Request → Evidence | Composition (embedded) | `Request.evidence` subdocument |

**Embedded vs referenced:** evidence metadata (file name, Cloudinary public id, mime type) lives on the request because it is owned by that ticket and is not queried on its own. Users, categories, and history are referenced so they can be listed independently.

### 6.3 Integrity rules (application + schema)

- Unique email **per organisation** (compound index).
- Unique category name **per organisation**.
- Unique organisation slug and unique `createdByEmail`.
- Request status is one of `pending`, `assigned`, `in_progress`, `completed`.
- Status transitions are restricted in `requestService` (`ALLOWED_TRANSITIONS`).

---

## 7. API documentation

Interactive explorer (production):

```text
https://university-maintenance-project.onrender.com/api/docs
Health check: https://university-maintenance-project.onrender.com/api/health
```

Locally: `http://localhost:5000/api/docs`.

Protected routes expect:

```http
Authorization: Bearer <jwt>
```

Success responses use `{ "success": true, "data": … }`. Errors use `{ "success": false, "message": "…" }` and, for validation, an `errors` array of `{ field, message }`. Stack traces are not returned to clients.

The Swagger UI is mounted from `swagger-jsdoc`. The table below is the **complete** list of routes as implemented (this is the source of truth for the report).

### 7.1 Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | API up; includes database target info |

### 7.2 Authentication (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/can-create-organisation` | No | Whether an email may create an organisation |
| POST | `/setup-admin` | No | Create organisation + first admin |
| POST | `/register` | No | Register student/staff on an org slug |
| POST | `/login` | No | Login; may return account picker if the email exists in more than one org |
| POST | `/forgot-password` | No | Start reset; returns a path to copy |
| GET | `/reset-password/:token` | No | Preview reset token |
| POST | `/reset-password/:token` | No | Set new password |
| GET | `/me` | JWT | Current user |

### 7.3 Organisations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/organisations/:slug` | No | Public org name for the register/login pages |

### 7.4 Requests (`/api/requests`)

| Method | Path | Auth / role | Description |
|--------|------|-------------|-------------|
| GET | `/` | JWT | Paginated list (students: own; officers: assigned; admins: org) |
| POST | `/` | Student | Create request (JSON or multipart with `evidence`) |
| GET | `/export` | Admin, officer | Export filtered rows |
| GET | `/work/stats` | Officer | Officer workload counts |
| GET | `/:id` | JWT + access rule | Detail |
| DELETE | `/:id` | Admin | Delete |
| GET | `/:id/evidence` | JWT + access rule | File stream |
| POST | `/:id/assign` | Admin | Assign officer |
| POST | `/:id/unassign` | Admin | Cancel assignment (status must still be `assigned`) |
| PATCH | `/:id/status` | Admin or assigned officer | Allowed transition only |
| GET | `/:id/history` | JWT + access rule | Status log |
| GET | `/:id/comments` | JWT + access rule | Comments (filtered for requesters) |
| POST | `/:id/comments` | JWT + access rule | Add comment |
| POST | `/:id/rating` | Student (owner) | 1–5 stars after completion |

### 7.5 Other resources

| Method | Path | Auth / role | Description |
|--------|------|-------------|-------------|
| GET | `/api/categories` | JWT | List |
| GET | `/api/categories/suggested` | JWT | Suggested names |
| POST | `/api/categories` | Admin | Create |
| PATCH | `/api/categories/:id` | Admin | Update |
| DELETE | `/api/categories/:id` | Admin | Delete |
| POST | `/api/invites` | Admin | Create invite |
| GET | `/api/invites/:token` | No | Preview invite |
| POST | `/api/invites/:token/accept` | No | Set password and activate |
| GET | `/api/dashboard/overview` | JWT | Role-specific stats |
| GET | `/api/reports/summary` | Admin | Report summary |
| GET | `/api/assignments` | Admin | Assignment list |
| GET | `/api/users` | Admin | Team list (and related member/officer/stats/export/profile routes) |

---

## 8. Screenshots of major interfaces

Take these from the **live** site (hash routes). Caption each image with the role and what the screen is for. Do not show passwords or JWT tokens.

| # | Screen | URL to capture | Caption to write |
|---|--------|----------------|------------------|
| 1 | Landing | https://resolva-1u28.onrender.com/#/ | Public home / get started |
| 2 | Create organisation | https://resolva-1u28.onrender.com/#/admin/register | First admin setup |
| 3 | Staff login | https://resolva-1u28.onrender.com/#/login | Officers and admins |
| 4 | Student/staff register | https://resolva-1u28.onrender.com/#/o/{your-org-slug}/register | Org-scoped registration |
| 5 | Admin overview | https://resolva-1u28.onrender.com/#/dashboard | KPI / charts |
| 6 | Team & Access | https://resolva-1u28.onrender.com/#/admin/invites | Invites and registration link |
| 7 | All requests | https://resolva-1u28.onrender.com/#/requests (admin) | Organisation queue |
| 8 | New request | https://resolva-1u28.onrender.com/#/requests/new (student) | Submit form |
| 9 | Request detail | https://resolva-1u28.onrender.com/#/requests/{id} | Status, comments, evidence, rating |
| 10 | Officer My Work | https://resolva-1u28.onrender.com/#/requests (officer) | Assigned jobs only |
| 11 | Categories | https://resolva-1u28.onrender.com/#/categories | Issue types |
| 12 | API docs (optional) | https://university-maintenance-project.onrender.com/api/docs | Swagger UI |

**Paste screenshots below this line in the Word/PDF copy.**

_Figure 1. Landing page._  
_Figure 2. Organisation setup._  
_Figure 3. Login._  
_Figure 4. Student registration._  
_Figure 5. Administrator dashboard._  
_Figure 6. Team & Access._  
_Figure 7. Request list (admin)._  
_Figure 8. New maintenance request._  
_Figure 9. Request detail with history._  
_Figure 10. Officer My Work._  
_Figure 11. Categories._  

---

## 9. Testing evidence

Tests are required by the module brief. They run without Atlas credentials.

```bash
cd server
npm test

cd client
npm test
```

### 9.1 Results recorded during development

Server tests were run with `npm.cmd test` in `server` (PowerShell blocks `npm.ps1`). Result from that run: **26 tests, 2 suites, 26 passed, 0 failed**.

| Suite | Command | Result (last local run) |
|-------|---------|-------------------------|
| Backend | `cd server && npm.cmd test` | **26 passed, 0 failed** (2 suites) |
| Frontend | `cd client && npm.cmd test` | **13 passed, 0 failed** (5 files, Vitest) |

Backend tests use **MongoDB Memory Server**. They do not read or write the production Atlas database.

### 9.2 Backend coverage (HTTP against the real Express app)

| ID | Behaviour | Expected | Result |
|----|-----------|----------|--------|
| T1 | Create organisation admin | 201 and JWT | Pass |
| T2 | Login with wrong password | 401 | Pass |
| T3 | Register student on org slug | 201 | Pass |
| T4 | Short password on register | 400 | Pass |
| T5 | Duplicate student email in same org | 409 | Pass |
| T6 | List requests without token | 401 | Pass |
| T7 | Invalid create-request body | 400 | Pass |
| T8 | Student creates and lists own request | 201 then list total 1 | Pass |
| T9 | Another student opens that request | 403 | Pass |
| T10 | Admin assigns; officer updates in_progress then completed | 200 | Pass |
| T11 | Jump pending → completed | 400 | Pass |
| T12 | Officer assigns a request | 403 | Pass |
| T13 | Officer views unassigned request | 403 | Pass |
| T14 | Admin submits a student request | 403 | Pass |
| T15 | Get unknown request id | 404 | Pass |
| T16 | GET `/api/health` on real app | 200 | Pass |

Unit tests also cover comment visibility and resolution-duration formatting.

### 9.3 Frontend coverage (pages with mocked APIs)

| ID | Behaviour | Result |
|----|-----------|--------|
| F1 | Login shows error on failed sign-in | Pass |
| F2 | Login submit disables while in progress | Pass |
| F3 | Register validates empty fields | Pass |
| F4 | Register rejects short password | Pass |
| F5 | Valid register calls `registerStudent` | Pass |
| F6 | New request submit and busy button | Pass |
| F7 | New request shows API error | Pass |
| F8 | Request list loading then student rows | Pass |
| F9 | Request list error + Try again | Pass |
| F10 | Officer sees My Work, not New Request | Pass |
| F11 | Guest hitting `/requests` is sent to login | Pass |
| F12 | Student can open `/requests` | Pass |
| F13 | Officer blocked from student-only `/requests/new` | Pass |

**Terminal evidence (confirmed from the runs you captured).** Paste the matching screenshots into the Word/PDF copy under these captions.

_Figure T1. Server tests, start of `npm.cmd test`._  
_Figure T2. Server tests, middle of the run._  
_Figure T3. Server tests, summary: tests 26, suites 2, pass 26, fail 0._  
_Figure T4. Client tests, start of `npm.cmd test` (Vitest)._  
_Figure T5. Client tests, summary: 5 files passed, 13 tests passed._

The client run also printed `No routes matched location "/requests"` on stderr during student registration. That test still passed (the app redirects after register).

---

## 10. Deployment information

### 10.1 Production architecture

```text
Browser
   │
   ▼
Render Static Site (React build in client/dist)
   │  HTTPS, HashRouter (/#/login)
   ▼
Render Web Service (Express in server/)
   │
   ├── MongoDB Atlas (documents)
   └── Cloudinary (evidence files)
```

Render’s filesystem is ephemeral. Evidence is stored in Cloudinary, not on the web-service disk, for that reason.

### 10.2 Live URLs

| Service | URL |
|---------|-----|
| Frontend (static site) | https://resolva-1u28.onrender.com |
| API (web service) | https://university-maintenance-project.onrender.com |
| Health | https://university-maintenance-project.onrender.com/api/health |
| Swagger | https://university-maintenance-project.onrender.com/api/docs |
| Source | https://github.com/dremmaokoh/university_maintenance_project |

Frontend build env: `VITE_API_BASE_URL=https://university-maintenance-project.onrender.com/api`.  
API env: `CLIENT_ORIGIN=https://resolva-1u28.onrender.com` (no trailing slash).

### 10.3 How it was deployed

1. **MongoDB Atlas** — database name in the URI (for example `university_maintenance`); network access allowed for Render.
2. **API Web Service** — root directory `server`, build `npm install`, start `npm start`, health `/api/health`. The process listens on `0.0.0.0:$PORT`.
3. **Static Site** — root directory `client`, build `npm install && npm run build`, publish `dist`, env `VITE_API_BASE_URL=https://university-maintenance-project.onrender.com/api`. Live site: `https://resolva-1u28.onrender.com`.
4. **CORS** — API env `CLIENT_ORIGIN=https://resolva-1u28.onrender.com` (no trailing slash).
5. **Secrets** — `MONGODB_URI`, `JWT_SECRET`, Cloudinary keys in the Render dashboard only (not in Git).

A Blueprint file `render.yaml` describes the API service; the static site is created in the dashboard (see `docs/DEPLOY-RENDER.md`).

### 10.4 Environment variable names (no values)

API: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, `INVITE_EXPIRY_DAYS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.  
Frontend build: `VITE_API_BASE_URL`.

### 10.5 Operational note

Render’s free web service sleeps after inactivity. The first request after idle can take tens of seconds. That is a platform limit, not an application crash.

---

## 11. Challenges encountered and solutions

| Challenge | What we did |
|-----------|-------------|
| Opening `/login` in a new tab on Render returned 404 (static host has no server-side routes) | Use `HashRouter` so routes are `/#/login` and `/#/dashboard`. |
| Browser blocked API calls after the static site went live | Set `CLIENT_ORIGIN` on the API to the exact frontend URL and redeploy. |
| Evidence files would disappear on each Render restart | Store uploads in Cloudinary; keep local disk only as a development fallback. |
| Early health tests did not call the real Express app | Extract `createApp` in `server/src/app.js` and test with Supertest plus in-memory MongoDB. |
| Same email can exist in more than one organisation | Login may return an account picker; students can also use `/o/{slug}/login`. |
| Cloudinary uploads returned 403 while Admin API ping succeeded | The API key lacked Upload (`create`) permission; enabled upload on the key in Cloudinary Console (or used a key with full Upload API access). |
| Invite/reset email was out of scope | The UI copies invite and reset links instead of sending mail. |

---

## 12. Conclusion

Resolva is a full-stack maintenance request system for MIT 8333. It supports three roles, organisation-scoped data, assignment and status history, evidence uploads, automated tests, and an online deployment.

**Limits (honest):** invite and password-reset links are copied in the browser rather than emailed; the free Render plan can sleep; Swagger UI is available but the endpoint table in Section 7 is the complete API list.

The application is ready for demonstration at https://resolva-1u28.onrender.com/#/ , the API at https://university-maintenance-project.onrender.com/api/health , the GitHub repository linked in Section 10.2, and the test commands in Section 9.

---

## Appendix A — Local setup

```bash
cd server
npm install
copy .env.example .env
npm run dev

cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Create an organisation from the home page, share the registration link, then invite officers.

## Appendix B — Source layout (for the marker)

```text
client/     React + Vite UI
server/     Express API
docs/       Deploy guide and this report
render.yaml API Blueprint
```
