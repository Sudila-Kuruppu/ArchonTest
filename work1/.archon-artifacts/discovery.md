# DCW DISCOVER — Codebase & Research Report

## Meta
- **Feature:** Fix E2E Test Issues — Brew & Bean Coffee Shop
- **Phase:** DISCOVER
- **Date:** 2026-06-06

## Codebase Overview
- **Framework:** Express.js (v4.21.0) with EJS templating (v3.1.10)
- **Language:** JavaScript (Node.js, no bundler/transpiler)
- **Test framework:** No test framework installed; E2E tests exist externally (Chromium/Playwright)
- **Source root:** `/home/user/archontesting/work1/coffee-shop/`

### Key Files
| File | Purpose |
|------|---------|
| `coffee-shop/server.js` | Express app entry point, route mounting, 404 handler |
| `coffee-shop/routes/index.js` | All route definitions (home, menu, about, contact GET/POST) |
| `coffee-shop/views/partials/head.ejs` | HTML `<head>` partial — charset, viewport, title, font links, stylesheet |
| `coffee-shop/views/partials/nav.ejs` | Navigation bar with hamburger button and nav links |
| `coffee-shop/views/partials/footer.ejs` | Footer with links, social icons, copyright |
| `coffee-shop/views/pages/home.ejs` | Home page — featured coffees grid with emoji placeholders |
| `coffee-shop/views/pages/menu.ejs` | Menu page — full coffee list grouped by category with emoji placeholders |
| `coffee-shop/views/pages/about.ejs` | About page — story, mission, location |
| `coffee-shop/views/pages/contact.ejs` | Contact page — form with server-side validation |
| `coffee-shop/views/pages/404.ejs` | 404 error page |
| `coffee-shop/public/css/style.css` | All styles — coffee-themed, mobile-first responsive |
| `coffee-shop/public/js/main.js` | Client-side JS — hamburger toggle, form validation, active nav |
| `coffee-shop/data/menu.json` | 8 coffee items with id, name, description, price, category, featured |
| `coffee-shop/package.json` | Dependencies: express ^4.21.0, ejs ^3.1.10 |

## Existing Patterns

### Template Pattern
```
file:coffee-shop/views/pages/home.ejs:1-2
Every page includes <%- include('../partials/head', { title: title }) %> and <%- include('../partials/nav', { currentPage: currentPage }) %> at the top, then <%- include('../partials/footer') %> at the bottom.
Data is passed from routes as an object with `title`, `currentPage`, and page-specific fields.
```

### Component Pattern
```
file:coffee-shop/views/pages/home.ejs:21-28
Coffee cards use the pattern:
  <div class="coffee-card">
    <div class="coffee-card-img">☕</div>     ← emoji placeholder
    <div class="coffee-card-body">
      <h3><%= item.name %></h3>
      <p><%= item.description %></p>
      <span class="coffee-card-price">$<%= item.price.toFixed(2) %></span>
    </div>
  </div>
The same pattern duplicates in both home.ejs (line 22) and menu.ejs (line 18) — 8 total cards.
```

### Styling Pattern
```
file:coffee-shop/public/css/style.css:1-687
Single CSS file with:
  - CSS custom properties (lines 7-34) for colors, fonts, shadows, radii, max-width
  - Mobile-first base styles (lines 36-625): single-column grids, hamburger hidden
  - Tablet @media (min-width: 768px) at line 630: 2-col grids
  - Desktop @media (min-width: 1024px) at line 667: 3-4 col grids
  - No max-width: 767px media query exists
```

### Navigation Pattern
```
file:coffee-shop/public/js/main.js:7-31
Hamburger toggle uses class `nav-open` on `.nav-links` and `aria-expanded` on button.
The JS already supports toggling — just needs CSS media query to activate.
```

### Error Handling Pattern
```
file:coffee-shop/routes/index.js:70-117
Server-side: try/catch for menu data load (lines 7-12), field-level validation with errors object.
Client-side: main.js lines 36-81 — form validation with preventDefault.
404: server.js line 22-24 — renders 404.ejs for unmatched routes.
```

### Styling Pattern for .coffee-card-img
```
file:coffee-shop/public/css/style.css:309-317
.coffee-card-img {
  width: 100%;
  height: 180px;
  background: gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;  ← for emoji
}
The background gradient and centering mean images will need to cover/contain the area properly.
```

### Variable Font Fallbacks in CSS
```
file:coffee-shop/public/css/style.css:21-22
--font-heading: 'Playfair Display', Georgia, serif;
--font-body: 'Inter', 'Segoe UI', Arial, sans-serif;
System fallbacks already declared in CSS custom properties.
```

