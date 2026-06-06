# E2E Test Issues — Brew & Bean Coffee Shop

Found via automated Chromium/Playwright testing across mobile (375px), tablet (768px), and desktop (1280px) viewports.

---

## 1. CRITICAL — Mobile hamburger menu never visible

**File:** `public/css/style.css:124`

```css
.hamburger {
  display: none;  /* ← always hidden */
}
```

The hamburger button is permanently `display: none`. There is no `@media (max-width: 767px)` rule to make it visible, so the mobile navigation is completely unusable on phones. The nav links are shown inline even at 375px viewport width.

**Impact:** Mobile users cannot navigate the site.

**Fix:** Add a media query:
```css
@media (max-width: 767px) {
  .hamburger { display: flex; }
  .nav-links { display: none; }
  .nav-links.nav-open { display: flex; }
}
```

---

## 2. MEDIUM — Missing meta description on all pages

**File:** `views/partials/head.ejs:6`

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>...</title>
```

There is no `<meta name="description">` tag. Search engines will show an empty snippet in results.

**Impact:** Hurts SEO — no control over how the site appears in search results.

**Fix:** Add after the viewport meta:
```html
<meta name="description" content="Brew &amp; Bean — handcrafted coffee, warm conversations, and a cozy neighbourhood café.">
```

---

## 3. LOW — Emoji placeholders instead of real product images

**Files:**
- `views/pages/home.ejs:22` — `<div class="coffee-card-img">☕</div>`
- `views/pages/menu.ejs:18` — `<div class="coffee-card-img">☕</div>`

All 8 coffee cards use the ☕ emoji as the image placeholder. No actual product photography or illustrations are used.

**Impact:** Looks unprofessional for production, but acceptable for a prototype/class project.

**Fix:** Replace with `<img>` tags pointing to actual product images.

---

## 4. LOW — Google Fonts 404 when offline

**File:** `views/partials/head.ejs:7-9`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display...&family=Inter...&display=swap" rel="stylesheet">
```

The external Google Fonts CSS returns 404 when the browser has no internet access (e.g., headless testing, offline dev). Fonts will not load and the site will fall back to Georgia/Arial.

**Impact:** Minor — degrades gracefully, but the typography changes.

**Fix:** Self-host the fonts or add a `@font-face` fallback in CSS.

also add suitable images for each places.