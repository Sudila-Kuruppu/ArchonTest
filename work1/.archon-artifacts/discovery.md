# DCW DISCOVER — Codebase & Research Report

## Meta
- **Feature:** DressCave Phase 0 — Prerequisite Setup (No Supabase)
- **Phase:** DISCOVER
- **Date:** 2026-06-06

## Codebase Overview
- **Framework:** Next.js 14.x (App Router), React 18.x
- **Language:** TypeScript 5.x
- **Test framework:** Vitest + React Testing Library (to be installed); Playwright CLI pre-installed in environment
- **Source root:** `/home/user/archontesting/work1/dresscave/`

### Key Files
| File | Purpose |
|------|---------|
| `dresscave/input.txt` | Feature description (Phase 0 setup tasks) |
| `dresscave/architecture.md` | Full architecture document with patterns, schemas, decisions |
| `dresscave/epics.md` | Epic breakdown with stories, acceptance criteria, Phase 0 tasks |
| `dresscave/prd.md` | Product requirements — 49 FRs, 15 NFRs |
| `dresscave/ux-design-specification.md` | Comprehensive UX design spec (4465 lines) |
| `dresscave/implementation-readiness-report-2026-03-07.md` | Readiness assessment |

### Current State
**Greenfield project** — the `dresscave/` directory contains only documentation files. No application code, `package.json`, or build configuration exists yet. All Phase 0 tasks are about project initialization and dependency setup.

## Existing Patterns
No existing code patterns exist (greenfield). The architecture.md provides extensive guidance on patterns to implement:

### Component Pattern (from architecture.md)
- `'use client'` directive for interactive components
- Server Components by default in App Router
- shadcn/ui components in `components/ui/` directory
- `cn()` utility from `lib/utils.ts` for className merging

### State Management Pattern (from architecture.md)
- **URL State:** `nuqs` with `useQueryState`/`useQueryStates` hooks (requires `NuqsAdapter` wrapper in root layout)
- **Client State:** Zustand stores in `lib/store/` (cart, wishlist)
- **Server State:** Server Components with direct data fetching (no TanStack Query initially)

### Data Validation Pattern (from architecture.md)
- Zod schemas in `lib/schemas/` (product, order, user)
- React Hook Form + `@hookform/resolvers/zod` for forms
- Server Actions for form mutations

### Testing Pattern (from architecture.md)
- Vitest config with jsdom environment
- Tests in `tests/unit/` and `tests/component/`
- React Testing Library with `renderHook` for store tests

## Web Research

### 1. create-next-app with Next.js 14.x
- **Source:** Next.js docs, shadcn/ui docs
- **Finding:** Use `npx create-next-app@latest dresscave` with TypeScript, Tailwind CSS, ESLint, App Router. The input.txt specifies Next.js 14.x, but `create-next-app@latest` may install 15.x. Need to pin with `--version 14.2.x` or specific tag if 14.x is required.
- **Key flags:** `--typescript --tailwind --eslint --app`
- **Relevance:** Task 0.1 — project initialization

### 2. shadcn/ui Installation (Next.js 14)
- **Source:** https://ui.shadcn.com/docs/installation/next
- **Finding:** Run `npx shadcn@latest init` (selects Default style, Slate/Zinc base, CSS variables) → then `npx shadcn@latest add button card input select dialog` for required Phase 0 components.
- **Key details:**
  - Creates `components.json`, `components/ui/`, `lib/utils.ts`
  - Works with existing Next.js + Tailwind CSS setup
  - Components are editable copies (full ownership)
- **Relevance:** Task 0.3 — shadcn/ui initialization

### 3. Zustand in Next.js 14 (SSR Best Practices)
- **Source:** https://zustand.docs.pmnd.rs/learn/guides/nextjs, community articles
- **Finding:** For Next.js App Router, use the **store factory + Context pattern** (not module-level `create()`):
  - Use `createStore` from `zustand/vanilla` to create factory
  - Wrap in React Context with `useRef` for singleton-per-request
  - Create provider component `StoreProvider` in root layout
  - Avoid hydration errors by using `skipHydration` on persisted stores
- **Key packages:** `zustand` (v4/v5)
- **Relevance:** Task 0.4 — Zustand store setup (cart, wishlist)

### 4. nuqs URL State Management
- **Source:** https://nuqs.dev, https://47ng-nuqs.mintlify.app/adapters/nextjs-app
- **Finding:** Requires Next.js `>=14.2.0`. Add `NuqsAdapter` in root `layout.tsx`. Provides `useQueryState` and `useQueryStates` with built-in parsers (`parseAsInteger`, `parseAsString`, etc.).
- **Key details:**
  - Shallow updates by default (client-side only)
  - `shallow: false` for server re-renders
  - Supports debouncing via `throttleMs`
