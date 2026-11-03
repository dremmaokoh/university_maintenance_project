# Project PRD

## 1. Document control

| Item | Detail |
|------|--------|
| Document title | Project PRD |
| Product name | Resolva |
| Product description | University maintenance and service request system |
| Version | 1.0 |
| Status | As implemented |
| Date | 3 November 2026 |
| Course | MIT 8333 — Advanced Web Application Development |
| Audience | A reader who needs to understand every user-facing flow and what each feature does |

This document describes the product that is in the repository and the deployed application. It does not describe work that has not been built.

**Live addresses (as recorded in the project report):**

| Service | Address |
|---------|---------|
| Frontend | https://resolva-1u28.onrender.com |
| API | https://university-maintenance-project.onrender.com |
| Health check | https://university-maintenance-project.onrender.com/api/health |
| API explorer | https://university-maintenance-project.onrender.com/api/docs |
| Source | https://github.com/dremmaokoh/university_maintenance_project |

The browser uses hash routes, so a person opens pages such as `https://resolva-1u28.onrender.com/#/login`.

## 2. Purpose of this document

This Product Requirements Document states what Resolva does for each kind of user, the rules the server enforces, and the outcomes a person sees when an action succeeds or fails.

It is the reference for the implemented product: screens, permissions, status rules, and the data the system keeps. Where a screen and the API disagree, the document says so. Where a behaviour is only for local development, the document says so.

## 3. Product overview

Universities often receive maintenance complaints by phone, paper form, messaging apps, or a visit to an estates office. Those channels make it hard to see who owns a job, what the current status is, and whether the work was finished.

Resolva gives each organisation one place to submit, assign, and track maintenance requests. A student or a member of staff reports an issue. An administrator assigns the request to a maintenance officer. The officer moves the work forward. The person who submitted the request can follow the same ticket until it is completed, and can leave a star rating afterwards.

Each organisation has its own users, categories, and requests. A person in one organisation cannot see another organisation’s data.

Success, for this product, means:

- A new organisation can be created with a first administrator.
- Students and staff can register only through that organisation’s link and can submit and track their own requests.
- Administrators can invite officers and other administrators, assign work, and see organisation-wide activity.
- Officers can see only the jobs assigned to them and can move those jobs along the allowed status path.
- Every important permission is enforced on the server, not only in the browser.
- Evidence can be attached to a request and is stored in Cloudinary when that upload succeeds, with the server disk used only if Cloudinary fails.

## 4. Goals and out of scope

### 4.1 Goals

1. Let students and staff submit a request with a title, description, location, category, and an optional evidence file.
2. Let administrators share a registration link, invite maintenance officers and other administrators, and assign or cancel an assignment.
3. Let officers see only requests assigned to them and move status along a fixed path: pending, then assigned, then in progress, then completed.
4. Keep a status history, comments, and an optional rating of one to five stars after completion.
5. Keep all data scoped to one organisation.
6. Provide a REST API, automated tests, and an online deployment.

### 4.2 Out of scope

The following are not part of the product:

- Artificial intelligence, chatbots, or automatic diagnosis of a fault.
- Payments, invoices, or parts ordering.
- Email, SMS, or push notifications. Invitation links and password-reset links are copied in the browser. The application does not send mail.
- Extra roles beyond student/staff, maintenance officer, and administrator.
- A separate reports page. The path `/reports` opens the administrator overview.
- Editing or deleting a category from the Categories screen. Those two actions exist on the API for administrators only.
- A screen that lists historical assignment records. The API can list them; the interface shows the current officer on the request.
- A button in the interface to delete a request. Deletion exists on the API for administrators only.

## 5. Users and roles

Resolva has three permission roles. Students and staff share the stored role `student`. The field `memberType` is either `student` or `staff` and is a label, not a separate permission. Both member types can submit requests and can see only their own requests.

| Role in the product | Stored role | What the server allows |
|---------------------|-------------|------------------------|
| Student or staff | `student`, with `memberType` `student` or `staff` | Register through an organisation link. Sign in. Create a request for their own organisation. List, open, and comment on their own requests only. Upload evidence when creating a request. Rate the assigned officer once, with 1–5 stars, after the request is completed. They cannot assign work, change status, manage categories, invite people, or open another person’s request. |
| Maintenance officer | `officer` | Sign in after accepting an invite. List and open only requests assigned to them. Comment on those requests. Move status from `assigned` to `in_progress`, and from `in_progress` to `completed`. View and add categories. Export the requests they can see as CSV. They cannot create a student request, assign or unassign work, manage team accounts, or open a request that is not assigned to them. |
| Administrator | `admin` | Create the organisation (first administrator) or join later by invite. See every request in the organisation. Assign an active officer while the request is `pending`. Cancel that assignment while the status is still `assigned`. Change status through the API along the allowed path (the request screen shows the status buttons to the assigned officer). Delete a request through the API. Manage team accounts in the organisation: invite, disable, reactivate, edit name, role, and job title, with the limits in FR-09. View and add categories. Update or delete a category through the API. See the overview, charts, and people directories. Export requests and people as CSV. |

A signed-in user is always tied to one organisation. The token carries that organisation, and the server rejects the token if the account’s organisation no longer matches.

### 5.1 Status values

| Stored status | Meaning on screen | How it is reached | What can happen next |
|---------------|-------------------|-------------------|----------------------|
| `pending` | Pending | Set when the request is submitted. Also set when an administrator cancels an assignment. | An administrator assigns an active officer, which moves the request to `assigned`. |
| `assigned` | Assigned | Set when an administrator assigns an officer. | The assigned officer (or an administrator, through the API) moves it to `in_progress`. An administrator may cancel the assignment, which returns it to `pending`. |
| `in_progress` | In progress | Set by a status update from `assigned`. | The assigned officer (or an administrator, through the API) moves it to `completed`. The assignment can no longer be cancelled. |
| `completed` | Completed | Set by a status update from `in_progress`. The completion time is stored. | No further status change. The requester may rate the officer once. |

Skipping a step is rejected. A change from `pending` straight to `completed` returns “Cannot change status from pending to completed.”

## 6. End-to-end flows

Routes below are the paths inside the app. On the live site they appear after `/#`, for example `/#/login`.

### 6.1 Set up an organisation and the first administrator

