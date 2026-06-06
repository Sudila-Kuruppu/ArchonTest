# DCW PLAN — DressCave Phase 0: Prerequisite Setup

## Meta
- **Feature:** DressCave Phase 0 — Prerequisite Setup (No Supabase)
- **Phase:** PLAN
- **Date:** 2026-06-06
- **Project:** Next.js e-commerce platform for women and children's clothing
- **Working directory:** `/home/user/archontesting/work1/dresscave/`

## Summary

Set up the complete development foundation for the DressCave e-commerce platform. Phase 0 installs and configures all required tooling — Next.js 14.x with TypeScript/Tailwind/ESLint/App Router, shadcn/ui components, Zustand + nuqs state management, Vitest + React Testing Library for tests, Zod + react-hook-form for validation, Next.js Image optimization, and Tailwind CSS design tokens — without any Supabase dependencies. After Phase 0, the project will be ready for Epic 1 (Authentication) implementation.

### UX Flow
```
Before: No project exists — only documentation files in dresscave/
After:  Fully scaffolded Next.js 14.x project with build, test, and type-check passing
```

## Scope

### In Scope
1. Initialize Next.js 14.x project via `create-next-app@14.2` with TypeScript, Tailwind CSS, ESLint, App Router, `@/*` import alias
2. Initialize shadcn/ui with default style and add core components: button, card, input, select, dialog
3. Install Zustand + nuqs; create SSR-safe Zustand stores (cart, wishlist) using Context provider pattern; add NuqsAdapter to root layout
4. Install Vitest, React Testing Library, jsdom; configure vitest.config.ts with path aliases; create tests/setup.ts
5. Install Zod, react-hook-form, @hookform/resolvers; create validation schemas (product, order, user) in lib/schemas/
6. Configure Next.js Image component for local/placeholder image domains (no Supabase CDN)
7. Configure Tailwind CSS with custom design tokens, mobile-first breakpoints, 44px touch targets, 60fps animations

### Out of Scope
- Supabase setup, libraries, configurations, or client files (lib/supabase/ is skipped entirely)
- Playwright installation or configuration (CLI is pre-installed in environment)
- Any e-commerce feature code (product pages, cart UI, API routes, auth, admin dashboard)
- Payment, checkout, or WhatsApp integration
- TanStack Query (deferred to later phases if needed)
- Additional route groups, route handlers, or pages beyond default scaffold
- Any custom application components beyond shadcn/ui base components

## Task Overview

### Dependency Order
```
T1 (scaffold) → T2 (shadcn) 
              → T3 (state mgmt)
              → T4 (testing)     (all depend on T1 only; implement sequentially)
              → T5 (validation)
              → T6 (next.config)
              → T7 (tailwind)
```

### Task Table
| ID | Action | File | Depends | Validate |
|----|--------|------|---------|----------|
| T1 | CREATE | `dresscave/` (project dir) | — | `ls package.json`, `ls app/layout.tsx`, node version check |
| T2 | CREATE | `dresscave/` (shadcn init) | T1 | `ls components/ui/button.tsx`, `ls lib/utils.ts` |
| T3 | CREATE | `dresscave/lib/store/` + `app/layout.tsx` | T1 | `ls lib/store/cart.ts`, `ls lib/store/wishlist.ts`, `ls lib/store/store-provider.tsx` |
| T4 | CREATE | `dresscave/vitest.config.ts`, `tests/setup.ts` | T1 | `ls vitest.config.ts`, `ls tests/setup.ts` |
| T5 | CREATE | `dresscave/lib/schemas/` | T1 | `ls lib/schemas/product.ts`, `order.ts`, `user.ts` |
| T6 | UPDATE | `dresscave/next.config.*` | T1 | `npx tsc --noEmit` |
| T7 | UPDATE | `dresscave/tailwind.config.*` + `app/globals.css` | T1 | `npx tsc --noEmit` |

### Task Details

