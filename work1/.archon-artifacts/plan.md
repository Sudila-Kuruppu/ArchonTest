# DCW PLAN — Coffee Shop Website

## Meta
- **Feature:** Coffee Shop Website (Node.js + Express + EJS multi-page site)
- **Phase:** PLAN
- **Date:** 2026-06-06

## Summary
Create a fully functional, multi-page coffee shop website under `coffee-shop/` using Node.js + Express + EJS for server-side rendering. The site will have a warm brown/cream coffee theme, responsive design for mobile and desktop, and a contact form with server-side handling.

### UX Flow
```
Before: No coffee shop site exists
After:  Users visit coffee-shop/ and see:
        1. Home page — hero banner + featured coffees preview
        2. Menu page — full coffee grid with name, description, price, image
        3. About page — story, mission, location
        4. Contact page — form with name/email/message → POST handler
        Navigate via responsive navbar with hamburger on mobile
```

## Scope

### In Scope
- Create `coffee-shop/` directory with full project structure (package.json, server.js, routes/, views/, public/)
- Express server with EJS view engine, static file serving, and URL-encoded body parsing
- 4 server-rendered pages: Home (hero + featured coffees), Menu (full coffee grid), About (story/location), Contact (form)
- EJS partials for head, nav, and footer — reused across all pages
- Responsive coffee-themed CSS with warm browns and creams (mobile-first with 3 breakpoints)
- Contact form with server-side POST handling (validation, success/error states)
- Coffee menu data stored in `data/menu.json` (6+ items with name, description, price)
- Client-side JavaScript for hamburger menu toggle and form validation
- CSS-styled image placeholders with coffee emoji (☕) for menu items
- `npm install` and server startup verification

### Out of Scope
- Database integration (data stored in static JSON file)
- User authentication or login system
- Payment/checkout/e-commerce functionality
- Real image assets (CSS placeholders used instead)
- Email delivery for contact form (server-side logging to console only)
- Automated testing framework
- Deployment configuration (Docker, CI/CD, hosting)
- Admin panel or content management system

## Task Overview

### Dependency Order
```
T1 (package.json & dirs)
├── T2 (server.js)
├── T3 (routes/index.js)
├── T4 (data/menu.json)
├── T5 (view partials: head, nav, footer)
│   ├── T6 (views/pages/home.ejs)
│   ├── T7 (views/pages/menu.ejs)
│   ├── T8 (views/pages/about.ejs)
│   └── T9 (views/pages/contact.ejs)
├── T10 (public/css/style.css)
├── T11 (public/js/main.js)
└── T12 (npm install + verify) [depends on all above]
```

### Task Table
| ID | Action | File | Depends | Validate |
|----|--------|------|---------|----------|
| T1 | CREATE | `coffee-shop/package.json` | — | `test -f coffee-shop/package.json` |
| T2 | CREATE | `coffee-shop/server.js` | T1 | `node -c coffee-shop/server.js` |
| T3 | CREATE | `coffee-shop/routes/index.js` | T1 | `node -c coffee-shop/routes/index.js` |
| T4 | CREATE | `coffee-shop/data/menu.json` | T1 | `node -e "require('./data/menu.json')"` |
| T5 | CREATE | `coffee-shop/views/partials/{head,nav,footer}.ejs` | T1 | All 3 files exist |
| T6 | CREATE | `coffee-shop/views/pages/home.ejs` | T5 | File exists |
| T7 | CREATE | `coffee-shop/views/pages/menu.ejs` | T5 | File exists |
| T8 | CREATE | `coffee-shop/views/pages/about.ejs` | T5 | File exists |
| T9 | CREATE | `coffee-shop/views/pages/contact.ejs` | T5 | File exists |
| T10 | CREATE | `coffee-shop/public/css/style.css` | T1 | File exists |
| T11 | CREATE | `coffee-shop/public/js/main.js` | T1 | `node -c main.js` |
| T12 | UPDATE | `coffee-shop/package.json` | All | `npm install` + server start |