- **Actor:** A person creating a campus or department on Resolva.
- **Start:** The public home page (`/`).
- **Steps:**
  1. The visitor opens the home page and chooses **Set Up Your Organisation**, which opens `/admin/register` in a new tab.
  2. They enter the organisation name, their full name, email, and a password of at least 8 characters.
  3. The browser calls `POST /api/auth/setup-admin`.
  4. The server creates the organisation, a unique slug from the name, the administrator account, and six starter categories: Electrical, Plumbing, Air conditioning & heating, Internet & Wi‑Fi, Furniture & fixtures, and Other.
  5. The server returns a JWT. The browser stores it and opens the overview.
- **Result:** The person is signed in as the administrator of a new organisation. The same email cannot create a second organisation. If that email was already used, the API responds that the email has already been used and asks them to log in. If an organisation record exists for that email but the password was never saved, submitting the form again can finish that account instead of creating a second organisation.

### 6.2 Register as a student or a member of staff

- **Actor:** A student or a member of staff who has the organisation’s registration link.
- **Start:** `/o/{slug}/register`, usually copied from Team & Access.
- **Steps:**
  1. The page loads the organisation name from `GET /api/organisations/{slug}`. An unknown slug shows that the organisation link is invalid.
  2. The person enters full name, email, password (at least 8 characters), and chooses Staff or Student.
  3. The browser checks empty fields and password length before sending the form.
  4. The server creates a user with role `student` and `memberType` `staff` or `student`, in that organisation only, and returns a JWT.
  5. The person is signed in and is taken to My Requests (`/requests`). The overview route redirects students and staff away from the administrator dashboard.
- **Result:** The person has an active requester account and can submit requests. If the email already exists in that organisation, registration fails with a conflict message. There is no open “register” page that is not tied to an organisation slug. `/register` and `/student/register` return the visitor to the home page.

### 6.3 Sign in (administrators, officers, and anyone using the main login)

- **Actor:** An administrator, a maintenance officer, or a requester who uses the main login.
- **Start:** `/login`, linked from the home page as staff and team sign-in.
- **Steps:**
  1. The person enters email and password.
  2. The server looks up active accounts with that email. A disabled account is rejected. An invite that has not been accepted tells the person to open the invite link and set a password. A wrong password is rejected. An unknown email is rejected.
  3. If the email is active in more than one organisation, the API does not sign them in yet. It returns a list of accounts. The screen asks them to choose an organisation, then signs in to that account.
  4. On success the browser stores the JWT and opens `/dashboard`. Students and officers are immediately redirected to `/requests`. Administrators stay on the overview.
- **Result:** The person is in the correct home screen for their role. The submit button stays disabled while the request is in progress. A failed sign-in shows the API message on the form.

### 6.4 Sign in through the organisation link

- **Actor:** A student or member of staff using their organisation’s login link. Administrators and officers can also use this page if they sign in with that organisation’s slug.
- **Start:** `/o/{slug}/login`.
- **Steps:**
  1. The page loads the organisation name. An unknown slug shows an invalid-link message.
  2. The person enters email and password. The login call includes the organisation slug, so the server looks only inside that organisation.
  3. Success opens `/dashboard`, which then redirects a requester or an officer to `/requests`.
  4. Forgot password on this page is `/o/{slug}/login/forgot`, which limits the reset to that organisation.
- **Result:** The person is signed in to that organisation only. This path does not show the multi-organisation account picker, because the slug already chooses the organisation.

### 6.5 Reset a forgotten password

- **Actor:** Any person with an active account.
- **Start:** Forgot password from `/login/forgot` or from the organisation login.
- **Steps:**
  1. The person enters their email.
  2. If the email matches more than one organisation and no organisation was chosen, the screen asks them to pick an account.
  3. The server creates a reset token that expires in 24 hours and returns a path such as `/reset-password/{token}`. The screen shows a full link and a control to copy it. No email is sent.
  4. The person opens the link, sees their name and organisation if the token is still valid, and sets a new password of at least 8 characters.
  5. The server replaces the password hash, clears the token, and signs them in.
- **Result:** The person has a new password and a new session. An unknown email returns “Incorrect or invalid email.” A used or unknown token returns that the link is invalid or already used. An expired token returns that it has expired and that they should request a new one.

### 6.6 Invite an administrator or a maintenance officer

- **Actor:** An administrator.
- **Start:** Team & Access (`/admin/invites`), Team tab, **Invite a team member**.
- **Steps:**
  1. The administrator enters full name, email, role (administrator or maintenance officer), and a job title. The job title is required for a maintenance officer and optional for an administrator.
  2. The browser sends `POST /api/invites` with the job title.
  3. On success the API stores the job title on the pending account and returns an invite token. The screen shows a copyable link to `/invite/{token}`. The link lasts for 7 days unless `INVITE_EXPIRY_DAYS` is set to another number. The new user has no password until they accept.
- **Result:** The administrator can copy the link and give it to the person. The product does not email the link. An officer invite without a job title is refused. If that email already has an account in the organisation, the API returns a conflict. Officers created before this rule was enforced can stay without a title until an administrator adds one on the team profile.

### 6.7 Accept an invitation

- **Actor:** The invited administrator or officer.
- **Start:** `/invite/{token}`.
- **Steps:**
  1. The page loads a preview: name, email, role, and organisation.
  2. The person sets a password of at least 8 characters.
  3. The server hashes the password, marks the account active, clears the invite token, and returns a JWT.
- **Result:** The person is signed in and can use `/login` afterwards. An invalid or already used link returns that the invite is invalid or has already been used. An expired link returns that it has expired and that they should ask an administrator for a new one. Until the password is set, a login attempt explains that the officer account is not active yet and that they must open the invite link.

### 6.8 Share the registration link and manage requesters

- **Actor:** An administrator.
- **Start:** Team & Access, Staff & Students tab.
- **Steps:**
  1. The administrator opens **Share registration link**. The modal shows the organisation URL `/o/{slug}/register` and a control to copy it.
  2. They can search the directory, filter by Staff or Student and by active or inactive, sort by name or date joined, and move between pages.
  3. They can disable or reactivate a requester account after a confirmation dialog.
  4. They can download the filtered directory as a CSV file.
- **Result:** New students and staff can register only with that link. A disabled account cannot sign in. The administrator cannot disable their own account.

