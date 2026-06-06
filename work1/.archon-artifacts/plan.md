# JobScraper MVP — Implementation Plan

## 1. Tech Stack Decision

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js v20.19.1 | Already available in the environment |
| **Language** | TypeScript (strict mode) | Type safety across full stack |
| **Frontend framework** | React 18 + Vite 5 | Fast dev server, HMR, simple setup |
| **Backend framework** | Express.js 4 + TypeScript | Lightweight, well-known REST API |
| **Database** | SQLite via better-sqlite3 | File-based, zero-config, meets constraint of no external DB service |
| **Auth** | bcryptjs + jsonwebtoken | Password hashing + stateless JWT sessions |
| **Scraping** | axios + cheerio | Lightweight HTTP scraping; headless browser not needed for MVP (boards serve HTML) |
| **Validation** | zod | Runtime type validation for API inputs |
| **Export** | exceljs + csv-stringify | Excel (.xlsx) and CSV export support |
| **Styling** | Plain CSS with CSS modules | No framework dependency; keeps it simple for MVP |
| **Build tooling** | tsx (for backend dev) + vite (for frontend) | Direct TS execution + Vite bundling |

---

## 2. Summary & User Story

**Summary:** JobScraper MVP is a web application that lets users search for jobs across LinkedIn, Indeed, and SimplyHired in a single query. Users can view unified results, register an account, save/bookmark listings, and export results to CSV or Excel.

**User Story:**
> As a job seeker, I want to visit a single website, type a keyword and location, and see matching jobs from multiple job boards in one list. I want to create an account to save interesting listings for later, and I want to download my results as a CSV or Excel file so I can analyze them offline.

---

## 3. UX Flow (Text-Based Diagram)

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                         JOBSCRAPER MVP - UX FLOW                        │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────┐
 │  1. HOMEPAGE (unauthenticated)                                          │
 │                                                                         │
 │  ┌─────────────────────────────────────────────────────────────────┐   │
 │  │  LOGO: JobScraper                                  [Login] [Register] │   │
 │  ├─────────────────────────────────────────────────────────────────┤   │
 │  │  ┌──────────────────────────────────────────────────────────┐   │   │
 │  │  │  Keyword: [______________________]                       │   │   │
 │  │  │  Location: [______________________]                      │   │   │
 │  │  │                        [  Search Jobs  ]                 │   │   │
 │  │  └──────────────────────────────────────────────────────────┘   │   │
 │  │                                                                 │   │
 │  │  "Search across LinkedIn, Indeed, and SimplyHired — one query." │   │
 │  └─────────────────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────┐
 │  2. SEARCH RESULTS (may be authenticated or not)                        │
 │                                                                         │
 │  ┌─────────────────────────────────────────────────────────────────┐   │
 │  │  ← Back to Search                     Results for "React dev SF"│   │
 │  ├─────────────────────────────────────────────────────────────────┤   │
 │  │  Found 24 jobs from 3 boards (1.2s)                             │   │
 │  │                                                                 │   │
 │  │  ┌──────────────────────────────────────────────────────────┐   │   │
 │  │  │  ★ Save  │  [Export CSV ▼]                               │   │   │
 │  │  └──────────────────────────────────────────────────────────┘   │   │
 │  │                                                                 │   │
 │  │  ┌──────────────────────────────────────────────────────────┐   │   │
 │  │  │ [LinkedIn] Frontend Developer - Acme Corp - SF, CA       │   │   │
 │  │  │ ★ Save  │  View on LinkedIn ↗                            │   │   │
 │  │  │ We're looking for a React developer...                    │   │   │
 │  │  └──────────────────────────────────────────────────────────┘   │   │
 │  │  ┌──────────────────────────────────────────────────────────┐   │   │
 │  │  │ [Indeed]  Software Engineer - Beta Inc - San Francisco   │   │   │
 │  │  │ ★ Save  │  View on Indeed ↗                              │   │   │
 │  │  └──────────────────────────────────────────────────────────┘   │   │
 │  │  ┌──────────────────────────────────────────────────────────┐   │   │
 │  │  │ [SimplyHired] Junior React Dev - StartupX - Remote       │   │   │
 │  │  │ ★ Save  │  View on SimplyHired ↗                        │   │   │
 │  │  └──────────────────────────────────────────────────────────┘   │   │
 │  └─────────────────────────────────────────────────────────────────┘   │
 │  * If a board errors: shows "Indeed: Request timed out — showing      │
 │    results from 2 boards."                                             │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────┐
 │  3. REGISTRATION / LOGIN                                                │
 │                                                                         │
 │  ┌────────────────────────────┐    ┌────────────────────────────┐      │
 │  │  REGISTER                  │    │  LOGIN                     │      │
 │  │  Email: [______________]  │    │  Email: [______________]  │      │
 │  │  Password: [___________]  │    │  Password: [___________]  │      │
 │  │  Confirm: [___________]   │    │                     [Login]│      │
 │  │                 [Register] │    └────────────────────────────┘      │
 │  └────────────────────────────┘                                        │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────┐
 │  4. SAVED JOBS PAGE (authenticated only)                                │
 │                                                                         │
 │  ┌─────────────────────────────────────────────────────────────────┐   │
 │  │  LOGO: JobScraper                                [Saved] [Logout]│   │
 │  ├─────────────────────────────────────────────────────────────────┤   │
 │  │  My Saved Jobs (12)                    [Export CSV ▼]           │   │
 │  │                                                                 │   │
 │  │  ┌──────────────────────────────────────────────────────────┐   │   │
 │  │  │ [LinkedIn] Senior React Dev - Acme Corp - SF, CA         │   │   │
 │  │  │ ★ Saved  │  View on LinkedIn ↗  │  Remove ★              │   │   │
 │  │  └──────────────────────────────────────────────────────────┘   │   │
 │  │  ┌──────────────────────────────────────────────────────────┐   │   │
 │  │  │ [Indeed]  Full Stack Dev - Beta Inc - Austin, TX         │   │   │
 │  │  │ ★ Saved  │  View on Indeed ↗   │  Remove ★              │   │   │
 │  │  └──────────────────────────────────────────────────────────┘   │   │
 │  └─────────────────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────┐
 │  5. EXPORT FLOW                                                         │
 │                                                                         │
 │  User clicks "Export CSV" or "Export Excel" →                           │
 │    → Browser downloads file (jobs_export_2026-06-06.csv/.xlsx)           │
 │    → File contains columns: Title, Company, Location, Board, URL,       │
 │      Description                                                        │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Files to Create

