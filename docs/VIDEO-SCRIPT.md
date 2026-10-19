# PROG2002 Assignment 3 – Demo Video Script & Runbook

**Project:** HeartBridge Charity Events (complete dynamic website)
**Student:** WU ZhengTao (24832889) · Teammate: CAO XiangXin (24831970)
**Hard limit:** 15 minutes maximum. This plan is timed to about **14 minutes**, leaving ~1 minute of buffer.
**Recording:** Use the recording software (e.g. Snipping Tool → screen recording, OBS, or PowerPoint screen recording). Record your **whole screen** so the browser address bar and editor tabs are visible. Speak in English.

---

## Before you press record — set everything up (this is NOT recorded)

Open these in the order below and leave them open. Alt+Tab / Taskbar click between them.

1. **MySQL running** (port 3306). Confirm it is running; do not show passwords.
2. **Start the three Node apps** (each in its own terminal/PowerShell window, `node server.js`):
   - API in `PROG2002-A3\api` → http://localhost:3000
   - Public client in `PROG2002-A3\clientside` → http://localhost:8080
   - Admin in `PROG2002-A3\adminside` → http://localhost:8090
3. **Chrome (or Edge) with these tabs, in this order:**
   - Tab 1 – Admin dashboard: http://localhost:8090/
   - Tab 2 – Public home: http://localhost:8080/index.html
   - Tab 3 – Public search: http://localhost:8080/search.html
   - Tab 4 – Public event 1: http://localhost:8080/event.html?id=1
   - Tab 5 – Registration page: http://localhost:8080/register.html?id=1
   - Tab 6 – API JSON (active events): http://localhost:3000/api/events
   - Tab 7 – API health: http://localhost:3000/api/health
   - Tab 8 – **GitHub repository** (commits page), <https://github.com/asdmwq/Prog2002-A3>, logged in as `asdmwq`.
4. **Visual Studio Code** with the `PROG2002-A3` folder open. Expand these files in the Explorer so you can click them quickly:
   - `database/charityevents_db.sql`
   - `api/server.js`
   - `api/event_db.js`
   - `api/routes/events.js`
   - `clientside/public/js/config.js`
   - `clientside/public/js/event.js`
   - `clientside/public/js/register.js`
   - `clientside/public/js/weather.js`
   - `adminside/public/js/admin.js`
5. **A file Explorer window** showing the project folders (api, clientside, adminside, database) — proves the project structure and that there are three separate apps.
6. Have a plain email address ready for the live registration, e.g. `video.demo@example.com`.
7. After recording, **re-import the SQL file** to remove the demo registration (command at the end).

**Proof-of-ownership checklist (show these on screen at least once):**
- GitHub repo with your commits and clear commit messages.
- The code open in the editor with your own comments and coding style.
- Your file system and project folder.
- The running terminals (the apps started by you).
- Your name/student ID at the very start.

---

## Timed script (what to click + what to say)

> **Format:** `[mm:ss]` → **Show / Click** then **Say (read aloud).**
> Keep each segment moving; do not read code line by line — point at the important lines and explain them.

### 0:00 – 1:00 · Introduction & identity

**Show:** Chrome Tab 1 (admin dashboard, do not click yet). Then press **Win+Tab** or click the Taskbar so the viewer briefly sees all three running terminals and the editor.

**Say:**
"Hi, this is WU ZhengTao, student ID 24832889. My team member is CAO XiangXin, student ID 24831970. This is Assignment 3 for PROG2002 Web Development II, the HeartBridge Charity Events application. Assignment 3 extends the Assignment 2 read-only website into a complete dynamic application with event registration, a full CRUD API, and a separate admin dashboard. The system has three Node.js applications — the Express REST API on port 3000, the public website on port 8080, and the admin dashboard on port 8090 — all connected to one MySQL database. I'll walk through the database and API architecture, the data flow between the API and the websites, then demo the public site, the admin site, and finally my GitHub history and testing."

### 1:00 – 3:00 · Database design (Part 1)

**Show:** Switch to VS Code, open `database/charityevents_db.sql`. Scroll to the `CREATE TABLE registrations` block. Point at the columns, the foreign key, the `UNIQUE (event_id, email)` key, and the check constraints. Then scroll up to the `events` table and point at `latitude` and `longitude`.

**Say:**
"The database is called charityevents_db and keeps the original organisations, categories and events tables. For Assignment 3 I added a new registrations table. Each registration has a primary key registration_id, an event_id foreign key, the supporter's first and last name, email, optional phone, the ticket count, the total amount, and the registration timestamp. The foreign key uses ON DELETE RESTRICT, so at the database level an event cannot be deleted once it has registrations. The composite UNIQUE key on event_id and email enforces the business rule that one person may register for many events but only once per event. A check constraint limits ticket_count to between 1 and 20. I also added latitude and longitude to the events table so the Open-Meteo weather API can be queried, with check constraints on the valid ranges."