### 6.9 Create a maintenance request

- **Actor:** A student or a member of staff (role `student`).
- **Start:** **New Request** (`/requests/new`).
- **Steps:**
  1. The form asks for title, description, location, and a category from the organisation’s list. Evidence is optional.
  2. If a file is chosen, the browser rejects anything larger than 5 MB before upload. Allowed types are JPEG, PNG, GIF, WebP, and PDF.
  3. The server checks that the category belongs to the same organisation, stores the request as `pending`, and writes a status-history row with the note “Request submitted”.
  4. If a file was included, the server tries Cloudinary first. If that upload fails, it saves the file on the server disk and records which provider was used.
- **Result:** The person can open the new request from My Requests and follow its status. An administrator or an officer who calls the create endpoint receives “Only students can submit requests.” A missing title, description, location, or category is rejected. A category from another organisation is rejected.

### 6.10 View and track one’s own requests

- **Actor:** The student or staff member who submitted the work.
- **Start:** **My Requests** (`/requests`).
- **Steps:**
  1. The list shows only that person’s requests. Summary cards filter by all, pending, in progress, or completed.
  2. They can search title, description, or location, filter by status and category, and change sort order between newest and oldest. The list is paged, 10 rows by default, up to 50.
  3. They open a row to see the description, location, category, officer, status badge, evidence, status history, and comments they are allowed to see.
  4. They can add a comment. Staff replies appear to them only when the reply mentions them by name, or contains the older `@student` marker.
- **Result:** The person can see progress without seeing anyone else’s tickets. Opening another person’s request in the same organisation returns “You can only view your own requests.” A request in another organisation is treated as not found. An empty list offers a link to create a request. A failed load offers **Try again**.

### 6.11 Officer sees assigned work and updates status

- **Actor:** A maintenance officer.
- **Start:** **My Work** (`/requests`). Officers do not see New Request or the administrator overview.
- **Steps:**
  1. The list contains only requests whose assigned officer is this user. Cards show total assigned, assigned (not yet started), in progress, and completed.
  2. Search, filters, pagination, and CSV export work on that same set.
  3. On the request, the officer sees the requester, location, description, evidence, and history.
  4. While the status is `assigned`, the screen offers **Mark in progress**. While it is `in_progress`, it offers **Mark completed**. An optional progress note is stored on the history row.
  5. Completing the request stores the completion time. The list then shows a time-to-fix value, such as `45m`, `2h 10m`, or `3 days`.
- **Result:** The officer’s queue matches their assignments. They cannot open an unassigned request or another officer’s request. They cannot assign work. The status buttons do not appear for a job that is still pending or already completed.

### 6.12 Administrator assigns work and manages users

- **Actor:** An administrator.
- **Start:** Overview (`/dashboard`), All requests (`/requests`), or a request detail page, plus Team & Access.
- **Steps:**
  1. On the overview they see totals for all, pending, in progress, and completed requests, a “Needs attention” list of pending and assigned items, recent requests, and pie charts of status and category.
  2. On a pending request with no officer, they choose an active officer from their organisation and assign them. The status becomes `assigned`, an assignment record is stored, and the history note names the officer.
  3. While the status is still `assigned`, they can cancel the assignment. The officer is cleared and the status returns to `pending`.
  4. On Team & Access they invite colleagues (see flow 6.6), open a team profile, edit name, role, and job title, and disable or reactivate accounts.
- **Result:** Work is owned by one officer at a time. Assignment is refused if the request is already assigned or has moved past `pending`. Cancellation is refused after work has started. The organisation must keep at least one active administrator. An administrator cannot change their own role or disable their own account. Requester accounts cannot be turned into officers from this screen.

### 6.13 Upload and view evidence

- **Actor:** The requester uploads at creation time. Anyone who is allowed to open the request can view the file.
- **Start:** The evidence field on New Request, then the evidence block on the request.
- **Steps:**
  1. The file is sent with the create request as multipart field `evidence`.
  2. The request stores the original file name, storage key, provider (`cloudinary` or `local`), type, size, and upload time.
  3. On the detail page the evidence block shows the file name and a badge: **Cloudinary** or **Server disk (local)**.
  4. Opening the file calls `GET /api/requests/{id}/evidence`, which checks the same access rules as the request itself and returns the file inline.
- **Result:** The file is visible to the requester, the assigned officer, and administrators in that organisation. If Cloudinary fails, the badge shows local disk. On Render, the server disk is wiped on restart, so a file that fell back to local storage can later be reported as missing. Production is expected to use Cloudinary.

### 6.14 Search, filter, and pagination

- **Actor:** Any signed-in user on the request list. Administrators also filter the people directory.
- **Start:** `/requests`, or Team & Access for people.
- **Steps:**
  1. The person types a search, chooses a status and, on requests, a category, and chooses ascending or descending date order.
  2. Changing a status card or the status dropdown updates the page address, for example `/requests?status=pending`.
  3. The API applies those filters only inside the user’s visibility: own requests, assigned requests, or the whole organisation.
  4. Previous and Next appear when there is more than one page.
- **Result:** The list matches the filters. If nothing matches, the screen says no requests match and offers **Clear filters**. Search matches title, description, or location, without case sensitivity.

### 6.15 Reports

- **Actor:** An administrator. Officers have workload counts on My Work, not the organisation report.
- **Start:** Overview (`/dashboard`). There is no separate reports screen.
- **Steps:**
  1. The overview loads role-scoped counts from `GET /api/dashboard/overview`. For an administrator those counts cover the organisation.
  2. The same page loads `GET /api/reports/summary`, which returns the total and counts by status and by category.
  3. Two pie charts draw that breakdown. A short note points to All requests for a detailed export.
- **Result:** The administrator can see where work sits without leaving the overview. If the summary fails to load, an error toast is shown. Students and officers never land on this page; if they open `/dashboard` they are sent to their request list. The summary endpoint itself rejects anyone who is not an administrator.

### 6.16 Log out and inactivity logout

- **Actor:** Any signed-in user.
- **Start:** The **Log out** button in the sidebar, or 10 minutes without activity.
- **Steps:**
  1. **Log out** clears the token from the browser. A student or staff member returns to `/o/{slug}/login`. An administrator or officer returns to `/login`.
  2. While someone is signed in, the app watches mouse movement, mouse buttons, key presses, touch, click, wheel, and scroll. Each of those events resets a 10-minute timer.
  3. When the timer ends, the app clears the token, shows “Signed out after 10 minutes of inactivity.”, and sends the person to the same login path as a manual log out.
