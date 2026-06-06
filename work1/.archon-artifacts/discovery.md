# DCW DISCOVER — Codebase & Research Report

## Meta
- **Feature:** Epic 1 — User Authentication & Account Management (FR16-FR20)
- **Phase:** DISCOVER
- **Date:** 2026-06-06

## Codebase Overview
- **Framework:** Next.js 14.2.0 (App Router), React 18.x
- **Language:** TypeScript 5.x
- **Test framework:** Vitest 4.x + @testing-library/react + jsdom
- **Source root:** `/home/user/archontesting/work1/dresscave/`

### Key Files
| File | Purpose |
|------|---------|
| `package.json` | Project dependencies (Next.js 14, Zustand, Zod, RHF, shadcn/ui, Vitest) |
| `tsconfig.json` | TypeScript config with `@/*` alias, strict mode, bundler module resolution |
| `tailwind.config.ts` | Tailwind with CSS variable colors, brand tokens, custom animations/typography |
| `components.json` | shadcn/ui v4 config (base-nova style, @base-ui/react primitives) |
| `vitest.config.ts` | Vitest config with jsdom, `@/*` alias, React plugin |
| `next.config.mjs` | Image optimization (remotePatterns for placeholder sites, WebP/AVIF) |
| `app/layout.tsx` | Root layout — wraps NuqsAdapter + StoreProvider |
| `app/globals.css` | Global CSS with shadcn CSS variables, Tailwind directives |
| `lib/store/cart.ts` | Zustand vanilla store for cart (createStore pattern) |
| `lib/store/wishlist.ts` | Zustand vanilla store for wishlist (createStore pattern) |
| `lib/store/store-provider.tsx` | React Context provider wrapping both stores, selector hooks |
| `lib/schemas/product.ts` | Zod schema for Product (sizes, colors, categories, images) |
| `lib/schemas/user.ts` | Zod schema for User + CustomMeasurement |
| `lib/schemas/order.ts` | Zod schema for Order + OrderItem |
| `lib/utils.ts` | cn() utility (clsx + tailwind-merge) |
| `components/ui/button.tsx` | shadcn Button using @base-ui/react/button |
| `components/ui/input.tsx` | shadcn Input using @base-ui/react/input |
| `components/ui/card.tsx` | shadcn Card (Card, CardHeader, CardTitle, etc.) |
| `components/ui/dialog.tsx` | shadcn Dialog using @base-ui/react/dialog |
| `components/ui/select.tsx` | shadcn Select using @base-ui/react/select |
| `tests/example.test.ts` | Single smoke test (1+1=2) |
| `tests/setup.ts` | Jest DOM matchers import |
| `Doc/epics.md` | Epic definitions including Epic 1 stories |
| `Doc/prd.md` | Full PRD with FR16-FR20 requirements |
| `Doc/architecture.md` | Architecture decisions (auth, state, data patterns) |

## Existing Patterns

### Component Pattern — shadcn/ui v4 (base-nova style)
```
file:components/ui/button.tsx:1-58
```
- Uses `@base-ui/react` primitives (NOT Radix UI — this is shadcn v4 base-nova)
- `"use client"` only when interactivity is needed
- `cva` (class-variance-authority) for variant/size props
- `cn()` utility for className merging
- `data-slot="..."` attributes on root elements
- Pattern: functional component with `React.ComponentProps` or primitive-specific Props

Example pattern:
```typescript
import { cn } from "@/lib/utils"
function Button({ className, ...props }: Primitive.Props & VariantProps<...>) {
  return <Primitive data-slot="button" className={cn(styles, className)} {...props} />
}
```

### Zustand Store Pattern — Vanilla createStore + Context Provider
```
file:lib/store/cart.ts:1-45
file:lib/store/store-provider.tsx:1-61
```
- Uses `createStore` from `zustand/vanilla` (NOT the hook-based `create`)
- Stores wrapped in React Context with `useRef` for SSR safety
- Custom `useXStore<T>(selector)` hooks via `useStore(zustand)` for selector-based subscriptions
- Provider composes multiple store contexts (`StoreProvider`)
- Currently: cart and wishlist stores only

**This is the pattern we must follow for any new Zustand stores** (e.g., auth store).

### Zod Schema Pattern — lib/schemas/
```
file:lib/schemas/user.ts:1-25
file:lib/schemas/product.ts:1-42
file:lib/schemas/order.ts:1-36
```
- Each domain gets a file in `lib/schemas/`
- Zod schemas with `.optional()`, `.nullable()`, `.default()` for flexible fields
- Types exported via `z.infer<typeof Schema>`
- Reuse across schemas: `CustomMeasurementSchema` from user.ts is imported in order.ts