**Show (optional but strong):** Switch to a terminal and run the verification queries, then show the output:
```
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -e "USE charityevents_db; SELECT COUNT(*) AS events FROM events; SELECT COUNT(*) AS registrations FROM registrations; SELECT event_id, COUNT(*) AS regs FROM registrations GROUP BY event_id;"
```
(If you prefer not to type live, this is fine to skip; the SQL file and running website already prove the data.)

**Say:**
"The seed data contains ten events and fourteen registrations, which is above the minimum of ten required. There are seven upcoming events, two past events and one suspended event so every status and filtering rule can be demonstrated."

### 3:00 – 5:30 · REST API architecture (Part 2)

**Show:** In VS Code open `api/server.js`. Point at the Express app, the CORS configuration allowing only ports 8080 and 8090, and the route mounting. Then open `api/event_db.js` and point at the mysql2 connection pool.

**Say:**
"The API is built with Node.js and Express. In server.js I create the Express app, configure CORS so only the public and admin origins are allowed, and mount the routes. event_db.js uses a mysql2 promise connection pool. The application connects with a restricted database account that only has SELECT, INSERT, UPDATE and DELETE privileges — it has no DDL rights, and credentials are kept out of the submitted code."

**Show:** Open `api/routes/events.js`. Scroll through the route list quickly. Point at the GET search, POST create, PUT update, DELETE, and the POST registrations handler.

**Say:**
"Assignment 2 was read-only; Assignment 3 implements the full CRUD cycle. There are GET endpoints for the active events, optional search, the admin list with all statuses, single-event details, and the admin version with full registrations. POST creates an event, PUT updates it — with partial updates so only supplied fields are validated — and DELETE removes it. The POST registrations endpoint creates a booking."