- **Result:** The browser session ends. This logout is enforced in the browser. The JWT is not revoked on the server; it remains valid until it expires (1 day by default) if it is still held elsewhere. A later visit with no stored token is sent to login when a protected page is opened.

## 7. Feature catalogue

### 7.1 Accounts and access

#### FR-01 Public home page

- **Who uses it:** Anyone who is not signed in.
- **What it does:** Introduces Resolva as a single queue for campus maintenance, explains that administrators assign officers and that people can follow status, and offers **Set Up Your Organisation** and a sign-in link. The page includes a static preview of a dashboard and a request; those previews are illustrations, not live data.
- **Screens:** `/`.
- **Rules:** A person who already has a session is sent to `/dashboard` (and then to `/requests` if they are a student or officer).
- **Success:** The visitor can start organisation setup or go to login.
- **Failure:** Unknown paths redirect to the home page.

#### FR-02 Organisation setup and first administrator

- **Who uses it:** The first administrator of an organisation.
- **What it does:** Creates the organisation and an active administrator in one step, signs that person in, and seeds the six preset categories.
- **Screens and API:** `/admin/register`. `GET /api/auth/can-create-organisation` reports whether an email may create an organisation. `POST /api/auth/setup-admin` creates the records.
- **Rules:** Organisation name, full name, a valid email, and a password of at least 8 characters are required. The creator email is unique across organisations. The organisation slug is unique. Passwords are hashed with bcrypt (10 salt rounds) and are never stored in plaintext.
- **Success:** HTTP 201 with a user and a JWT. The overview opens.
- **Failure:** Validation errors return HTTP 400 with a message and an `errors` list of field and message. A repeat creator email returns HTTP 409.

#### FR-03 Student and staff registration

- **Who uses it:** Students and staff with a registration link.
- **What it does:** Creates a requester account inside one organisation and signs the person in.
- **Screens and API:** `/o/{slug}/register`. `POST /api/auth/register` with `orgSlug`, `fullName`, `email`, `password`, and `memberType`.
- **Rules:** `memberType` must be `student` or `staff`. The stored role is always `student`. Email is unique per organisation, so the same email may exist in a different organisation. The browser validates the form before submit and disables the button while the request is in flight.
- **Success:** HTTP 201, session stored, My Requests opens, and a success toast is shown.
- **Failure:** Unknown organisation returns HTTP 404. A duplicate email in that organisation returns HTTP 409. A short password returns HTTP 400.

#### FR-04 Sign-in

- **Who uses it:** Administrators, officers, and anyone using `/login`.
- **What it does:** Checks email and password and issues a JWT. If one email is active in several organisations, it asks the person to choose an account before issuing the token.
- **Screens and API:** `/login`. `POST /api/auth/login`. After login, `GET /api/auth/me` reloads the current user.
- **Rules:** The account must be active, not pending, and must have a password. The JWT includes the user and the organisation. On each protected call the server loads the user again and rejects the token if the user is inactive, not active, or in a different organisation. Default token lifetime is one day (`JWT_EXPIRES_IN`). The browser stores only the token, under the key `um_token` in local storage. It does not store the password.
- **Success:** The session is saved and the role home screen opens. The button label shows that sign-in is in progress and the button is disabled.
- **Failure:** Wrong password: “Incorrect password.” Unknown email: “Incorrect or invalid email.” Disabled account: the person is told the account has been disabled and to contact an administrator. Pending invite: they are told to open the invite link. Expired token on a later call: “Your session has expired. Please log in again.” Missing token: “Please log in to continue.”

#### FR-05 Organisation sign-in

- **Who uses it:** People who were given `/o/{slug}/login`, mainly students and staff.
- **What it does:** The same password check as FR-04, limited to one organisation slug, so the account picker is not used.
- **Screens and API:** `/o/{slug}/login` and `GET /api/organisations/{slug}` for the public name.
- **Rules:** The slug must exist. Login sends `orgSlug` with the email and password.
- **Success:** Session starts and the role home screen opens.
- **Failure:** Unknown slug: “Invalid organisation link.” Other failures use the same messages as FR-04.

#### FR-06 Password reset

- **Who uses it:** Anyone who has forgotten a password.
- **What it does:** Creates a one-time link the person must copy. Opening the link sets a new password and signs them in. The app does not send email.
- **Screens and API:** `/login/forgot`, `/o/{slug}/login/forgot`, `/reset-password/{token}`. `POST /api/auth/forgot-password`, `GET` and `POST /api/auth/reset-password/{token}`.
- **Rules:** The link expires after 24 hours. Several organisations for one email require an account choice unless the organisation slug was already in the request. The new password must be at least 8 characters.
- **Success:** The screen shows the link and a copy confirmation. Completing the reset signs the person in.
- **Failure:** Unknown email returns HTTP 404 with “Incorrect or invalid email.” This reset flow tells the caller when the email is not found. Invalid, used, or expired tokens return HTTP 404 or HTTP 410 with the messages in flow 6.5.

#### FR-07 Team invitations

- **Who uses it:** Administrators.
- **What it does:** Creates a pending administrator or officer and returns a link the administrator copies. The invitee is not emailed.
- **Screens and API:** Invite modal on `/admin/invites`. `POST /api/invites` (administrator only).
- **Rules:** Role must be `admin` or `officer`. Email must be new inside the organisation. A job title is required for a new officer, optional for an administrator, and at most 80 characters. The route stores the title that the form sends. Default expiry is 7 days. Existing officers who were created before this rule are not blocked; an administrator adds their title from the team profile.
- **Success:** HTTP 201 with `invitePath` `/invite/{token}` and the stored job title. The modal shows the full link to copy. The pending person appears in the team list.
- **Failure:** Duplicate email returns HTTP 409. A non-administrator receives HTTP 403, “You do not have permission to do that.” An officer invite with no job title returns HTTP 400, “Job title is required for maintenance officers.” See flow 6.6.

#### FR-08 Accept an invitation