### Existing User & Measurement Schema
```
file:lib/schemas/user.ts:1-25
```
Already defined with:
- `CustomMeasurementSchema`: chest, waist, hips, inseam, height, weight, notes (all optional, positive numbers)
- `UserSchema`: id, email, full_name, phone, avatar_url, custom_measurements, created_at, updated_at

### Styling Pattern — Tailwind CSS + CSS Variables
```
file:tailwind.config.ts:1-180
```
- shadcn CSS variable colors (background, foreground, primary, etc.)
- Brand colors: `brand-bg-*`, `brand-text-*`, `brand-accent-*`
- Custom typography: display, h2-h4, body, caption, label
- Touch targets: `min-h-touch` / `min-w-touch` (44px)
- Animations: fade-in, fade-in-up, slide-up, scale-in, skeleton-pulse
- Fonts: Playfair Display (heading), Inter (body)

### Testing Pattern — Vitest
```
file:vitest.config.ts:1-18
file:tests/example.test.ts:1-7
file:tests/setup.ts:1-1
```
- Vitest with jsdom environment, globals enabled
- `@testing-library/jest-dom/vitest` for DOM matchers
- Tests in `tests/` directory with `*.test.{ts,tsx}` pattern
- No component tests or store tests exist yet (only 1 smoke test)

### Import Pattern — Absolute `@/` alias
```
file:tsconfig.json:20-22
```
- `@/*` maps to project root
- Used throughout: `@/lib/utils`, `@/components/ui/button`, `@/lib/store/cart`

## Web Research

### Topic 1: Supabase Auth + Next.js 14 App Router SSR Pattern
- **Source:** `supabase.com/docs/guides/auth/server-side/creating-a-client` + multiple tutorials
- **Finding:** The established pattern (2025-2026) requires:
  1. `@supabase/supabase-js` + `@supabase/ssr` packages
  2. Three Supabase client files:
     - `lib/supabase/server.ts` — `createServerClient()` with `cookies()` from `next/headers`
     - `lib/supabase/client.ts` — `createBrowserClient()` for client components
     - `lib/supabase/middleware.ts` — `createServerClient()` with `NextRequest` cookies for middleware
  3. `middleware.ts` at root to refresh sessions and protect routes
  4. Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Relevance:** **CRITICAL** — Supabase is not yet installed. These clients are prerequisites for all auth functionality (FR16-FR20). Must be created before any auth forms or server actions.

### Topic 2: Zustand + Next.js App Router SSR Pattern
- **Source:** zustand.docs.pmnd.rs + noqta.tn tutorial 2026
- **Finding:** The project already follows the correct SSR-safe Zustand pattern (vanilla `createStore` + Context provider + `useRef`). This pattern avoids global-state leakage between requests. The existing `store-provider.tsx` is the correct template.
- **Relevance:** Any new global client state (e.g., auth state like current user) should follow this exact pattern — create a vanilla store, add it to `StoreProvider`, export a selector hook.

### Topic 3: React Hook Form + Zod Integration Pattern
- **Source:** dev.to 2026 guide, react-hook-form docs
- **Finding:** Standard pattern: `useForm<SchemaType>({ resolver: zodResolver(Schema) })` with `@hookform/resolvers/zod`. The project already has these dependencies. Common pattern for auth forms:
  ```typescript
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(AuthSchema) })
  ```
- **Relevance:** All auth forms (registration, login, password reset, profile edit) will use this exact pattern.

### Topic 4: Supabase Auth Flow — Email/Password
- **Source:** codevoweb.com, ryankatayi.com
- **Finding:** Key Supabase Auth API calls:
  - Sign up: `supabase.auth.signUp({ email, password })` — sends verification email
  - Sign in: `supabase.auth.signInWithPassword({ email, password })`
  - Sign out: `supabase.auth.signOut()`
  - Password reset: `supabase.auth.resetPasswordForEmail(email)` — sends reset link
  - Update password: `supabase.auth.updateUser({ password })` — after reset link
  - Session check: `supabase.auth.getUser()` (preferred over `getSession()` for security)
  - Profile CRUD: Direct Supabase queries on `profiles` table with RLS
- **Relevance:** These are the core API calls needed for Stories 1.1-1.3 and 1.5-1.6.

