# HeartBridge Charity Events

**PROG2002 – Web Development II · Assignment 3: Data Management (CRUD and Team Project)**

A dynamic charity event website for the Liuzhou case study. The public can browse
active and upcoming charity events, view event details and recent registrations, and
register for an event. Administrators use a separate single-page dashboard to create,
update, suspend and delete events, and to review the full registration list for each
event.

The project keeps the same **multi-tier client–server architecture** as Assignment 2 and
adds data management (full CRUD), a registrations table, a public registration form, a
new admin application and a live weather forecast.

> Per the unit rules, the client and admin front ends contain **zero frameworks and zero
> template engines** (no Bootstrap, jQuery, React, Angular, EJS, etc.). The server uses
> **Express only**. There is no AngularJS anywhere in this project.

## Team

| Member | Student ID | Role |
|---|---|---|
| WU ZhengTao | 24832889 | Database, REST API, public client, admin client |
| CAO XiangXin | 24831970 | _(team contribution to be confirmed)_ |

## Applications and ports

| Layer | Technology | Runs at |
|---|---|---|
| Data | MySQL 8 (`charityevents_db`) | localhost:3306 |
| Application (REST API) | Node.js + Express (only Express is permitted) | http://localhost:3000 |
| Public client (web application) | Plain HTML, CSS, JavaScript only | http://localhost:8080 |
| **Admin client (new in A3)** | Plain HTML, CSS, JavaScript only (served by Express static) | http://localhost:8090 |

## What is new in Assignment 3

1. **Database** – a new `registrations` table (unique id, first/last name, contact email
   and phone, registration date, ticket count, event foreign key) with a
   `UNIQUE(event_id, email)` constraint so one person can register for many events but
   only once per event. Each event also stores `latitude` and `longitude`.
2. **REST API – full CRUD** – create, update (partial update supported) and delete
   events, plus create a registration. Deleting an event that already has registrations
   is rejected with HTTP 409.
3. **Public client** – the event details page shows the most recent registrations first
   (contact details are kept private); a new `register.html` page validates input,
   submits a registration, shows a confirmation summary, and handles duplicate
   registrations. A live **Open-Meteo** weather forecast (no API key) is shown for the
   event day.
4. **Admin client** – a new single-page dashboard (`adminside`) listing events of every
   status, with summary statistics, filtering, create/edit forms (the edit view shows
   the complete registration list for that event), and delete with 409 feedback.

## Public pages

1. **Home** (`index.html`) – hero with live event count and a filterable grid.
2. **Search Events** (`search.html`) – optional date / location / category filters.
3. **Event Details** (`event.html?id=N`) – event information, ticket and fundraising
   cards, a **live weather card**, and a **recent registrations** list (newest first).
4. **Register** (`register.html?id=N`) – registration form with live total amount,
   client-side validation, confirmation summary and duplicate handling.
5. **404** (`404.html`) – friendly not-found page.

The **admin dashboard** (`adminside/public/index.html`) is a single page with the events
table, statistics, filter box and shared create/edit and delete dialogs.

## Project structure

```
PROG2002-A3/
├─ database/
│  └─ charityevents_db.sql      # schema, registrations table, lat/lng, sample data, app account
├─ api/                         # Node.js + Express REST API
│  ├─ server.js
│  ├─ event_db.js               # mysql2 connection pool
│  ├─ routes/events.js          # GET list/detail/search/admin + POST/PUT/DELETE + registrations
│  ├─ routes/categories.js
│  ├─ routes/organisations.js
│  └─ package.json
├─ clientside/                  # public web application (HTML/CSS/JS)
│  ├─ server.js                 # static file server (Express)
│  ├─ public/
│  │  ├─ index.html  search.html  event.html  register.html  404.html
│  │  ├─ css/style.css
│  │  ├─ js/ (config, ui, nav, home, search, event, register, weather)
│  │  └─ images/ (8 local SVG banners)
│  └─ package.json
├─ adminside/                   # admin dashboard (HTML/CSS/JS), served by Express
│  ├─ server.js
│  ├─ public/ (index.html, css/admin.css, js/config.js, js/admin.js, images/)
│  └─ package.json
├─ docs/                        # report, storyboard, setup guide, video script, ERD
├─ start-mysql.cmd
├─ start-all.cmd
└─ README.md
```

## Quick start

```bash
# 1. Start MySQL and import the database (once)
start-mysql.cmd
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql" -u root < database/charityevents_db.sql

# 2. Start the REST API  (http://localhost:3000)
cd api
npm install
npm start

# 3. Start the public web application  (http://localhost:8080)
cd ../clientside
npm install
npm start

# 4. Start the admin dashboard  (http://localhost:8090)
cd ../adminside
npm install
npm start
```

Open <http://localhost:8080> for the public site and <http://localhost:8090> for the admin
dashboard. Verify the API at <http://localhost:3000/api/health>.

## REST API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | API + database connectivity check |
| `/api/events` | GET | Active current/upcoming events (with registration/ticket counts) |
| `/api/events/all` | GET | All events (any status) for the admin dashboard |
| `/api/events/search` | GET | Optional `date`, `location`, `category_id` filters |
| `/api/categories` | GET | Categories with active-event counts |
| `/api/organisations` | GET | Hosting organisations |
| `/api/events/:id` | GET | One active event plus its registrations (newest first) |
| `/api/events/admin/:id` | GET | One event of any status plus registrations (admin) |
| `/api/events` | POST | Create an event (validation + foreign-key checks) |
| `/api/events/:id` | PUT | Update an event (partial updates supported) |
| `/api/events/:id` | DELETE | Delete an event (409 if it has registrations) |
| `/api/events/:id/registrations` | POST | Register a person; total amount is computed server-side; duplicate email returns 409 |

## Sample data

Three organisations, six categories and ten events (seven upcoming, two past, one
suspended), with fourteen sample registrations. Suspended and past events are excluded
from public queries but remain visible in the admin dashboard.

## Submission contents

- Three Node.js apps (**api**, **clientside**, **adminside**) plus the single SQL file.
- A public GitHub repository with the full source, database export and documentation:
  <https://github.com/asdmwq/Prog2002-A3>.
- A per-member demonstration video (link provided) and a completed peer evaluation form.
- Project documentation and the Generative AI declaration.
