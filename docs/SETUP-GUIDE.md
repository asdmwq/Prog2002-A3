# Setup Guide – HeartBridge Charity Events (Assignment 3)

This guide sets the project up from scratch on Windows. Assignment 3 runs **three**
Node.js applications plus one MySQL database:

- Express REST API on port **3000**
- Public client website on port **8080**
- Admin dashboard on port **8090**
- MySQL 8 on port **3306**

## 1. Prerequisites

- **Node.js** (LTS) – verify with `node -v` and `npm -v`.
- **MySQL 8.x** – this project was built with MySQL 8.4 at
  `C:\Program Files\MySQL\MySQL Server 8.4\`.
- A browser (Chrome/Edge).

## 2. Start the MySQL server

- Convenience script: double-click **`start-mysql.cmd`** in the project root.
- Equivalent manual command (PowerShell):

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" `
  --defaults-file="C:\Users\30758\Doubao\mysql\my.ini" --console
```

Confirm the server answers:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -e "SELECT VERSION();"
```

## 3. Create the database

From the **project root**, import the SQL file:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root `
  -e "source C:/Users/30758/Doubao/chats/2026-10-04/new-chat/PROG2002-A3/database/charityevents_db.sql"
```

The script creates:

- the `charityevents_db` database with the `organisations`, `categories`, `events`
  and **`registrations`** tables, indexes, foreign keys and CHECK constraints;
- event `latitude`/`longitude` columns (DECIMAL(9,6)) used by the weather API;
- sample data: **3 organisations, 6 categories, 10 events** (7 upcoming, 2 past,
  1 suspended) and **14 registrations / 29 tickets**;
- a least-privilege application account `event_user` / `event_pass_2026` with
  **SELECT, INSERT, UPDATE, DELETE** (no DDL), because the API now performs create,
  update and delete operations.

Verify the data:

```sql
USE charityevents_db;
SELECT COUNT(*) FROM events;          -- 10
SELECT COUNT(*) FROM registrations;   -- 14
SELECT COUNT(*) FROM events e JOIN registrations r ON e.event_id = r.event_id; -- 14
```

## 4. Configure the API connection (optional)

The API reads MySQL credentials from environment variables and falls back to the local
defaults (`event_user` / `event_pass_2026`, database `charityevents_db`). Override them
only if your setup differs:

```powershell
$env:DB_HOST="localhost"; $env:DB_USER="event_user"; $env:DB_PASSWORD="event_pass_2026"; $env:DB_NAME="charityevents_db"
```

`ALLOWED_ORIGINS` may be set to a comma-separated list of allowed browser origins; by
default only the local public (8080) and admin (8090) origins are allowed.

## 5. Install and start the REST API

```powershell
cd api
npm install
npm start
```

Expected: `API running at http://localhost:3000`. Check:

- <http://localhost:3000/api/health> → `{"status":"ok","database":"connected"}`
- <http://localhost:3000/api/events> → JSON array of active upcoming events.
- <http://localhost:3000/api/events/all> → every event with registration counts (admin list).

## 6. Install and start the public client

In a **second** terminal:

```powershell
cd clientside
npm install
npm start
```

Expected: `Web client running at http://localhost:8080`. Open
<http://localhost:8080/index.html>. Pages: `index.html` (Home), `search.html`,
`event.html?id=1` (Details) and `register.html?id=1` (Registration).

## 7. Install and start the admin dashboard

In a **third** terminal:

```powershell
cd adminside
npm install
npm start
```

Expected: `Admin dashboard running at http://localhost:8090`. Open
<http://localhost:8090/>. This is the CRUD back-office (list, create, edit, suspend,
delete and view full registration details).

## 8. Run order summary

1. MySQL running (step 2) and database imported (step 3).
2. API on port 3000 (step 5).
3. Public client on port 8080 (step 6).
4. Admin dashboard on port 8090 (step 7).

## 9. Submission archives

Each app is archived separately with `node_modules` excluded; the SQL export ships with
the API package:

| Archive | App | Port |
|---|---|---|
| `24832889A3-api.zip` | Express REST API + `database/` | 3000 |
| `24832889A3-clientside.zip` | Public client | 8080 |
| `24832889A3-adminside.zip` | Admin dashboard | 8090 |

To verify a package from scratch, unzip it, run `npm ci`, start the app, and open it in
the browser against the imported database.

## 10. cPanel deployment (each student deploys separately)

Do not share cPanel credentials. Each student performs these steps on their own SCU
cPanel account:

1. Create the MySQL database and database user, then grant the user full
   privileges on that database.
2. Import the single `charityevents_db.sql` file in phpMyAdmin.
3. Upload/set up the three Node.js applications as cPanel Node apps (API, public client,
   admin dashboard), each from its own archive.
4. Set the environment variables for the database connection (`DB_HOST`, `DB_USER`,
   `DB_PASSWORD`, `DB_NAME`) and `ALLOWED_ORIGINS` (the deployed public and admin URLs).
5. Start the API application and record its base URL; confirm `/api/health`.
6. The front-end `config.js` switches automatically: in production it uses the
   same-origin `/api` path, or an optional production API origin constant.
7. Verify the public site (Home, Search, Details, Register, weather) and the admin
   dashboard (list, create, edit, suspend, delete) over HTTPS.
8. Record the three deployed URLs in the report and use them in the live demo.

## 11. Troubleshooting

| Symptom | Check / fix |
|---|---|
| `ECONNREFUSED` to port 3306 | MySQL is not started – run `start-mysql.cmd`. |
| Health endpoint says not connected | Confirm the import (step 3) and the credentials (step 4). |
| Port 3000 / 8080 / 8090 already in use | Stop the previous Node process or change the port in that app's `server.js`. |
| Browser shows a CORS error | Confirm the API is running and the origin is in `ALLOWED_ORIGINS` (8080/8090 locally). |
| Registration returns 400 | Invalid email, ticket count outside 1–20, or the event is past/suspended. |
| Registration returns 409 | That email is already registered for the event. |
| Delete returns 409 | The event has registrations; remove the registrations first (ON DELETE RESTRICT). |
| Weather card shows a fallback | The event date is outside the 16-day forecast or the request failed; the page still works. |
| Banners missing | The local SVG files live in each app's `public/images/`; do not delete them. |

## 12. Stopping the apps

Press `Ctrl+C` in each of the three terminals. MySQL can be shut down with:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqladmin.exe" -u root shutdown
```
