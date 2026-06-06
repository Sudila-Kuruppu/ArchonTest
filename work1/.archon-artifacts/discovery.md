# DCW DISCOVER — Codebase & Research Report

## Meta
- **Feature:** Coffee Shop Website (Node.js + Express + EJS multi-page site)
- **Phase:** DISCOVER
- **Date:** 2026-06-06

## Codebase Overview
- **Framework:** Express.js 4.x (server-side rendered, no frontend framework)
- **Language:** JavaScript (CommonJS) with EJS templating
- **Template Engine:** EJS (Embedded JavaScript)
- **Test framework:** None (greenfield project)
- **Source root:** `/home/user/archontesting/work1/coffee-shop/` (NOT YET CREATED)
- **Node version:** v20.19.1
- **npm version:** 10.8.2

### Workspace Context
- The repository contains a separate project `jobscraper/` (React + TypeScript + Express API — a job aggregation app)
- The `coffee-shop/` directory is a **new greenfield project** to be created alongside `jobscraper/`
- No existing EJS, CSS, or Node.js Express template files at the workspace root
- No `node_modules` or `package.json` exist in `work1/` for the coffee shop project

### Key Files (Existing Reference)
| File | Purpose |
|------|---------|
| `work1/jobscraper/server/src/index.ts` | Express server setup pattern (CORS, JSON parsing, route mounting) |
| `work1/jobscraper/server/package.json` | Example Express package config (CommonJS `"type": "module"`) |
| `work1/.idx/dev.nix` | Firebase Studio Nix environment config (Node.js available) |

## Existing Patterns

### Express Server Pattern (from jobscraper reference)
```
file:work1/jobscraper/server/src/index.ts:1-27
```
Express server with:
- `express()` app creation
- Middleware setup (cors, json parser)
- Route mounting via `app.use('/prefix', router)`
- Port from `process.env.PORT || 3001`
- `app.listen(PORT, callback)`

### Route Handler Pattern (from jobscraper reference)
```
file:work1/jobscraper/server/src/routes/jobs.ts:1-21
```
Router pattern:
- `import { Router } from 'express'`
- `const router = Router()`
- `router.get('/path', async (req, res) => { ... })`
- `export default router`
- Try/catch with error responses

### Note on Stack Difference
The coffee shop uses **plain JavaScript (not TypeScript)**, **EJS templates (not React)**, and **server-rendered multi-page app (not SPA)**. Patterns from jobscraper are adapted.

## Web Research

### Express + EJS Project Setup
- **Source:** Multiple guides (thelinuxcode.com, LogRocket, DigitalOcean, MDN)
- **Finding:** Standard setup pattern:
  ```js
  const express = require('express');
  const path = require('path');
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: false }));
  ```
- **Relevance:** Core server setup for the coffee shop

### EJS Partials & Layout Pattern
- **Source:** EJS docs, LogRocket, SyntaxStudy
- **Finding:** EJS does not have built-in layout blocks but supports `include()` for partials. Recommended structure:
  ```
  views/
    partials/
      head.ejs
      nav.ejs
      footer.ejs
    pages/
      home.ejs
      menu.ejs
      about.ejs
      contact.ejs
  ```
  Each page includes partials:
  ```ejs
  <%- include('../partials/head') %>
  <%- include('../partials/nav') %>
  <!-- page content -->
  <%- include('../partials/footer') %>
  ```
- **Relevance:** Coffee shop pages will use this partial composition pattern. The `express-ejs-layouts` package is an alternative but manual includes keep dependencies minimal.

### Coffee Shop Theming & Color Palette
- **Source:** Multiple coffee website design references (Amber Cafe, Meridian, CodingNepal, prabasajee/coffee-shop)
- **Finding:** Common coffee-themed palette:
  - **Primary:** Warm brown (espresso) — `#3b141c`, `#4a2c2a`, `#2c1810`
  - **Secondary:** Amber/golden accents — `#d3ad7f`, `#f3961c`, `#c67c4e`
  - **Background:** Cream/light — `#faf4f5`, `#FFF8F0`, `#f5f0eb`
  - **Text:** Dark brown/charcoal — `#252525`, `#2c1810`
  - **White:** `#fff` for contrast areas
- **Relevance:** Directly applicable to coffee shop theme; warm browns and creams match the requirements

### Responsive Design Patterns
- **Source:** CodingNepal coffee website tutorial, CSS Grid/Flexbox patterns
- **Finding:** 
  - Mobile-first approach with CSS media queries (breakpoints: 1024px, 900px, 640px)
  - Flexbox for navbar and cards
  - CSS Grid for menu item layout (3-column desktop → 2-column tablet → 1-column mobile)
  - `clamp()` for fluid typography
  - Hamburger menu for mobile navigation