#### T1: Initialize Next.js 14.x project
- **Action:** CREATE `dresscave/` (project scaffold via CLI)
- **Command:** `npx create-next-app@14.2.0 dresscave --ts --tailwind --eslint --app --import-alias "@/*" --use-npm`
- **Patterns:** N/A (greenfield create-next-app scaffold)
- **Validate:**
  - `ls dresscave/package.json` — project manifest exists
  - `ls dresscave/app/layout.tsx` — root layout created
  - `ls dresscave/tsconfig.json` — TypeScript configured
  - `ls dresscave/tailwind.config.*` — Tailwind CSS configured
  - `ls dresscave/next.config.*` — Next.js config exists
  - `node -e "require('./dresscave/package.json').dependencies.next"` — Next.js 14.x pinned
- **Key dependencies created:** `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

#### T2: Install and initialize shadcn/ui with core components
- **Action:** CREATE `dresscave/` (via shadcn CLI)
- **Command:** `cd dresscave && npx shadcn@latest init --defaults && npx shadcn@latest add button card input select dialog`
- **Patterns:** N/A (standard shadcn/ui init)
- **Validate:**
  - `ls dresscave/components/ui/button.tsx` — Button component exists
  - `ls dresscave/components/ui/card.tsx` — Card component exists
  - `ls dresscave/components/ui/input.tsx` — Input component exists
  - `ls dresscave/components/ui/select.tsx` — Select component exists
  - `ls dresscave/components/ui/dialog.tsx` — Dialog component exists
  - `ls dresscave/lib/utils.ts` — cn() utility created by shadcn init
  - `ls dresscave/components.json` — shadcn configuration created

#### T3: Install state management (Zustand + nuqs) and create stores
- **Action:** CREATE (stores) + UPDATE (layout.tsx)
- **Command:** `cd dresscave && npm install zustand nuqs`
- **Files to CREATE:**
  - `lib/store/cart.ts` — Zustand cart store (items, addItem, removeItem, updateQuantity, clearCart, computed totals)
  - `lib/store/wishlist.ts` — Zustand wishlist store (productIds, toggleItem, isInWishlist)
  - `lib/store/store-provider.tsx` — React Context provider wrapping Zustand stores for SSR safety (createStore + useRef pattern)
- **Files to UPDATE:**
  - `app/layout.tsx` — Wrap children with `NuqsAdapter` for URL state management
- **Patterns:** Architecture.md State Management section — use `createStore` from `zustand/vanilla` with Context provider pattern for SSR compatibility
- **Validate:**
  - `node -e "require('./node_modules/zustand/package.json')"` — Zustand installed
  - `node -e "require('./node_modules/nuqs/package.json')"` — nuqs installed
  - `ls dresscave/lib/store/cart.ts` — Cart store created
  - `ls dresscave/lib/store/wishlist.ts` — Wishlist store created
  - `ls dresscave/lib/store/store-provider.tsx` — Provider created

#### T4: Install and configure testing frameworks
- **Action:** CREATE (vitest.config.ts, tests/setup.ts, test examples)
- **Command:** `cd dresscave && npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react jsdom`
- **Files to CREATE:**
  - `vitest.config.ts` — Vitest config with jsdom environment, React plugin, `@/` path alias, globals: true, setup file
  - `tests/setup.ts` — Import `@testing-library/jest-dom` for extended matchers
  - `tests/example.test.ts` — Basic placeholder test verifying setup works
- **Patterns:** Architecture.md Testing Framework section — vitest config structure with `@vitejs/plugin-react`, `environment: 'jsdom'`, path alias resolution
- **Validate:**
  - `node -e "require('./node_modules/vitest/package.json')"` — Vitest installed
  - `node -e "require('./node_modules/@testing-library/react/package.json')"` — RTL installed
  - `ls dresscave/vitest.config.ts` — Config file exists
  - `ls dresscave/tests/setup.ts` — Setup file exists
  - `npx vitest run --reporter=verbose` — Tests execute and pass

#### T5: Install data validation and create schemas
- **Action:** CREATE (validation schemas)
- **Command:** `cd dresscave && npm install zod react-hook-form @hookform/resolvers`
- **Files to CREATE:**
  - `lib/schemas/product.ts` — Product schema: name, description, price, category (enum), sizes, colors, images, featured/sale flags, age_range for kids
  - `lib/schemas/order.ts` — Order schema: items (array), total, status enum, notes, timestamps
  - `lib/schemas/user.ts` — User schema: email, profile, custom measurements
- **Patterns:** Architecture.md Data Validation section — Zod schemas with z.infer<T> for type inference, enums for constrained fields, optional/nullable for flexible fields
- **Validate:**
  - `node -e "require('./node_modules/zod/package.json')"` — Zod installed
  - `node -e "require('./node_modules/react-hook-form/package.json')"` — RHF installed
  - `node -e "require('./node_modules/@hookform/resolvers/package.json')"` — Resolvers installed
  - `ls dresscave/lib/schemas/product.ts` — Product schema
  - `ls dresscave/lib/schemas/order.ts` — Order schema
  - `ls dresscave/lib/schemas/user.ts` — User schema

#### T6: Configure Next.js Image optimization
- **Action:** UPDATE `dresscave/next.config.*`
- **Description:** Add `images` configuration to next.config.js with:
  - `remotePatterns` for localhost development + placeholder services (no Supabase CDN)
  - `formats: ['image/avif', 'image/webp']` for modern format conversion
  - `deviceSizes: [640, 750, 828, 1080, 1200]` for responsive images
  - `imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]` for thumbnails
- **Patterns:** Adapted from architecture.md Image Optimization section — replace `*.supabase.co` with `localhost` and placeholders
- **Validate:**
  - `npx tsc --noEmit` — TypeScript compiles cleanly
  - Config file contains `images` key with expected structure

#### T7: Configure Tailwind CSS with custom design tokens
- **Action:** UPDATE `dresscave/tailwind.config.*` + `app/globals.css`
- **Description:** Extend Tailwind config with:
  - Custom color palette matching DressCave brand (from UX spec)
  - Spacing scale optimized for e-commerce (card gaps, section padding)
  - Typography scale for headings, body, captions
  - 44px minimum touch target utilities for mobile accessibility
  - Animation utilities: `transform` + `opacity` based for 60fps performance
  - Keyframes for skeleton loading, fade-in, slide-up patterns
  - All breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Patterns:** Adapted from architecture.md Performance Optimization section and UX design specification
- **Validate:**
  - `npx tsc --noEmit` — TypeScript compiles cleanly
  - Custom tokens referenceable in components

## Testing Strategy

**Phase 0** focuses on infrastructure setup, not application logic. Testing validation:
1. **Type checking** (`npx tsc --noEmit`) ensures all TypeScript compiles correctly
2. **Vitest initialization** — a minimal smoke test (`tests/example.test.ts`) verifies Vitest + jsdom + React Testing Library are wired correctly
3. **Build** (`npm run build`) confirms the entire project builds without errors
4. **Manual verifications:**
   - shadcn/ui components render with correct default styling
   - Zustand stores can be instantiated via the SSR-safe provider
   - nuqs URL state hook works in client components
   - Zod schemas produce correct type inference
   - Tailwind custom tokens are available in className
   - Next.js Image component accepts configured domains

**Edge cases considered:**
- `create-next-app` may fail if dresscave/ directory has existing files (it's currently documentation only — should be clean)
- shadcn init may prompt for style/color selection — use `--defaults` or non-interactive flags
- npm install conflicts from running multiple installs sequentially (each just adds to package.json)
- Next.js 14.x compatible versions must be resolved by npm for all packages

## Validation Plan

| Check | Command | When |
|-------|---------|------|
| Type-check | `cd dresscave && npx tsc --noEmit` | After each task |
| Build | `cd dresscave && npm run build` | After all tasks |
| Unit tests | `cd dresscave && npx vitest run --reporter=verbose` | After T4 |
| Dev server | `cd dresscave && npm run dev` (manual smoke test) | After all tasks |

---
*DCW artifact — generated by deterministic-code-workflow*