All files are CREATE operations (greenfield project). Listed in order of creation.

### Project Config & Root Files

| # | File | Purpose |
|---|------|---------|
| 1 | `work1/package.json` | Root package manifest: scripts, dependencies, workspaces config |
| 2 | `work1/tsconfig.json` | Root TypeScript config with strict mode, path aliases |
| 3 | `work1/tsconfig.node.json` | Node-specific TS config for backend |
| 4 | `work1/.gitignore` | Ignore node_modules, dist, *.db, .env |
| 5 | `work1/.env.example` | Document required env vars (JWT_SECRET, PORT, etc.) |

### Backend Files (`work1/server/`)

| # | File | Purpose |
|---|------|---------|
| 6 | `work1/server/tsconfig.json` | Backend TS config (extends root) |
| 7 | `work1/server/src/index.ts` | Express app entry point: middleware, routes, server start |
| 8 | `work1/server/src/db/schema.ts` | Database schema: CREATE TABLE statements (users, saved_jobs) |
| 9 | `work1/server/src/db/connection.ts` | SQLite connection singleton using better-sqlite3 |
| 10 | `work1/server/src/db/seed.ts` | Optional seed data for dev/testing |
| 11 | `work1/server/src/middleware/auth.ts` | JWT verification middleware for protected routes |
| 12 | `work1/server/src/routes/auth.ts` | POST /api/auth/register, POST /api/auth/login, GET /api/auth/me |
| 13 | `work1/server/src/routes/jobs.ts` | GET /api/jobs/search?q=&location= (triggers scraping) |
| 14 | `work1/server/src/routes/saved.ts` | CRUD for saved jobs: GET, POST, DELETE /api/saved |
| 15 | `work1/server/src/routes/export.ts` | GET /api/export/csv, GET /api/export/excel |
| 16 | `work1/server/src/scrapers/base.ts` | Abstract Scraper interface/base class all boards implement |
| 17 | `work1/server/src/scrapers/linkedin.ts` | LinkedIn scraper implementation |
| 18 | `work1/server/src/scrapers/indeed.ts` | Indeed scraper implementation |
| 19 | `work1/server/src/scrapers/simplyhired.ts` | SimplyHired scraper implementation (third board) |
| 20 | `work1/server/src/scrapers/registry.ts` | Scraper registry: map of board name to scraper instance |
| 21 | `work1/server/src/validation/schemas.ts` | Zod schemas for all API inputs |