## Web Research

### Self-Hosting Google Fonts (Playfair Display + Inter)
- **Source:** gwfh.mranftl.com (google-webfonts-helper), multiple articles (web.dev, FontFYI)
- **Finding:** The most practical approach for a simple Express/EJS site without a build system is:
  1. Use google-webfonts-helper API to download WOFF2 files for Playfair Display (weights 400, 700) and Inter (weights 400, 500, 600)
  2. Place them in `public/fonts/` directory
  3. Add `@font-face` declarations at the top of `style.css` replacing the Google Fonts `<link>` tags
  4. Use `font-display: swap` for both fonts
  5. Remove the `preconnect` and stylesheet `<link>` tags from `head.ejs`
- **Relevance:** Fixes issue #4 (Google Fonts 404 when offline) and improves performance
- **Key commands:** `curl "https://gwfh.mranftl.com/api/fonts/inter?download=zip&subsets=latin&formats=woff2&variants=regular,500,600" -o inter.zip`

### Unsplash Images for Coffee Products
- **Source:** unsplash.com/documentation, unsplash.com/developers
- **Finding:** Unsplash Source API (`source.unsplash.com`) is deprecated. The recommended approach is to use direct hotlinked image URLs from the Unsplash CDN. For a static site without an API key, use direct Unsplash photo URLs for specific coffee images. Example direct image URLs:
  - Espresso: `https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop` (espresso shot)
  - Latte: `https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=300&fit=crop` (latte art)
  - Cappuccino: `https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop`
  - Cold Brew: `https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop` (cold coffee)
  - General coffee: Multiple specific Unsplash photo IDs available
- **Relevance:** Fixes issues #3 and #5 — replace emoji placeholders with real product images

### Hamburger Menu CSS Pattern
- **Source:** Standard responsive nav pattern
- **Finding:** The standard mobile hamburger pattern requires:
  ```css
  @media (max-width: 767px) {
    .hamburger { display: flex; }
    .nav-links { display: none; }
    .nav-links.nav-open { display: flex; }
  }
  ```
  The JS in `main.js` already adds/removes `nav-open` class on click — only CSS is missing.
- **Relevance:** Fixes issue #1 — critical mobile navigation bug

## Integration Points
- [ ] `coffee-shop/public/css/style.css:172` — Add `@media (max-width: 767px)` rule for hamburger visibility and nav-links toggle
- [ ] `coffee-shop/views/partials/head.ejs:6` — Add `<meta name="description">` tag after viewport meta
- [ ] `coffee-shop/views/pages/home.ejs:22` — Replace `☕` emoji with `<img>` tag in featured coffee card
- [ ] `coffee-shop/views/pages/menu.ejs:18` — Replace `☕` emoji with `<img>` tag in menu coffee cards
- [ ] `coffee-shop/views/partials/head.ejs:7-9` — Remove Google Fonts preconnect/stylesheet links, add `@font-face` CSS to style.css
- [ ] `coffee-shop/public/css/style.css` — Add `@font-face` declarations for Playfair Display (400, 700) and Inter (400, 500, 600)
- [ ] `coffee-shop/public/fonts/` — Create directory and add self-hosted WOFF2 font files

## Coffee-to-Image Mapping (for issues #3 and #5)
Based on Unsplash research, suitable images for each menu item:

| Coffee Item | Suggested Unsplash Subject | Image Style |
|-------------|---------------------------|-------------|
| Classic Espresso | Espresso shot with crema | Dark, rich, close-up |
| Vanilla Latte | Latte art in white cup | Creamy, warm tones |
| Cappuccino | Cappuccino with foam art | Brown/white layers |
| Caramel Macchiato | Layered espresso drink | Golden, caramel drizzle |
| Cold Brew | Cold brew on ice | Dark, refreshing, ice visible |
| Iced Mocha | Chocolate coffee drink | Dark, cold glass |
| Matcha Latte | Matcha green tea latte | Green, vibrant |
| Americano | Black coffee in mug | Simple, clean |

## Clarifications
- None — all issues are clearly described with file:line references in `E2E-ISSUES.md` and `input.txt`
- Note: For the self-hosted fonts approach, actual WOFF2 files need to be downloaded and added to the repo (or we use an alternative CSS-based fallback approach)
- Note: The `display: none` on `.hamburger` is at line 172 of style.css (as noted in input.txt), but CSS line 173 shows `display: none` — this matches

---
*DCW artifact — generated by deterministic-code-workflow*