- **Who uses it:** The invited administrator or officer.
- **What it does:** Shows who the invite is for and lets them choose a password. The account becomes active and they are signed in.
- **Screens and API:** `/invite/{token}`. `GET /api/invites/{token}` and `POST /api/invites/{token}/accept`.
- **Rules:** The token must match a pending user and must not be expired. Password length is at least 8 characters. The token is cleared after success and cannot be reused.
- **Success:** The person has an active account and a session.
- **Failure:** Invalid or used link: HTTP 404. Expired link: HTTP 410.

#### FR-09 Team directory and profile

- **Who uses it:** Administrators.
- **What it does:** Lists administrators and officers, shows counts, exports them as CSV, and opens a profile. The profile can change full name, role (administrator or officer), and job title. The team list can disable or reactivate an account. For an officer, the profile includes rating information and performance figures for completed work (count and average time to resolve).
- **Screens and API:** Team tab on `/admin/invites`. `GET /api/users`, `GET /api/users/team/stats`, `GET /api/users/team/export`, `GET /api/users/{id}/profile`, `PATCH /api/users/{id}`.
- **Rules:** All of these routes require an administrator and stay inside the administrator’s organisation. Requester roles cannot be changed here. An administrator cannot change their own role or disable themselves. Demoting or disabling the last active administrator is refused. An officer must keep a job title. Email and date joined are not edited in the profile modal.
- **Success:** The list and profile update, and a success toast confirms the save or the status change.
- **Failure:** A user outside the organisation returns HTTP 404. Rule breaks return HTTP 400 with the specific sentence (for example, “Your organisation must have at least one active administrator.”).

#### FR-10 Staff and student directory

- **Who uses it:** Administrators.
- **What it does:** Lists requester accounts with search, member type, active or inactive, sort, and pagination. The administrator can copy the registration link, disable or reactivate a person, and download a CSV of the current filter.
- **Screens and API:** Staff & Students tab. `GET /api/users/members`, `GET /api/users/members/stats`, `GET /api/users/members/export`, and `PATCH /api/users/{id}` for `isActive`. `GET /api/organisations/{slug}` is public and is what the registration page uses.
- **Rules:** Page size is between 1 and 50. Search, `memberType` (`student` or `staff`), and status (`active` or `inactive`) are optional. This directory does not change a requester into an officer.
- **Success:** The table, stats, and CSV match the filter. The registration link copies to the clipboard.
- **Failure:** A failed load shows an error toast. Validation failures return HTTP 400.

#### FR-11 Log out and inactivity logout

- **Who uses it:** Every signed-in user.
- **What it does:** **Log out** drops the token immediately. With no mouse, keyboard, touch, scroll, or click for 10 minutes, the app signs the person out and explains why.
- **Screens:** Sidebar **Log out**, and the inactivity watcher mounted for the whole app.
- **Rules:** Students and staff return to their organisation login. Administrators and officers return to `/login`. The timer exists only in the browser.
- **Success:** The login page is shown and the success toast confirms inactivity logout when that was the cause.
- **Failure:** There is no separate error state. If the token later expires on the server, the next API call asks the person to log in again.

### 7.2 Categories and requests

#### FR-12 Categories

- **Who uses it:** Administrators and officers can open the screen and add categories. Any signed-in user can read the list when submitting or filtering requests. Updating or deleting a category is administrator-only on the API.
- **What it does:** Lists issue types for the organisation, with “Other” sorted last. Suggested presets that are not already present can be added in one click. A custom category needs a name and may have a description.
- **Screens and API:** `/categories`. `GET /api/categories`, `GET /api/categories/suggested`, `POST /api/categories`. `PATCH` and `DELETE /api/categories/{id}` are administrator-only and are not shown as buttons on the screen.
- **Rules:** Category names are unique per organisation, compared without case sensitivity. New organisations already have the six presets. Suggested presets are the same six names that are still missing. Deleting a category through the API does not check whether requests still use it. A report row whose category was removed is labelled “Uncategorised”.
- **Success:** “Category added.” or “{name} added.” The table refreshes.
- **Failure:** A duplicate name returns HTTP 409, “A category with this name already exists.” A student who calls the create endpoint receives HTTP 403. A missing category on update or delete returns HTTP 404.

#### FR-13 Submit a request

- **Who uses it:** Students and staff.
- **What it does:** Records a maintenance ticket in the person’s organisation, optionally with one evidence file, and starts the status history.
- **Screens and API:** `/requests/new`. `POST /api/requests` as JSON or as multipart with `evidence`. Officers and administrators are blocked from this route in the browser and on the server.
- **Rules:** Title, description, location, and a category id in the same organisation are required. Initial status is `pending`. The requester is the signed-in user. One optional file, at most 5 MB, of type JPEG, PNG, GIF, WebP, or PDF. The submit button is disabled while the request is sending.
- **Success:** HTTP 201 and the person can track the request from My Requests. The form explains that status updates will be available there.
- **Failure:** Validation messages name the missing field. A bad category returns “Please choose a valid category.” A file that is too large returns “File is too large. Maximum size is 5 MB.” A disallowed type names the allowed types. The form shows the API error and leaves the person on the page.

#### FR-14 Request list, search, filter, and pagination

- **Who uses it:** Every signed-in role, with a different set of rows.
- **What it does:** Shows My Requests, My Work, or All requests. Cards act as status filters. A toolbar searches and filters. Administrators and officers can download the filtered rows as CSV (at most 2,000 rows). Officers also see workload counts.
- **Screens and API:** `/requests`. `GET /api/requests` with `page`, `limit`, `status`, `category`, `search`, and `order`. `GET /api/requests/export` for administrators and officers. `GET /api/requests/work/stats` for officers.
- **Rules:** Students see `requester` equal to themselves. Officers see `assignedOfficer` equal to themselves. Administrators see the organisation. Default page size is 10 and the maximum is 50. Sort is by creation time. Search is a case-insensitive match on title, description, or location. Officer “pending” in the workload API is the count of `assigned` jobs, which matches the “not yet started” card.
- **Success:** The table shows title, location, category, status, date, time to fix, and rating. Administrators also see the requester and member type. Students and officers have a View action. Pagination reads “Page n of m”. CSV download shows “CSV downloaded.”
- **Failure:** The empty state explains whether the list is empty or the filters removed every row. A load error offers **Try again**. An invalid status or category query returns HTTP 400. Export or stats called by the wrong role returns HTTP 403.

