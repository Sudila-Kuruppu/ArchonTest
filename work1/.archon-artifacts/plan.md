# DCW PLAN — Fix E2E Test Issues (Brew & Bean Coffee Shop)

## Meta
- **Feature:** Fix E2E Test Issues
- **Phase:** PLAN
- **Date:** 2026-06-06

## Summary
Fix 5 issues identified by automated Chromium/Playwright E2E testing across mobile/tablet/desktop viewports: mobile hamburger menu never visible (CRITICAL), missing meta description (MEDIUM), emoji image placeholders (LOW/LOW), and Google Fonts 404 when offline (LOW).

### UX Flow
```
Before: Mobile nav is broken (hamburger always hidden), no SEO meta tags, coffee cards use emoji placeholders, fonts 404 offline
After:  Mobile nav works with hamburger toggle, pages have meta descriptions, coffee cards show real product images, fonts load from local files
```

## Scope

### In Scope
- Add `@media (max-width: 767px)` CSS rule to make hamburger visible and toggle nav-links on mobile
- Add `<meta name="description">` tag to `head.ejs` for SEO
- Add `.coffee-card-img img` CSS rule for proper image display in coffee cards
- Add `image` URL field to all 8 menu items in `menu.json`
- Replace ☕ emoji with `<img>` tags in `home.ejs` (featured coffees — up to 4 cards)
- Replace ☕ emoji with `<img>` tags in `menu.ejs` (all 8 menu items across categories)
- Create `public/fonts/` directory and download WOFF2 font files for Playfair Display (400, 700) and Inter (400, 500, 600)
- Add `@font-face` declarations at top of `style.css` for self-hosted fonts with `font-display: swap`
- Remove Google Fonts external `<link>` tags from `head.ejs`

### Out of Scope
- Adding a build system or bundler
- Adding a test framework or unit tests
- Redesigning layout or visual style
- Adding new pages, routes, or functionality
- Changing menu data structure beyond adding `image` URLs
- Accessibility features beyond what's specified
- Performance optimization beyond font self-hosting

## Task Overview

### Dependency Order
```
T1 ─┐
T2 ─┤
T3 ─┤
T4 ─┤
T7 ─┤
    ├──> T5 (depends T4)
    ├──> T6 (depends T4)
    ├──> T8 (depends T7)
    └──> T9 (depends T7)
```

Root tasks (T1, T2, T3, T4, T7) can be done in parallel. T5/T6 depend on T4 (image URLs). T8/T9 depend on T7 (font files).

### Task Table
| ID | Action | File | Depends | Validate |
|----|--------|------|---------|----------|
| T1 | UPDATE | `coffee-shop/public/css/style.css` | — | `grep` for media query + `.hamburger { display: flex` |
| T2 | UPDATE | `coffee-shop/views/partials/head.ejs` | — | `grep` for meta description tag |
| T3 | UPDATE | `coffee-shop/public/css/style.css` | — | `grep` for `.coffee-card-img img` |
| T4 | UPDATE | `coffee-shop/data/menu.json` | — | `node` JSON check — all 8 items have `image` field |
| T5 | UPDATE | `coffee-shop/views/pages/home.ejs` | T4 | `grep` for `<img` + server syntax check |
| T6 | UPDATE | `coffee-shop/views/pages/menu.ejs` | T4 | `grep` for `<img` + server syntax check |
| T7 | CREATE | `coffee-shop/public/fonts/` | — | Dir exists + `.woff2` files present |
| T8 | UPDATE | `coffee-shop/public/css/style.css` | T7 | `grep` for `@font-face` + Playfair + Inter |
| T9 | UPDATE | `coffee-shop/views/partials/head.ejs` | T7 | Google Fonts link removed, local stylesheet kept |

### Task Details

#### T1: Add responsive hamburger menu CSS rule for mobile
- **Action:** UPDATE `coffee-shop/public/css/style.css`
- **Details:** Add `@media (max-width: 767px)` block at the end of the file (after the desktop section at line 687) with:
  - `.hamburger { display: flex; }` — show hamburger button on mobile
  - `.nav-links { display: none; flex-direction: column; position: absolute; top: var(--header-height); left: 0; right: 0; background: var(--color-primary); padding: 1rem; gap: 0.5rem; }` — hide nav by default on mobile, style as dropdown
  - `.nav-links.nav-open { display: flex; }` — show nav when toggled
- **Validate:** `grep -q 'max-width: 767px'` and `grep -q '.hamburger { display: flex'`

#### T2: Add meta description tag to head.ejs
- **Action:** UPDATE `coffee-shop/views/partials/head.ejs`
- **Details:** After line 5 (`<meta name="viewport">`), add:
  `<meta name="description" content="Brew &amp; Bean — handcrafted coffee, warm conversations, and a cozy neighbourhood café.">`
- **Validate:** `grep -q 'meta name="description"'`

#### T3: Add CSS rule for coffee card images
- **Action:** UPDATE `coffee-shop/public/css/style.css`
- **Details:** After the `.coffee-card-img` rule block (line 317), add:
  ```css
  .coffee-card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  ```
- **Validate:** `grep -q '.coffee-card-img img'`