- **Relevance:** Coffee shop must be responsive; using CSS Grid/Flexbox without a framework

### Contact Form Handling (Express)
- **Source:** Multiple Express form handling tutorials
- **Finding:** Standard pattern:
  ```js
  app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    // Validate, store/email, send response
    res.render('pages/contact', { success: true });
  });
  ```
  With `express.urlencoded({ extended: true })` middleware for parsing form data.
- **Relevance:** Contact form on the coffee shop site needs POST handling, validation, and confirmation

### Image Placeholder Patterns
- **Source:** Web development best practices
- **Finding:** Use CSS-styled div placeholders with coffee cup icon/emoji (☕) or SVG placeholders. Unsplash CDN URLs can provide realistic demo images (e.g., `https://images.unsplash.com/photo-xxxx`). For MVP, CSS placeholders with gradients and icons are sufficient.
- **Relevance:** Coffee menu items need image placeholders

## Integration Points

The coffee shop is a **standalone greenfield project** — it does not integrate with the existing jobscraper codebase. Integration points are within itself:

- [ ] `/home/user/archontesting/work1/coffee-shop/package.json` — New project manifest with Express + EJS dependencies
- [ ] `/home/user/archontesting/work1/coffee-shop/server.js` — Express server entry point
- [ ] `/home/user/archontesting/work1/coffee-shop/views/partials/head.ejs` — HTML head partial (meta, title, styles)
- [ ] `/home/user/archontesting/work1/coffee-shop/views/partials/nav.ejs` — Navigation bar partial
- [ ] `/home/user/archontesting/work1/coffee-shop/views/partials/footer.ejs` — Footer partial
- [ ] `/home/user/archontesting/work1/coffee-shop/views/pages/home.ejs` — Home page (hero, featured coffees)
- [ ] `/home/user/archontesting/work1/coffee-shop/views/pages/menu.ejs` — Menu page (coffee items with name, description, price, image)
- [ ] `/home/user/archontesting/work1/coffee-shop/views/pages/about.ejs` — About page (story, location)
- [ ] `/home/user/archontesting/work1/coffee-shop/views/pages/contact.ejs` — Contact page (form)
- [ ] `/home/user/archontesting/work1/coffee-shop/public/css/style.css` — Main stylesheet
- [ ] `/home/user/archontesting/work1/coffee-shop/public/js/main.js` — Client-side JavaScript (menu toggle, form validation)
- [ ] `/home/user/archontesting/work1/coffee-shop/routes/index.js` — Route definitions for all pages

## Clarifications

- **None** — the feature description is clear and complete. All requirements are well-specified.

## Project Structure Recommendation

Based on research and best practices, the recommended structure is:

```
coffee-shop/
├── package.json
├── server.js                  # Express entry point
├── routes/
│   └── index.js               # Page routes (home, menu, about, contact)
├── views/
│   ├── partials/
│   │   ├── head.ejs           # <head> with meta, title, CSS links
│   │   ├── nav.ejs            # Navigation bar (responsive, hamburger on mobile)
│   │   └── footer.ejs         # Footer with copyright, social links
│   └── pages/
│       ├── home.ejs           # Hero section + featured coffees preview
│       ├── menu.ejs           # Full coffee menu with grid of items
│       ├── about.ejs          # Story and location info
│       └── contact.ejs        # Contact form (name, email, message)
├── public/
│   ├── css/
│   │   └── style.css          # All styles (coffee theme, responsive)
│   └── js/
│       └── main.js            # Client-side interactivity
└── data/
    └── menu.json              # Coffee menu data (name, description, price, image)
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module system | CommonJS (`require`) | Simpler setup, no `"type": "module"` needed, widely documented |
| Layout strategy | Manual `<%- include() %>` partials | Zero extra dependencies, straightforward for 4 pages |
| CSS framework | None (vanilla CSS) | No framework dependency; coffee theme is custom |
| Form handling | Server-side POST + validation | Standard Express pattern with `urlencoded` middleware |
| Image placeholders | CSS-styled divs with coffee icon | Works without external assets; can be upgraded to real images later |
| Server port | `process.env.PORT \|\| 3000` | Standard Express pattern |
| Responsive approach | Mobile-first with 3 breakpoints | Best practice; matches coffee website reference patterns |

---
*DCW artifact — generated by deterministic-code-workflow*