### Frontend Files (`work1/client/`)

| # | File | Purpose |
|---|------|---------|
| 22 | `work1/client/package.json` | Frontend deps: react, react-dom, react-router-dom, vite |
| 23 | `work1/client/tsconfig.json` | Frontend TS config (extends root, JSX react-jsx) |
| 24 | `work1/client/tsconfig.node.json` | Vite config TS config |
| 25 | `work1/client/vite.config.ts` | Vite config: proxy /api to backend |
| 26 | `work1/client/index.html` | Vite entry HTML with `<div id="root">` |
| 27 | `work1/client/src/main.tsx` | React entry point, router setup |
| 28 | `work1/client/src/App.tsx` | Root component: layout, nav, routes |
| 29 | `work1/client/src/api/client.ts` | Axios/fetch wrapper with base URL, auth header injection |
| 30 | `work1/client/src/api/auth.ts` | Auth API functions: register, login, getMe, logout |
| 31 | `work1/client/src/api/jobs.ts` | Jobs API functions: searchJobs |
| 32 | `work1/client/src/api/saved.ts` | Saved jobs API functions: getSaved, saveJob, removeSaved |
| 33 | `work1/client/src/api/export.ts` | Export API functions: trigger CSV/Excel download |
| 34 | `work1/client/src/context/AuthContext.tsx` | React context for auth state (user, login, logout, loading) |
| 35 | `work1/client/src/components/Layout.tsx` | Shared layout: header with nav, footer |
| 36 | `work1/client/src/components/SearchForm.tsx` | Keyword + location inputs + search button |
| 37 | `work1/client/src/components/JobCard.tsx` | Single job result card: title, company, location, board badge, save button, link |
| 38 | `work1/client/src/components/JobList.tsx` | List of JobCard components with loading/error states |
| 39 | `work1/client/src/components/ExportMenu.tsx` | Dropdown/button for CSV/Excel export |
| 40 | `work1/client/src/components/ProtectedRoute.tsx` | Route wrapper that redirects to login if unauthenticated |
| 41 | `work1/client/src/pages/HomePage.tsx` | Landing page with SearchForm |
| 42 | `work1/client/src/pages/SearchResults.tsx` | Results page: fetches on mount, renders JobList + ExportMenu |
| 43 | `work1/client/src/pages/LoginPage.tsx` | Login form with validation |
| 44 | `work1/client/src/pages/RegisterPage.tsx` | Registration form with validation |
| 45 | `work1/client/src/pages/SavedJobsPage.tsx` | User's saved jobs list + export |
| 46 | `work1/client/src/styles/global.css` | CSS reset, variables, base styles |
| 47 | `work1/client/src/styles/components.css` | Component styles: cards, forms, buttons, nav |

**Total: 47 files**

---

## 5. NOT Building (Scope Limits for MVP)

The following are explicitly excluded from this MVP implementation:

- **Email alerts / notifications** (P1 — Phase 2)
- **Scheduled/automatic scraping** (P1 — Phase 2)
- **Advanced filters** (salary range, date posted, job type) (P1 — Phase 3)
- **Dark mode toggle** (P1 — Phase 3)
- **Mobile responsive design** (P2 — Phase 4)
- **Resume upload** (P2 — Phase 5)
- **Application tracking** (statuses: applied, interview, offer) (P2 — Phase 5)
- **Password reset flow** (deferred from MVP scope per PRD assumption A-04 — can be added later)
- **OAuth/social login** (email/password only)
- **Pagination** (show all results on one page for MVP; large result sets can be truncated)
- **Caching layer / Redis** (SQLite in-memory cache for session-level dedup only)
- **Headless browser scraping** (axios + cheerio only; MVP targets boards with server-rendered HTML or lightweight API feeds)
- **HTTPS** (dev only; plain HTTP)
- **Rate limiting / proxy rotation** (addressed via configurable delays in scrapers)

---

## 6. Step-by-Step Atomic Tasks

### Task 1: Initialize Project Structure and Config Files
- Create `work1/package.json` with all backend dependencies
- Create `work1/tsconfig.json` (strict mode, ES2022 target)
- Create `work1/tsconfig.node.json`
- Create `work1/.gitignore`
- Create `work1/.env.example`
- Install npm dependencies
- **VALIDATE:** `cd /home/user/archontesting/work1 && npm install` succeeds; `npx tsc --noEmit` passes