### Task Details

#### T1: Create project directory and package.json
- **Action:** CREATE `coffee-shop/package.json`
- **Patterns:** `jobscraper/server/package.json` (reference for structure — adapted to CommonJS, no TypeScript)
- **Description:** Create `coffee-shop/` directory structure and write package.json with dependencies: `express`, `ejs`. Dev script: `node server.js`.
- **Validate:** `test -f coffee-shop/package.json && echo 'package.json exists'`

#### T2: Create Express server entry point (server.js)
- **Action:** CREATE `coffee-shop/server.js`
- **Patterns:** `jobscraper/server/src/index.ts` (Express app pattern — adapted to CommonJS `require()`, `app.set('view engine', 'ejs')`, static file middleware)
- **Description:** Express server with: EJS view engine config, `express.static()` for `public/`, `express.urlencoded()` for form parsing, route mounting from `./routes/index.js`, port from `process.env.PORT || 3000`. Includes `app.listen()` startup message.
- **Validate:** `test -f coffee-shop/server.js && node -c coffee-shop/server.js`

#### T3: Create route handler (routes/index.js)
- **Action:** CREATE `coffee-shop/routes/index.js`
- **Description:** Express Router with GET routes: `/` (render home with featured coffees), `/menu` (render menu with full list), `/about` (render about), `/contact` (render contact). POST route: `/contact` (parse body, validate name/email/message, log to console, re-render contact with success/error flash). Routes load menu data from `../data/menu.json`.
- **Validate:** `test -f coffee-shop/routes/index.js && node -c coffee-shop/routes/index.js`

#### T4: Create menu data (data/menu.json)
- **Action:** CREATE `coffee-shop/data/menu.json`
- **Description:** JSON array of 6-8 coffee items. Each item: `{ id, name, description, price, category, featured }`. Includes classic espresso, latte, cappuccino, cold brew, mocha, Americano, etc. 3-4 items marked as `featured: true` for home page display.
- **Validate:** `test -f coffee-shop/data/menu.json && node -e "const d=require('./coffee-shop/data/menu.json'); console.log('Items:', d.length)"`

#### T5: Create EJS view partials (head, nav, footer)
- **Action:** CREATE `coffee-shop/views/partials/`
- **Description:**
  - `head.ejs` — `<head>` with charset, viewport meta, title variable (`<%= title %>`), CSS links to style.css, Google Fonts (optional)
  - `nav.ejs` — Responsive navbar with logo/brand name "Brew & Bean", nav links (Home, Menu, About, Contact), hamburger toggle button for mobile. Highlights active page based on current URL.
  - `footer.ejs` — Footer with copyright ©, tagline, social media icon links (CSS-styled)
- **Validate:** `test -f coffee-shop/views/partials/head.ejs && test -f coffee-shop/views/partials/nav.ejs && test -f coffee-shop/views/partials/footer.ejs`

#### T6: Create home page (views/pages/home.ejs)
- **Action:** CREATE `coffee-shop/views/pages/home.ejs`
- **Depends:** T5 (uses partials)
- **Description:** Home page with: (1) Hero section — large background area with shop name, tagline, and CTA button linking to menu; (2) Featured coffees section — grid of 3-4 featured items (name, price, image placeholder with ☕), each linking to menu or details. Includes partials via `<%- include() %>`.
- **Validate:** `test -f coffee-shop/views/pages/home.ejs`

#### T7: Create menu page (views/pages/menu.ejs)
- **Action:** CREATE `coffee-shop/views/pages/menu.ejs`
- **Depends:** T5 (uses partials)
- **Description:** Full coffee menu displayed in responsive grid. Each item card shows: (1) CSS image placeholder with ☕ emoji, (2) Coffee name, (3) Short description, (4) Price. Items grouped by category (hot, cold, etc.) with section headers. Includes partials.
- **Validate:** `test -f coffee-shop/views/pages/menu.ejs`