**Show:** Switch to Chrome Tab 6 (http://localhost:3000/api/events) and then Tab 7 (health). Show the raw JSON and the coordinates, then demonstrate the search filter live by editing the address bar to:
`http://localhost:3000/api/events/search?category_id=1` (shows the Fun Run), then
`http://localhost:3000/api/events/1` (shows event 1 with its registrations).

**Say:**
"Here is the live JSON. The events endpoint returns each active event with its category, organisation, status, coordinates and progress. The search endpoint accepts optional query parameters, and the single-event endpoint returns the event together with its latest registrations. All SQL is parameterised, so values are never concatenated into the query text."

### 5:30 – 7:00 · Data flow between the API and website (ULO1)

**Show:** In VS Code open `clientside/public/js/config.js`, then `event.js`. Point at `fetch()`, the Promise handling, and the DOM rendering code. Then briefly show `adminside/public/js/admin.js`.

**Say:**
"Now the data flow. config.js sets the API base URL — localhost port 3000 in development and a same-origin path in production, so the same code works on cPanel. On the details page, event.js reads the event id from the URL query string, calls fetch on the API endpoint, awaits the JSON response, and then builds the DOM: the event details, the privacy-safe registrations list, and the weather card. The admin dashboard uses the same pattern in admin.js for the event table and statistics. Every page is rendered by plain JavaScript with Promises and DOM manipulation — there is no frontend framework and no template engine."

**Show:** Open `register.js` and point at the live total calculation and the POST handling.

**Say:**
"The registration page is the write path: it recomputes the total live as the ticket count changes, and on submit it posts JSON to the API. The server, not the browser, recomputes the total, so a tampered client cannot change the price."

### 7:00 – 10:00 · Public website demo (Part 3)

**Show:** Chrome Tab 2 (home). Scroll the home page — hero, live upcoming count, event cards.

**Say:**
"The Home page loads the active upcoming events from the API. This count and these cards are live data, not hard-coded."

**Show:** Tab 3 (search). Pick a Category (e.g. Fun Run), click **Search Events**, show results; then **Clear Filters** and search again with **Location** = `Liuzhou`. Optionally show an invalid-date validation.

**Say:**
"Search supports optional filters — date, location and category — used alone or together. The server only applies a condition for each field the user actually supplies, and invalid dates are blocked before the request."

**Show:** Tab 4 (event detail). Scroll to **Recent registrations** (privacy-safe names, latest first) and the **Weather forecast** card. Point at the **Register now** button and the URL it links to.

**Say:**
"The details page now shows the latest registrations, newest first, with privacy-safe names and a note that contact details are private. The weather card calls the free Open-Meteo API with the event's latitude and longitude, maps the weather code to an icon and description, and degrades gracefully if the forecast is unavailable. The Register button now links to the new registration page with the event id."

**Show:** Tab 5 (registration). Change the ticket number to **3** and show the total update to **¥75.00**. First click **Confirm registration** with an empty email to show validation, then fill in: first name `Video`, last name `Demo`, email `video.demo@example.com`, phone `138 0000 0088`, tickets `3`, and submit. Show the green confirmation panel.

**Say:**
"The form validates required fields, the email format and the ticket range. The total updates as I change the tickets. On a valid submission the server validates everything, computes the total, stores the record and returns the confirmation with the timestamp."

**Show:** Without reloading, click the browser **Back** to the registration form (or reopen Tab 5) and submit the **same email** again. Show the blocked duplicate message.

**Say:**
"If I register the same email again for the same event, the server returns a 409 conflict and the UI shows that this email has already registered — that is the UNIQUE constraint enforced in the API."

### 10:00 – 12:30 · Admin dashboard demo (Part 4)

**Show:** Tab 1 (admin). Point at the six summary cards and the full table including Past and Suspended status. Type in the filter box (e.g. `walk`).

**Say:**
"The admin dashboard is a separate single-page app on port 8090. The summary cards show total events, upcoming, past, suspended, registrations and tickets sold, and the table lists every event regardless of status. The filter narrows the list as I type."

**Show:** Click **Edit** on event #1. Show the pre-filled form (including latitude/longitude and the suspend checkbox), then scroll to the **Recorded registrations** table showing the full name, email, phone, tickets, total and timestamp — the detail the public site hides. Click **Cancel** (do not change anything).

**Say:**
"Editing pre-fills every field. The bottom of the modal shows the full registration detail for staff, including contact information the public site keeps private."

**Show:** Click **Delete** on event #1, then **Delete event**. Show the red blocked message.

**Say:**
"Deleting an event that already has registrations is refused. The API counts the registrations and returns a 409 with a clear message that includes the count — upholding data integrity. Only an event with no registrations can be deleted."

**Show (optional, clean create/delete):** Click **New event**, click **Save** with empty fields to show required-field validation, then close with **Cancel**. This proves create validation without adding data.

**Say:**
"The create form validates all required fields before anything is sent to the API. Successful create, update and delete actions show a toast and refresh the table and statistics."

### 12:30 – 13:30 · GitHub history, ownership & teamwork

**Show:** Chrome Tab 8 (GitHub repository, <https://github.com/asdmwq/Prog2002-A3>). Click **Commits**, scroll the layered commit history (database, API, client, admin, docs). Open one or two commits to show the changed files and clear messages. Show the repository contains the three app folders, the SQL file and the documentation.

**Say:**
"All work is tracked in a public GitHub repository with descriptive, layer-based commits — the database, then the API, then the client, then the admin dashboard, then documentation. The repository contains every source file and the documentation. My team member and I each contribute real commits, and we each deploy independently to our own cPanel account."

**Show (if time):** Briefly click back to VS Code and show your own comments in the route handlers.

### 13:30 – 14:00 · Testing & wrap-up

**Show:** Chrome Tab 7 (health) and mention the API test suite; optionally open the smoke test file in VS Code.

**Say:**
"I tested bottom-up: the SQL schema and seed data from the command line, a scripted suite of thirty API request cases covering every endpoint including the 400, 404 and 409 cases — all passed — and then the full browser flows you have just seen, including the blocked duplicate and blocked deletion. I also extracted the three submission packages fresh, ran npm ci, and started them against a clean database to confirm the submitted files work."

**Show:** If you have already deployed to cPanel, show the live public and admin URLs; otherwise state that deployment is the final step and the production config uses the same-origin API path.

**Say:**
"To summarise, the completed system adds a registrations table with enforced uniqueness and integrity, a full CRUD and registration API, a registration journey with the weather forecast on the public site, and a controlled admin dashboard — all built with Node.js, Express, MySQL, HTML, JavaScript and the DOM. Thank you for watching."

**Stop recording at about 14:00.**

---

## After recording

1. **Reset the database** to remove the `video.demo` registration so the submitted SQL/staging stays clean:
   ```
   & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -e "source C:/Users/30758/Doubao/chats/2026-10-04/new-chat/PROG2002-A3/database/charityevents_db.sql"
   ```
2. Replay the video once and check:
   - All addresses are clearly visible (localhost ports; replace with cPanel URLs once deployed).
   - No password or credential is visible.
   - Your name and ID are spoken/shown at the start.
   - The recording is within 15 minutes.
3. Upload the video to your **SCU OneDrive**, set sharing to **anyone at SCU with the link can view**, and paste the link into the submission.
4. You must be able to explain every piece of code shown; the marker may request an interview.

## Time plan at a glance

| Time | Segment |
|---|---|
| 0:00–1:00 | Intro, identity, three apps |
| 1:00–3:00 | Database schema, registrations, constraints |
| 3:00–5:30 | Express API, routes, live endpoints, search |
| 5:30–7:00 | Data flow: fetch → Promise → DOM |
| 7:00–10:00 | Public site: home, search, detail, weather, register, duplicate 409 |
| 10:00–12:30 | Admin: stats, list, edit + registrations, delete 409, validation |
| 12:30–13:30 | GitHub commits, ownership, teamwork |
| 13:30–14:00 | Testing, deployment, conclusion |