#### FR-15 Request detail

- **Who uses it:** The requester, the assigned officer, and administrators in the same organisation.
- **What it does:** Shows the title, status, category, location, description, requester (with Staff or Student), officer (name and job title when present), time to resolve when completed, rating when one exists, evidence, history, and comments. It hosts assign, cancel, status update, rating, and comments, each gated as in the later features.
- **Screens and API:** `/requests/{id}`. `GET /api/requests/{id}`.
- **Rules:** A different organisation returns HTTP 404, “Request not found.” A student who is not the requester, or an officer who is not assigned, receives HTTP 403 with a sentence that states the limit. The id must be a valid MongoDB id.
- **Success:** The page renders the ticket and the actions that role may take.
- **Failure:** The screen says the request was not found and links back to My Requests, My Work, or the admin list. The API message also appears in a toast.

#### FR-16 Status history

- **Who uses it:** Anyone who can open the request.
- **What it does:** Lists every status row from submission onward: status, note, actor name and role, and time. The list is oldest first.
- **Screens and API:** The Status history section. `GET /api/requests/{id}/history`.
- **Rules:** The same access check as the request. Notes are written by the system on submit, assign, and cancel, and by the officer when they add a progress note. The section states that it is visible to the requester, the officer, and administrators.
- **Success:** Each change appears as a badge, a note, and the actor.
- **Failure:** If the request cannot be opened, the history is not returned. An empty history says “No status changes yet.”

#### FR-17 Comments

- **Who uses it:** The requester, the assigned officer, and administrators who can open the request.
- **What it does:** Adds a comment and lists the comments that person is allowed to read.
- **Screens and API:** Comments on the request. `GET` and `POST /api/requests/{id}/comments`.
- **Rules:** The comment body cannot be empty. Administrators and officers see every comment and a badge that says whether a staff comment was shared with the requester or is staff only. A requester sees their own comments, plus staff comments that contain `@` followed by the requester’s full name, or the older marker `@student`. Other staff comments stay hidden from the requester. A comment written by the requester is not marked visible back to them by that name rule; they still see it because they wrote it. The composer tells each side these rules in plain language. Typing `@` as staff inserts `@` plus the requester’s name.
- **Success:** “Comment posted.” The new comment appears in the list.
- **Failure:** An empty comment is blocked in the form. The wrong person receives “You can only comment on your own requests.” or “You can only comment on requests assigned to you.”

#### FR-18 Evidence

- **Who uses it:** The requester attaches a file when creating a request. Viewers are anyone who may open that request.
- **What it does:** Stores one file per request and shows which storage provider holds it. The file can be opened in the browser.
- **Screens and API:** Evidence field on create, evidence block on detail. Upload is part of `POST /api/requests`. Download is `GET /api/requests/{id}/evidence`.
- **Rules:** Optional. Maximum 5 MB. JPEG, PNG, GIF, WebP, or PDF. Cloudinary is attempted first, in a folder `resolva/evidence/{organisationId}`. If Cloudinary throws, including a 403 when the key cannot upload, the file is written under the server `uploads/evidence` directory and `storageProvider` is `local`. The badge text is “Cloudinary” or “Server disk (local)”. Local files on Render do not survive a restart or a new deploy. Deleting a request also deletes its evidence when the provider can be reached.
- **Success:** The badge and file name appear, and the file opens inline with the original name.
- **Failure:** Size and type errors are described in FR-13. A request with no file returns “No evidence file for this request.” A missing stored object returns “Evidence file is missing.”

#### FR-19 Assign an officer

- **Who uses it:** Administrators.
- **What it does:** Chooses one active maintenance officer in the same organisation and makes them the owner of a pending request.
- **Screens and API:** Assign officer on the request detail page. `POST /api/requests/{id}/assign` with `officerId`. The dropdown is filled from `GET /api/users/officers`, which returns active officers only, with average rating attached for display.
- **Rules:** The request must be `pending` and must not already have an officer. The officer must be active, in this organisation, and have role `officer`. Only one officer is assigned at a time. The status becomes `assigned`. An assignment document records the request, the officer, and the administrator. A history note reads “Assigned to {name}”.
- **Success:** Toast “Officer assigned.” The page shows the officer and the cancel control.
- **Failure:** Already assigned or no longer pending: the API explains that the current assignment must be cancelled before assigning again, or that an officer is already assigned. An invalid officer: “Please choose an active maintenance officer from your organisation.” An officer or student who calls assign receives HTTP 403.

#### FR-20 Cancel an assignment

- **Who uses it:** Administrators.
- **What it does:** Removes the officer and returns the request to `pending`, so another officer can be chosen.
- **Screens and API:** **Cancel assignment** on the detail page while status is `assigned`. `POST /api/requests/{id}/unassign`.
- **Rules:** Cancellation is allowed only while the status is `assigned`. After `in_progress` or `completed` it is refused. A history note records “Assignment to {name} cancelled”. The earlier assignment document is left in the database; the request’s current officer is cleared. `GET /api/assignments` lists assignment rows for the organisation for an administrator, and the interface does not have a separate assignments screen.
- **Success:** Toast “Assignment cancelled. You can assign another officer.” The assign form is shown again.
- **Failure:** No officer: “This request has no assigned officer.” Work already started: “Assignment can only be cancelled before work has started (while status is assigned).”

#### FR-21 Update status

- **Who uses it:** The assigned officer, from the screen. An administrator may call the same API. Students cannot.
- **What it does:** Moves the request one step forward and stores a history row. On completion it stores `completedAt`.
- **Screens and API:** **Mark in progress** and **Mark completed**, with an optional progress note. `PATCH /api/requests/{id}/status` with `status` and optional `note`.
- **Rules:** Allowed pairs are only pending → assigned, assigned → in_progress, and in_progress → completed. Completed has no next status. The screen does not offer pending → assigned; that step is FR-19. The screen shows the buttons only to the assigned officer, so an administrator changes status through the API if they need to, not through those buttons. An officer can update only their own assignment.
- **Success:** Toast “Status updated.” The badge and history refresh. Time to resolve appears once the request is completed.
- **Failure:** An illegal jump returns “Cannot change status from {current} to {next}.” An officer updating someone else’s request receives “You can only update requests assigned to you.”

#### FR-22 Rate completed work