#### T8: Create about page (views/pages/about.ejs)
- **Action:** CREATE `coffee-shop/views/pages/about.ejs`
- **Depends:** T5 (uses partials)
- **Description:** About page with: (1) Story section — narrative about the coffee shop's founding and passion for coffee; (2) Mission/values section; (3) Location section with address and "find us" info. Warm, inviting tone. Includes partials.
- **Validate:** `test -f coffee-shop/views/pages/about.ejs`

#### T9: Create contact page (views/pages/contact.ejs)
- **Action:** CREATE `coffee-shop/views/pages/contact.ejs`
- **Depends:** T5 (uses partials)
- **Description:** Contact page with: (1) Intro text — "We'd love to hear from you"; (2) Form with fields: name (text), email (email), message (textarea), submit button; (3) Success message display (conditionally shown when `success` variable is passed); (4) Error messages per field (conditionally shown when `errors` object is passed). Includes partials. Form action POST to `/contact`.
- **Validate:** `test -f coffee-shop/views/pages/contact.ejs`

#### T10: Create CSS stylesheet (public/css/style.css)
- **Action:** CREATE `coffee-shop/public/css/style.css`
- **Description:** Complete coffee-themed stylesheet:
  - Color palette: warm browns (`#3b141c`, `#4a2c2a`, `#54372a`), amber/gold accents (`#d3ad7f`, `#c67c4e`), cream backgrounds (`#faf4f5`, `#FFF8F0`), dark text (`#252525`)
  - Mobile-first responsive design with breakpoints at 768px (tablet) and 1024px (desktop)
  - Flexbox navbar with hamburger toggle styling
  - CSS Grid for menu items (1-col mobile → 2-col tablet → 3-col desktop)
  - Card styles for coffee items with image placeholder styling
  - Hero section with gradient overlay
  - Form styling (inputs, textarea, button)
  - Footer styling
  - Smooth transitions and hover effects
- **Validate:** `test -f coffee-shop/public/css/style.css`

#### T11: Create client-side JS (public/js/main.js)
- **Action:** CREATE `coffee-shop/public/js/main.js`
- **Description:** Client-side JavaScript with: (1) Hamburger menu toggle — click handler to show/hide nav links on mobile; (2) Contact form validation — checks name not empty, email format, message not empty, shows inline error messages before submit; (3) Smooth scroll for anchor links. Uses vanilla JavaScript (no frameworks).
- **Validate:** `test -f coffee-shop/public/js/main.js && node -c coffee-shop/public/js/main.js`

#### T12: npm install and verify server start
- **Action:** UPDATE `coffee-shop/package.json` (post-setup validation)
- **Depends:** All prior tasks (T1 through T11)
- **Description:** Run `npm install` in the coffee-shop directory to install Express and EJS. Then start the server briefly to verify it boots without errors. This task validates the entire project is functional.
- **Validate:** `npm install 2>&1 | tail -5` then `timeout 5 node coffee-shop/server.js 2>&1 || true`

## Testing Strategy
- **Syntax validation:** Run `node -c` on all `.js` files to check for syntax errors
- **JSON validation:** Node.js `require()` on `data/menu.json` valid JSON
- **Build verification:** `npm install` completes without errors
- **Server smoke test:** Start server with timeout, verify it binds and logs startup message
- **Visual verification:** Manually open `http://localhost:3000` and navigate all pages

## Validation Plan
- **File structure check:** `ls -R coffee-shop/` to confirm all expected files exist
- **Syntax check:** `for f in $(find coffee-shop -name '*.js' -not -path '*/node_modules/*'); do node -c "$f"; done`
- **npm install:** `test -d coffee-shop/node_modules && echo 'node_modules exists'`
- **Server start:** `timeout 3 node coffee-shop/server.js 2>&1 || true` (server will be killed by timeout, that's OK)

---
*DCW artifact — generated by deterministic-code-workflow*