#### T4: Add image URLs to all 8 menu items in menu.json
- **Action:** UPDATE `coffee-shop/data/menu.json`
- **Details:** Add an `image` field with Unsplash photo URL to each menu item:
  | id | Name | Image URL |
  |----|------|-----------|
  | 1 | Classic Espresso | `https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop` |
  | 2 | Vanilla Latte | `https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=300&fit=crop` |
  | 3 | Cappuccino | `https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop` |
  | 4 | Caramel Macchiato | `https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=300&fit=crop` |
  | 5 | Cold Brew | `https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop` |
  | 6 | Iced Mocha | `https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=300&fit=crop` |
  | 7 | Matcha Latte | `https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=300&fit=crop` |
  | 8 | Americano | `https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop` |
- **Validate:** Node script that loads JSON and asserts each item has `image`

#### T5: Replace emoji with <img> in home.ejs featured coffees
- **Action:** UPDATE `coffee-shop/views/pages/home.ejs`
- **Details:** Replace line 22:
  ```ejs
  <div class="coffee-card-img">☕</div>
  ```
  with:
  ```ejs
  <div class="coffee-card-img">
    <% if (item.image) { %>
      <img src="<%= item.image %>" alt="<%= item.name %>" loading="lazy">
    <% } else { %>
      ☕
    <% } %>
  </div>
  ```
- **Patterns:** Mirror the `<img>` pattern (also used in T6 for menu.ejs)
- **Depends:** T4 (menu.json with image URLs)
- **Validate:** `grep -q '<img'` in home.ejs + server syntax check

#### T6: Replace emoji with <img> in menu.ejs all coffee cards
- **Action:** UPDATE `coffee-shop/views/pages/menu.ejs`
- **Details:** Replace line 18:
  ```ejs
  <div class="coffee-card-img">☕</div>
  ```
  with:
  ```ejs
  <div class="coffee-card-img">
    <% if (item.image) { %>
      <img src="<%= item.image %>" alt="<%= item.name %>" loading="lazy">
    <% } else { %>
      ☕
    <% } %>
  </div>
  ```
- **Patterns:** Mirror the same pattern from T5 (home.ejs)
- **Depends:** T4 (menu.json with image URLs)
- **Validate:** `grep -q '<img'` in menu.ejs + server syntax check

#### T7: Create fonts directory and download WOFF2 files
- **Action:** CREATE `coffee-shop/public/fonts/`
- **Details:**
  1. Create directory: `mkdir -p coffee-shop/public/fonts/`
  2. Download Playfair Display (400, 700) and Inter (400, 500, 600) WOFF2 files using google-webfonts-helper or Fontsource API. Expected files:
     - `playfair-display-regular.woff2`
     - `playfair-display-700.woff2`
     - `inter-regular.woff2`
     - `inter-500.woff2`
     - `inter-600.woff2`
- **Validate:** Directory exists + at least one `.woff2` file present

#### T8: Add @font-face declarations to style.css
- **Action:** UPDATE `coffee-shop/public/css/style.css`
- **Details:** Insert at line 1 (before CSS variables), 5 `@font-face` blocks:
  - Playfair Display (400) — `url('/fonts/playfair-display-regular.woff2') format('woff2')`
  - Playfair Display (700) — `url('/fonts/playfair-display-700.woff2') format('woff2')`
  - Inter (400) — `url('/fonts/inter-regular.woff2') format('woff2')`
  - Inter (500) — `url('/fonts/inter-500.woff2') format('woff2')`
  - Inter (600) — `url('/fonts/inter-600.woff2') format('woff2')`
  - All with `font-display: swap`
- **Depends:** T7 (font files must exist — referenced in `url()`)
- **Validate:** `grep` for `@font-face`, `Playfair Display`, `Inter`

#### T9: Remove Google Fonts external <link> tags from head.ejs
- **Action:** UPDATE `coffee-shop/views/partials/head.ejs`
- **Details:** Remove lines 7-9 (3 link tags):
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display...&family=Inter...&display=swap" rel="stylesheet">
  ```
  Keep the local stylesheet link (line 10).
- **Depends:** T7 (font files must be available since external links are removed)
- **Validate:** Confirm `fonts.googleapis.com` NOT present, but `<link rel="stylesheet" href="/css/style.css">` still present

## Testing Strategy
Since no test framework is configured:
- **Syntax validation:** `node --check server.js` and `node --check routes/index.js` after EJS template changes (EJS templates are validated at render time)
- **JSON validation:** Parse `menu.json` with Node.js to confirm valid JSON with all required fields
- **Server smoke test:** Start the Express server briefly to confirm it loads without errors
- **File content checks:** Use `grep` to confirm expected patterns exist in modified files
- **Negative checks:** Confirm Google Fonts external URLs are removed

### Edge Cases Handled
- **Missing image fallback:** If `item.image` is missing in EJS templates, emoji fallback still renders
- **Font file missing:** If font files fail to download, browser falls back to Georgia/Arial via existing CSS `font-family` stacks
- **Mobile nav close:** JS already handles click-outside and link-click close behaviors

## Validation Plan
- **Syntax check:** `node --check coffee-shop/server.js && node --check coffee-shop/routes/index.js`
- **JSON validity:** `node -e "JSON.parse(require('fs').readFileSync('./coffee-shop/data/menu.json','utf8'))"`
- **Server start:** `timeout 3 node -e "const app = require('./coffee-shop/server.js'); setTimeout(() => process.exit(0), 1000);"`
- **Lint:** No linter configured — skipped
- **Tests:** No test framework configured — skipped
- **Build:** No build step configured — skipped

---
*DCW artifact — generated by deterministic-code-workflow*