- **Who uses it:** The student or staff member who owns the request.
- **What it does:** Records one rating of 1 to 5 stars for the assigned officer after the work is completed.
- **Screens and API:** “Rate your maintenance officer” on the detail page. `POST /api/requests/{id}/rating` with `stars`.
- **Rules:** The caller must be the requester, the status must be `completed`, an officer must be assigned, and no rating may exist yet. The list and the detail page show the stars after that. Officer profiles use these ratings.
- **Success:** HTTP 201 and the toast “Thank you for your rating.”
- **Failure:** Too early, no officer, or a repeat rating returns HTTP 400 or HTTP 409 with a sentence that states the reason. A rating outside 1–5 fails validation.

#### FR-23 Delete a request

- **Who uses it:** Administrators, through the API. The request screen does not offer delete.
- **What it does:** Removes the request, its evidence, assignment rows, status history, and comments.
- **API:** `DELETE /api/requests/{id}`.
- **Rules:** The request must belong to the administrator’s organisation. Other roles receive HTTP 403.
- **Success:** `{ success: true, message: "Request deleted." }`.
- **Failure:** Unknown id or another organisation: HTTP 404. A person who is not an administrator: HTTP 403.

### 7.3 Reporting and exports

#### FR-24 Administrator overview

- **Who uses it:** Administrators. The API accepts any signed-in user and scopes the numbers, but students and officers are redirected to `/requests` before this page renders.
- **What it does:** Greets the administrator by first name and shows total, pending, in progress, and completed counts. Each card links to the matching request list. “Needs attention” lists up to six pending or assigned requests from the first page of results. “Recent requests” lists up to six latest requests.
- **Screens and API:** `/dashboard`. `GET /api/dashboard/overview`. The needs-attention table uses `GET /api/requests`.
- **Rules:** Counts use the same visibility as the request list. For an administrator that is the whole organisation. `/reports` redirects here.
- **Success:** Cards, tables, and links render. Empty sections explain that new work will appear there.
- **Failure:** A failed overview shows an error toast and does not invent numbers.

#### FR-25 Request breakdown

- **Who uses it:** Administrators.
- **What it does:** Summarises how many requests sit in each status and each category, and draws two pie charts on the overview.
- **Screens and API:** Request breakdown on `/dashboard`. `GET /api/reports/summary`.
- **Rules:** Administrator only, current organisation only. A missing category name is shown as “Uncategorised”.
- **Success:** The charts match the summary payload, including a total.
- **Failure:** A non-administrator receives HTTP 403. A load error shows a toast. The page tells the reader to export the detailed list from All requests.

#### FR-26 CSV export

- **Who uses it:** Administrators and officers for requests. Administrators for team members and for staff and students.
- **What it does:** Downloads a CSV built in the browser from the JSON export endpoints, using the same filters as the list on screen.
- **Screens and API:** **Download CSV** on the request list and on both Team & Access tabs. `GET /api/requests/export`, `GET /api/users/team/export`, `GET /api/users/members/export`.
- **Rules:** Request export is capped at 2,000 rows and follows the caller’s visibility and filters. Students do not see the request export button and are rejected if they call the endpoint. The button reads “Exporting…” while the file is prepared.
- **Success:** The browser downloads the file and a toast says “CSV downloaded.”
- **Failure:** The API error is shown in a toast and the button returns to “Download CSV”.

#### FR-27 Officer workload summary

- **Who uses it:** Maintenance officers.
- **What it does:** Shows how many jobs are assigned to them in total, still at `assigned`, in progress, and completed. The cards filter My Work.
- **Screens and API:** The top of My Work. `GET /api/requests/work/stats`.
- **Rules:** Officer only. Counts are limited to that officer and that organisation.
- **Success:** The four figures match the assigned queue.
- **Failure:** Any other role receives HTTP 403.

#### FR-28 Assignment records

- **Who uses it:** Administrators, through the API. There is no assignments page.
- **What it does:** Returns each assignment row with the request title and status, the officer, the administrator who assigned it, and the time. Cancelling an assignment does not delete these rows. The request itself shows only the current officer.
- **API:** `GET /api/assignments`.
- **Rules:** Administrator and organisation scope only.
- **Success:** HTTP 200 with the list, newest first.
- **Failure:** Other roles receive HTTP 403.

### 7.4 Platform

#### FR-29 Health check and API documentation

- **Who uses it:** Developers and markers. These are not part of the signed-in product screens.
- **What it does:** `GET /api/health` reports that the API is running and includes a database target description (for example Atlas when that is the configured database). Swagger UI at `/api/docs` documents the HTTP API. The route tables in the project report are the maintained list of implemented paths.
- **Rules:** Health and the docs page do not require a JWT. Protected routes still require `Authorization: Bearer {token}`.
- **Success:** Health returns `{ success: true, message: "API is running.", database: … }`. The explorer loads.
- **Failure:** If the process is down or the database configuration is wrong, the health URL does not return that JSON. Render’s free web service can take tens of seconds to answer after it has been idle. That delay is the hosting plan, not a failed request by itself.

## 8. Data the system keeps

MongoDB stores the documents. Mongoose defines their shape. Relationships use ids that point at other documents. Evidence metadata is stored on the request because it belongs to that ticket.

**Organisation.** One tenant. It has a name, a unique slug used in public links, and the email of the person who created it. That creator email is unique, so one email starts at most one organisation. The organisation points at the creator’s user once that account exists.

**User.** A person in one organisation. The same email may exist again in a different organisation. Fields that matter to behaviour are full name, email, password hash, role (`admin`, `officer`, or `student`), member type (`student` or `staff` for requesters), account status (`pending` or `active`), whether the account is active, job title (required for officers, optional for administrators), who invited them, and the hashed invite or password-reset token and its expiry. Password hashes and token hashes are not returned to the browser.

**Category.** An issue type owned by one organisation. Name is unique within the organisation. Description is optional. Six categories are created with the organisation.

**Request.** A ticket. It belongs to one organisation, one requester, and one category. It has a title, description, location, and status. The assigned officer is empty until an administrator assigns one. Completion time, star rating, and the time of the rating are empty until those events happen. Evidence, when present, is embedded: original file name, storage key, provider (`cloudinary` or `local`), mime type, size, and upload time.