### Task 2: Set Up Database Schema and Connection
- Create `work1/server/src/db/schema.ts` — define `users` table (id, email, password_hash, created_at) and `saved_jobs` table (id, user_id, board, job_id, title, company, location, url, description, posted_at, saved_at)
- Create `work1/server/src/db/connection.ts` — initialize better-sqlite3, run schema on startup
- **VALIDATE:** Write a quick test script that creates the DB, inserts a user, inserts a saved job, queries them back. Run with `npx tsx server/src/db/connection.ts`.

### Task 3: Build Scraper Module
- Create `work1/server/src/scrapers/base.ts` — define `Scraper` interface with `search(keyword: string, location: string): Promise<JobListing[]>`
- Create `work1/server/src/scrapers/linkedin.ts` — implement LinkedIn search (mock or real axios+cheerio)
- Create `work1/server/src/scrapers/indeed.ts` — implement Indeed search
- Create `work1/server/src/scrapers/simplyhired.ts` — implement SimplyHired search (third board)
- Create `work1/server/src/scrapers/registry.ts` — aggregator that runs all scrapers in parallel, collects results, handles per-board errors
- **VALIDATE:** `npx tsx -e "const {registry} = require('./server/src/scrapers/registry'); registry.searchAll('react developer', 'San Francisco').then(console.log)"` returns a combined array of results (or graceful errors per board)