### Topic 5: shadcn/ui v4 base-nova — @base-ui/react primitives
- **Source:** components.json analysis + existing component code
- **Finding:** This project uses shadcn/ui v4 with "base-nova" style, which uses `@base-ui/react` (MUI's headless UI library) instead of the classic Radix UI. Key differences:
  - Imports from `@base-ui/react/button` instead of `@radix-ui/react-button`
  - `data-slot` attributes instead of `asChild` pattern
  - Different API for dialog, select, etc.
- **Relevance:** New UI components (dropdown menu, avatar, etc.) for the User Menu (Story 1.7) must be compatible with `@base-ui/react`. We'll likely need to add more @base-ui/react primitives or custom shadcn components.

## Integration Points

### Critical Prerequisites (Must Be Done Before Auth)

- [ ] `package.json` — Add `@supabase/supabase-js` and `@supabase/ssr` dependencies
- [ ] `lib/supabase/server.ts` — Create server-side Supabase client using `@supabase/ssr` + `next/headers`
- [ ] `lib/supabase/client.ts` — Create client-side Supabase browser client
- [ ] `lib/supabase/middleware.ts` — Create middleware Supabase client with `NextRequest` cookies
- [ ] `middleware.ts` (root) — Create middleware for session refresh and route protection
- [ ] `.env.local` — Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Supabase project — Create Supabase project, configure Auth settings, create `profiles` table with RLS

### Route Definitions to Add
- [ ] `app/(auth)/login/page.tsx` — Login page
- [ ] `app/(auth)/signup/page.tsx` — Registration page
- [ ] `app/(auth)/forgot-password/page.tsx` — Password reset request page
- [ ] `app/(auth)/reset-password/page.tsx` — Password reset form (linked from email)
- [ ] `app/(auth)/verify-email/page.tsx` — Post-signup email verification prompt
- [ ] `app/(auth)/auth/confirm/route.ts` — Auth callback route handler (for Supabase redirects)
- [ ] `app/(dashboard)/account/page.tsx` — Account dashboard / profile page
- [ ] `app/(dashboard)/account/measurements/page.tsx` — Custom measurements page
- [ ] `app/(dashboard)/account/settings/page.tsx` — Account settings (profile edit, deletion)
- [ ] `app/(dashboard)/account/delete/page.tsx` — Account deletion flow

### Components to Create
- [ ] `components/auth/signup-form.tsx` — Registration form (RHF + Zod + Supabase)
- [ ] `components/auth/login-form.tsx` — Login form (RHF + Zod + Supabase)
- [ ] `components/auth/forgot-password-form.tsx` — Forgot password form
- [ ] `components/auth/reset-password-form.tsx` — New password form
- [ ] `components/auth/user-menu.tsx` — Header dropdown menu (My Account, Measurements, Wishlist, Cart, Settings, Logout)
- [ ] `components/auth/user-button.tsx` — User icon/button in header
- [ ] `components/auth/auth-provider.tsx` — Auth context provider (hydration from server)
- [ ] `components/profile/profile-form.tsx` — Edit profile form
- [ ] `components/profile/measurements-form.tsx` — Custom measurements form
- [ ] `components/profile/delete-account-dialog.tsx` — Account deletion confirmation dialog
- [ ] `components/profile/measurement-profiles.tsx` — Multiple measurement profiles management

### Store to Add
- [ ] `lib/store/auth.ts` — Zustand store for auth state (current user, session) following existing pattern

### Schema Updates
- [ ] `lib/schemas/user.ts` — Extend schemas for signup, login, password reset, profile edit, account deletion validation (already has base UserSchema)

### Navigation Updates
- [ ] `app/layout.tsx` or a new `components/layout/header.tsx` — Add user menu / auth buttons to header
- [ ] `lib/store/store-provider.tsx` — Add auth store provider alongside cart/wishlist
- [ ] `middleware.ts` — Protect `/account/*` routes for authenticated users only

### Existing Schemas Already Adequate
- [x] `lib/schemas/user.ts` — Already has `CustomMeasurementSchema` and `UserSchema`
- [x] `lib/schemas/order.ts` — Already imports and uses `CustomMeasurementSchema`

## Clarifications

- **Supabase project not yet created:** The Supabase backend project does not exist yet. The implementation plan must include creating a Supabase project, configuring Auth (email/password), and creating the `profiles` database table with RLS policies. This is the single biggest dependency.
- **Middleare does not exist:** No middleware.ts exists at root. Must be created for session refresh and protected route handling.
- **No header/nav component exists:** The app currently has only a bare layout and homepage. A header component with user menu integration needs to be created — this affects Stories 1.7 and the overall site navigation.
- **Supabase packages not installed:** `@supabase/supabase-js` and `@supabase/ssr` are missing from `package.json`. These are required before any auth code can work.
- **shadcn v4 base-nova:** Unique project setup using @base-ui/react instead of Radix UI. New components (dropdown, avatar, popover) might need custom shadcn generation or manual creation.
- **Package versions note:**
  - Zod 4.x — newer major version, API check needed for any breaking changes from Zod 3.x
  - zustand 5.x — newer major version, API check needed for any breaking changes from zustand 4.x
  - `@hookform/resolvers` 5.x — must verify Zod 4 compatibility
- **No hooks directory exists** despite being listed in `components.json` aliases. Custom hooks (e.g., `useAuth`, `useUser`) should go in `lib/hooks/`.

---
*DCW artifact — generated by deterministic-code-workflow*