- **Relevance:** Task 0.4 — nuqs installation

### 5. Vitest + React Testing Library with Next.js
- **Source:** Vitest docs, community patterns
- **Finding:** Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`. Configure `vitest.config.ts` with `jsdom` environment and `@/` path alias. Playwright CLI says it's already available in the environment — skip installing Playwright.
- **Relevance:** Task 0.5 — testing setup

### 6. Zod + react-hook-form
- **Source:** Zod docs, react-hook-form docs
- **Finding:** Install `zod`, `react-hook-form`, `@hookform/resolvers`. Create schemas in `lib/schemas/`. Use `zodResolver` with `useForm`.
- **Relevance:** Task 0.6 — data validation setup

### 7. Next.js Image Optimization (No Supabase)
- **Source:** Next.js docs
- **Finding:** Configure `next.config.js` with `images.remotePatterns` for placeholder domains (or local `/public`). No Supabase CDN needed. Use `formats: ['image/avif', 'image/webp']` and appropriate `deviceSizes`.
- **Relevance:** Task 0.7 — image optimization config (adapted from architecture.md which used Supabase CDN)

### 8. Tailwind CSS Mobile-First Configuration
- **Source:** Tailwind docs
- **Finding:** Mobile-first is default in Tailwind (unprefixed = mobile). Add custom design tokens in `tailwind.config.js` (colors, spacing, typography). Ensure 44px touch targets. Use `transform` + `opacity` for 60fps animations.
- **Relevance:** Task 0.8 — Tailwind config

## Integration Points

### Files to Create in dresscave/:

- `dresscave/package.json` — via `create-next-app` (Task 0.1)
- `dresscave/tsconfig.json` — via `create-next-app` (Task 0.1)
- `dresscave/next.config.js` — via `create-next-app` then modify (Task 0.1, 0.7)
- `dresscave/tailwind.config.js` — via `create-next-app` then modify (Task 0.1, 0.8)
- `dresscave/postcss.config.js` — via `create-next-app` (Task 0.1)
- `dresscave/app/layout.tsx` — root layout (Task 0.1, needs NuqsAdapter in Task 0.4)
- `dresscave/app/page.tsx` — home page (Task 0.1)
- `dresscave/app/globals.css` — global styles (Task 0.1, 0.3, 0.8)
- `dresscave/components/ui/` — shadcn components (Task 0.3)
- `dresscave/lib/utils.ts` — cn() utility (Task 0.3 via shadcn init)
- `dresscave/lib/store/cart.ts` — Zustand cart store (Task 0.4)
- `dresscave/lib/store/wishlist.ts` — Zustand wishlist store (Task 0.4)
- `dresscave/lib/store/store-provider.tsx` — Zustand provider (Task 0.4)
- `dresscave/vitest.config.ts` — Vitest configuration (Task 0.5)
- `dresscave/tests/setup.ts` — test setup file (Task 0.5)
- `dresscave/lib/schemas/` — Zod validation schemas (Task 0.6)
- `dresscave/components.json` — shadcn config (Task 0.3)

### Key Adaptations from architecture.md for "No Supabase":
1. **Task 0.2 (Supabase) — SKIP entirely.** The architecture.md has extensive Supabase guidance but input.txt explicitly says no Supabase.
2. **Task 0.7 (Image Optimization)** — use local `/public` domain or placeholder service instead of `*.supabase.co`.
3. **State Management** — Zustand stores will use mock/local data instead of Supabase-backed data.
4. **Testing** — No Supabase mock needed; use simple mock data.

## Clarifications
- **Supabase Task 0.2:** Skipped entirely per input.txt instructions. The input.txt explicitly states "No Supabase — skip all Supabase-related setup. Use local/mock data instead."
- **Next.js version:** Input.txt says "Next.js 14.x" and architecture.md also says 14.x. However `create-next-app@latest` may install Next.js 15. We should ask the user whether to explicitly pin Next.js 14.x or use the latest available.
- **Playwright:** Input.txt says "Playwright CLI already available in environment — skip installing Playwright." So Task 0.5 should only install Vitest + RTL, not Playwright.
- **Architecture divergence:** The architecture.md assumes Supabase heavily. For Phase 0, we're intentionally diverging. This will affect future epics (auth, product catalog, etc.) which will need local/mock adapters.

---
*DCW artifact — generated by deterministic-code-workflow*