**Assignment.** A record that an administrator assigned an officer to a request, and when. A request can have several of these records over time if an assignment is cancelled and another officer is chosen. The request document holds only the current officer.

**Status update.** One row in the history of a request: the status, a note, the person who caused it, and the time. Submission, assignment, cancellation, and later status changes each add a row.

**Comment.** Text on a request, the author, the time, and whether the requester is allowed to see it. That flag is set from the mention rules in FR-17.

A student or staff member has many requests. An officer has many currently assigned requests. An administrator has many assignment actions. A request has one category, many history rows, many comments, and zero or one current officer.

## 9. Security and access rules

Passwords are hashed with bcrypt before they are stored. The API never returns the hash. JWT signing uses `JWT_SECRET` from the environment. The database URI, Cloudinary keys, and the secret are not committed as real values; `.env.example` holds placeholders only.

Every protected route checks the bearer token, then loads the user, then checks that the user is active and still belongs to the organisation in the token. Role checks run on the server. Hiding a button in the browser is not the access control. A wrong role receives HTTP 403, “You do not have permission to do that.”, unless a more specific sentence is used (for example, only students may submit requests).

Students and staff receive only their own requests, evidence, history, and the comments they are allowed to see. Officers receive only requests assigned to them, and may change status only on those requests. Administrators receive the requests, users, categories, assignments, and reports of their own organisation. They do not receive another organisation’s data. A request id from another organisation is reported as not found, so the response does not confirm that the ticket exists elsewhere.

The browser sends cookies-style credentials only as needed for CORS. The allowed browser origins are the configured `CLIENT_ORIGIN` plus local Vite addresses. A browser on an unknown origin is not given a CORS success.

Errors returned to the client use `{ success: false, message }` and, for validation, an `errors` array. Stack traces are not sent to the client. Unexpected server errors are logged on the server and the client sees “Something went wrong. Please try again.”

Inactivity logout clears the token in that browser after 10 minutes. It does not maintain a server-side session list.

## 10. Non-functional behaviour

**Validation.** Request bodies and query strings are checked with express-validator before the service runs. Failures use HTTP 400 and the message “Please check the highlighted fields.”, plus a field message such as “Password must be at least 8 characters.” Important business rules are checked again in services, so a caller who skips the browser still hits the same limits.

**Response shape.** Success is `{ success: true, data }` or, for a few deletes, `{ success: true, message }`. List endpoints include `items`, `page`, `limit`, `total`, and `totalPages` where the list is paged.

**Client behaviour.** Loading spinners are used for pages and sections. Forms disable the submit control while a save is in progress. API failures surface as form text or a toast. Empty lists explain what to do next. Layout uses the shared Resolva styles, semantic labels, and a sidebar that collapses to a Menu control on a narrow screen.

**Automated tests.** The server uses the Node.js test runner with Supertest and an in-memory MongoDB, so those tests do not read or write the Atlas database. The client uses Vitest and Testing Library with mocked API calls. The project report records a development run of **26 passed, 0 failed** for the server (2 suites) and **13 passed, 0 failed** for the client (5 files). Those figures are the results written in that report, not a new run for this document. The tests cover health, organisation setup, login failure, registration, validation, duplicate email, creating and listing a request, a second student being forbidden from another person’s request, assignment and the allowed status path, a forbidden status jump, an officer being forbidden from assigning or from viewing unassigned work, an administrator being forbidden from submitting a student request, and a missing request id. Further unit tests cover comment visibility and the time-to-fix text. Client tests cover login errors and the busy button, registration validation, submitting a request, list loading and errors, the officer My Work navigation, and route protection for guests and for the new-request page.

**Deployment shape.** The frontend is a Render static site built from `client` (`npm install && npm run build`, publish `dist`). `VITE_API_BASE_URL` is set at build time and must end with `/api`. The API is a Render web service from `server` (`npm install`, `npm start`), listening on `0.0.0.0` and the platform `PORT`. Health check path is `/api/health`. Data is in MongoDB Atlas. Evidence is in Cloudinary, with local disk only as a fallback. CORS uses `CLIENT_ORIGIN` set to the frontend origin with no trailing slash. The report records the frontend as https://resolva-1u28.onrender.com and the API as https://university-maintenance-project.onrender.com. A `render.yaml` blueprint describes the API service; the static site is created in the Render dashboard. The free web service sleeps after inactivity, so the first request can be slow. Hash routes (`/#/login`) are used so the static host can open deep links without extra rewrite rules.

**Local development.** The API reads `server/.env`. The Vite dev server proxies `/api` to `http://localhost:5000`. `npm run dev:preview` in `server` is local only: it starts an in-memory MongoDB, seeds it, and runs the API when a normal database is not available. That data disappears when the process stops.

## 11. Glossary

| Term | Meaning in Resolva |
|------|--------------------|
| Request | A maintenance ticket: title, description, location, category, status, requester, and, once assigned, an officer. |
| Assignment | The act, and the stored record, of an administrator giving a pending request to one maintenance officer. The request then shows that officer until the assignment is cancelled or the work continues. |
| Officer | A maintenance officer (`role` `officer`). They see and update only requests assigned to them. They have a job title. |
| Administrator | A user with `role` `admin` who manages one organisation’s requests, categories, and accounts. |
| Student / Staff | A requester. Both use `role` `student`. `memberType` is `student` or `staff` and is shown on lists and on the request. Their permissions are the same. |
| Organisation | One institution or department. Users, categories, and requests belong to it. Public links use its slug, as in `/o/{slug}/register`. |
| Evidence | The optional JPEG, PNG, GIF, WebP, or PDF attached to a request, stored in Cloudinary or, if that upload fails, on the server disk. The screen names the provider. |
| Status | One of `pending`, `assigned`, `in_progress`, and `completed`, in that order, except that cancelling an assignment moves `assigned` back to `pending`. |
| Status history | The log of those changes, including who made each change and any note. |
| Comment | A note on a request. Staff comments are hidden from the requester unless the text mentions the requester. |
| Rating | One to five stars, given once by the requester after the request is completed. |
| Invite | A time-limited link that lets a new administrator or officer set a password. It is copied, not emailed. |
| Registration link | The organisation URL where students and staff create their own accounts. |
| JWT | The signed token the browser sends as `Authorization: Bearer` after login, registration, invite acceptance, or password reset. |
