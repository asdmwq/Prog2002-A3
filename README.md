# HeartBridge Charity Events

**PROG2002 - Web Development II · Assignment 3: full CRUD and team project**

HeartBridge is a dynamic charity event website for the Liuzhou case study. The
public can browse active and upcoming events, view event details and the latest
ticket registrations, and register for an event. A separate admin dashboard lets
staff create, update, suspend and delete events and review the full registration
list for each event.

The front-end applications are built with **Angular v22 (standalone components,
signals and TypeScript)**. The REST API is built with **Node.js + Express** and
the data is stored in **MySQL**. A live **Open-Meteo** weather forecast is shown
on each event detail page.

## Team

| Member | Student ID | Role |
|---|---|---|
| WU ZhengTao | 24832889 | Database, REST API, public client, admin client |
| CAO XiangXin | 24831970 | Team member |

## Architecture and ports

| Layer | Technology | Runs at |
|---|---|---|
| Database | MySQL 8 (`charityevents_db`) | localhost:3306 |
| REST API | Node.js + Express + mysql2 | http://localhost:3000 |
| Public client | Angular v22 + TypeScript (served by Express) | http://localhost:8080 |
| Admin dashboard | Angular v22 + TypeScript (served by Express) | http://localhost:8090 |

Each front-end is a separate Angular workspace whose production build is served
as static files by a small Express server. The client and admin apps call the
REST API under `/api`.

## Project structure

```
PROG2002-A3/
├── database/
│   └── charityevents_db.sql        # schema, registrations table, lat/lng, sample data
├── api/                            # Node.js + Express REST API
│   ├── server.js
│   ├── event_db.js                 # mysql2 connection pool
│   ├── routes/
│   │   ├── events.js               # list/detail/search/admin + CRUD + registrations
│   │   ├── categories.js
│   │   └── organisations.js
│   └── package.json
├── clientside/                     # public Angular application (port 8080)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/               # models, formatting, ApiService
│   │   │   ├── layout/             # shared header, navigation and footer
│   │   │   ├── pages/              # home, search, event-detail, register, not-found
│   │   │   └── shared/             # event card, state box, weather widget
│   │   ├── public/images/          # 8 local SVG banners
│   │   ├── styles.css
│   │   └── index.html
│   ├── dist/                       # production build (served by server.js)
│   ├── server.js
│   ├── angular.json
│   └── package.json
├── adminside/                      # admin Angular dashboard (port 8090)
│   ├── src/app/
│   ├── dist/
│   ├── server.js
│   ├── angular.json
│   └── package.json
└── docs/                           # project report, ERD and sample SQL
```

## Quick start

1. Start MySQL and import the database once:

   ```bash
   mysql -u root -e "source database/charityevents_db.sql"
   ```

2. Start the REST API:

   ```bash
   cd api
   npm install
   npm start
   ```

3. Start the public client:

   ```bash
   cd clientside
   npm install
   npm run build
   npm start
   ```

4. Start the admin dashboard:

   ```bash
   cd adminside
   npm install
   npm run build
   npm start
   ```

Then open http://localhost:8080 for the public site and http://localhost:8090
for the admin dashboard. The API health check is http://localhost:3000/api/health.

The committed `dist/` folders already contain a production build, so
`npm run build` is optional after cloning; it is only required when the TypeScript
source is changed.

## Features

- **Home page** - hero with a live event count and a filterable event grid.
- **Search page** - optional date, location and category filters.
- **Event detail page** - event information, ticket and fundraising cards, a
  recent registrations list (newest first) and an Open-Meteo weather card.
- **Registration page** - form with live total amount, client-side validation,
  a confirmation summary and duplicate-email handling.
- **Admin dashboard** - summary statistics, a table of events of every status,
  live filtering, create/edit forms with the full registration list, and delete
  with a 409 error when an event already has registrations.

## REST API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | API and database connectivity check |
| `/api/events` | GET | Active current/upcoming events (optional `category_id`) |
| `/api/events/all` | GET | All events (any status) for the admin dashboard |
| `/api/events/search` | GET | Optional `date`, `location`, `category_id` filters |
| `/api/categories` | GET | Categories with active-event counts |
| `/api/organisations` | GET | Hosting organisations |
| `/api/events/:id` | GET | One active event plus its registrations (newest first) |
| `/api/events/admin/:id` | GET | One event of any status plus registrations (admin) |
| `/api/events` | POST | Create an event (validation and foreign-key checks) |
| `/api/events/:id` | PUT | Update an event (partial updates supported) |
| `/api/events/:id` | DELETE | Delete an event (409 if it has registrations) |
| `/api/events/:id/registrations` | POST | Register a person; the total is computed server-side; duplicate email returns 409 |

## Sample data

Three organisations, six categories and ten events (seven upcoming, two past and
one suspended), with fourteen sample registrations. Suspended and past events are
excluded from public queries but remain visible in the admin dashboard.

## Submission

- Three Node.js applications (`api`, `clientside`, `adminside`) and the single
  SQL export file.
- The public GitHub repository: https://github.com/asdmwq/Prog2002-A3
- A per-member demonstration video link and a completed peer evaluation form.
- The project report and Generative AI declaration (see `docs/`).