### Task 4: Build Backend API
- Create `work1/server/src/validation/schemas.ts` — zod schemas for register, login, search, save/unsave
- Create `work1/server/src/middleware/auth.ts` — JWT verify middleware that sets `req.user`
- Create `work1/server/src/routes/auth.ts` — POST /api/auth/register (validate with zod, hash password, create user, return JWT), POST /api/auth/login (verify credentials, return JWT), GET /api/auth/me (return current user)
- Create `work1/server/src/routes/jobs.ts` — GET /api/jobs/search?q=&location= (validate query, call scraper registry, return results)
- Create `work1/server/src/routes/saved.ts` — GET /api/saved (auth required, list user's saved jobs), POST /api/saved (auth required, save a job), DELETE /api/saved/:id (auth required, remove saved job)
- Create `work1/server/src/routes/export.ts` — GET /api/export/csv (auth optional, accept `jobIds[]` query, return CSV file), GET /api/export/excel (same but .xlsx via exceljs)
- Create `work1/server/src/index.ts` — wire Express with JSON body parser, CORS, routes
- **VALIDATE:** `npx tsx server/src/index.ts` starts on port 3001; `curl` test each endpoint returns expected responses.

### Task 5: Build Frontend App
- Create `work1/client/package.json` with React + Vite deps
- Create `work1/client/vite.config.ts` with proxy `/api` -> `http://localhost:3001`
- Create `work1/client/index.html`
- Create `work1/client/src/main.tsx` — render App with BrowserRouter
- Create `work1/client/src/context/AuthContext.tsx` — provide user state, login/logout/register functions, persist JWT in localStorage
- Create `work1/client/src/api/client.ts` — fetch wrapper with base URL and auth header
- Create `work1/client/src/api/auth.ts` — login, register, getMe
- Create `work1/client/src/api/jobs.ts` — searchJobs
- Create `work1/client/src/api/saved.ts` — getSaved, saveJob, removeSaved
- Create `work1/client/src/api/export.ts` — triggerFileDownload for CSV/Excel
- Create `work1/client/src/components/Layout.tsx` — nav bar with logo, links, auth status
- Create `work1/client/src/components/ProtectedRoute.tsx`
- Create `work1/client/src/components/SearchForm.tsx` — keyword + location text inputs + submit
- Create `work1/client/src/components/JobCard.tsx` — displays title, company, location, board badge, description snippet, link, save button
- Create `work1/client/src/components/JobList.tsx` — array of JobCards with loading spinner / error state
- Create `work1/client/src/components/ExportMenu.tsx` — dropdown with CSV/Excel options
- Create `work1/client/src/pages/HomePage.tsx` — welcome message + SearchForm
- Create `work1/client/src/pages/SearchResults.tsx` — URL query params -> search -> display JobList + ExportMenu
- Create `work1/client/src/pages/LoginPage.tsx` — form -> auth context login -> redirect
- Create `work1/client/src/pages/RegisterPage.tsx` — form -> auth context register -> redirect
- Create `work1/client/src/pages/SavedJobsPage.tsx` — fetch saved jobs -> JobList + ExportMenu
- Create `work1/client/src/App.tsx` — routes: /, /search, /login, /register, /saved
- Create `work1/client/src/styles/global.css` — CSS variables, reset, base typography
- Create `work1/client/src/styles/components.css` — card, form, button, nav styles
- Install frontend deps
- **VALIDATE:** `npm run dev` in client directory starts Vite dev server; navigate to pages in browser

### Task 6: Wire Everything Together and Test
- Update `work1/package.json` with root scripts: `"dev"` (concurrently server + client), `"build"`, `"typecheck"`
- Ensure the Vite proxy correctly forwards `/api/*` to Express on port 3001
- Test full user flow end-to-end:
  1. Visit homepage -> search "react developer" in "San Francisco" -> see results from all 3 boards
  2. Register an account -> login -> navigate to saved -> empty state
  3. Search -> click "Save" on a listing -> visit saved page -> listing appears
  4. Click "Export CSV" -> file downloads -> open and verify columns
  5. Click "Export Excel" -> file downloads -> open and verify
  6. Remove a saved listing -> confirm it disappears
  7. Logout -> confirm saved page redirects to login
- **VALIDATE:** Full flow works end-to-end on local dev server

---

## 7. Testing Strategy

| Layer | Testing Approach | Tool |
|-------|-----------------|------|
| **Type checking** | `tsc --noEmit` on both server and client | TypeScript compiler |
| **Schema/database** | Quick smoke script that creates DB, CRUDs records, then drops | tsx + inline assertion |
| **Scrapers** | Unit test each scraper with a mock HTML fixture + test that registry catches errors gracefully | vitest (can add later) |
| **API endpoints** | Manual curl tests + optional supertest integration tests | curl / supertest |
| **Frontend components** | Manual browser testing + React DevTools | Browser |
| **Export files** | Download CSV and Excel, open in spreadsheet app / verify columns and rows | Manual |
| **End-to-end** | Full user journey through all features in browser | Manual |
| **Build** | `npm run build` produces dist files for both server (compiled JS) and client (bundled assets) | tsc + vite build |

Given this is an MVP with no formal QA infrastructure, manual validation is primary. TypeScript strict mode provides compile-time safety. Zod validation catches malformed inputs at runtime.

---

## 8. Full Validation Commands

All commands run from `/home/user/archontesting/work1` unless otherwise noted.

```bash
# -- Install dependencies --
npm install
cd client && npm install && cd ..

# -- Type check (both projects) --
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json

# -- Database smoke test --
npx tsx server/src/db/connection.ts

# -- Scraper smoke test --
npx tsx -e "
import { registry } from './server/src/scrapers/registry';
registry.searchAll('react developer', 'San Francisco').then(results => {
  console.log('Results:', JSON.stringify(results, null, 2));
  console.log('Total:', results.length);
}).catch(e => console.error('Error:', e.message));
"

# -- Start backend (terminal 1) --
npx tsx server/src/index.ts

# -- Start frontend (terminal 2) --
cd client && npx vite --port 5173

# -- API smoke tests (backend running) --

## Register a user
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq .

## Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')
echo "TOKEN=$TOKEN"

## Get current user
curl -s http://localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN" | jq .

## Search jobs
curl -s "http://localhost:3001/api/jobs/search?q=react+developer&location=San+Francisco" | jq .

## Save a job
curl -s -X POST http://localhost:3001/api/saved \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"board":"LinkedIn","jobId":"lk-123","title":"React Developer","company":"Acme","location":"SF","url":"https://linkedin.com/jobs/123","description":"We are hiring!"}' | jq .

## List saved jobs
curl -s http://localhost:3001/api/saved -H "Authorization: Bearer $TOKEN" | jq .

## Export CSV
curl -s -o /tmp/jobs.csv http://localhost:3001/api/export/csv \
  -H "Authorization: Bearer $TOKEN"

## Export Excel
curl -s -o /tmp/jobs.xlsx http://localhost:3001/api/export/excel \
  -H "Authorization: Bearer $TOKEN"

## Delete saved job (replace :id with actual id from saved list)
# curl -s -X DELETE http://localhost:3001/api/saved/1 -H "Authorization: Bearer $TOKEN" | jq .

# -- Build for production --
cd client && npx vite build && cd ..
npx tsc -p server/tsconfig.json

# -- Verify build output exists --
ls -la client/dist/index.html
ls -la server/dist/index.js

# -- Full typecheck (both projects) --
npx tsc --noEmit -p server/tsconfig.json && npx tsc --noEmit -p client/tsconfig.json && echo "All types OK"
```
