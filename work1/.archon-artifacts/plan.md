# DCW PLAN — Epic 1: User Authentication & Account Management (FR16-FR20)

## Meta
- **Feature:** Epic 1 — User Authentication & Account Management
- **Phase:** PLAN
- **Date:** 2026-06-06

## Summary
Enable users to create accounts, log in securely, save custom measurements for made-to-order clothing, and manage their profiles. This epic delivers core user identity and personalization features that enable saved cart/wishlist persistence (FR21-FR25) and AI customer service (FR29-FR32).

### UX Flow
```
Before: Bare Next.js app with no auth, no user menu, no header navigation
After:  Users can sign up, log in, reset passwords, manage measurements, edit profiles, delete accounts — all with a consistent user menu dropdown in the header
```

## Scope

### In Scope
- Install Supabase dependencies and create client infrastructure (`lib/supabase/`)
- Implement auth forms and pages (signup, login, forgot/reset password, verify email)
- Create Zustand auth store following existing `createStore` + Context pattern
- Build AuthProvider for server-to-client session hydration
- Protect `/account/*` routes via middleware with session refresh
- Create header with user menu dropdown using `@base-ui/react/menu`
- Build profile pages (dashboard, measurements, settings, account deletion)
- Write validation schemas for all auth forms
- Write tests for auth schemas, store, and form components

### Out of Scope
- OAuth/social login providers (future enhancement)
- Supabase project creation and configuration (manual prerequisite)
- Database `profiles` table creation (handled as part of Supabase project setup or future migration)
- Admin dashboard or role-based access control
- Cart/wishlist persistence (Epic 4 scope)
- AI customer service features (Epic 6 scope)

## Task Overview

### Dependency Order
```
T1 ─► T2
 │
 └► T3 ─► T7 ─► T8 ─► T15 ─► T16
 │       │      │
 │       └► T13 │
 │              │
T4 ─► T5 ─► T6  │
 │              │
 ├► T7 (above)  │
 ├► T9 ─► T12   │
 ├► T10─► T12   │
 ├► T11─► T12   │
 └► T17─► T18   │
                │
T14─────────────────► T18
```

### Task Table
| ID | Action | File | Depends | Validate |
|----|--------|------|---------|----------|
| T1 | UPDATE | `dresscave/package.json` | — | `ls node_modules/@supabase/*` |
| T2 | CREATE | `dresscave/.env.local` | T1 | `grep SUPABASE_URL .env.local` |
| T3 | CREATE | `dresscave/lib/supabase/` | T1 | `tsc --noEmit` |
| T4 | UPDATE | `dresscave/lib/schemas/user.ts` | — | `tsc --noEmit` |
| T5 | CREATE | `dresscave/lib/store/auth.ts` | T4 | `tsc --noEmit` |
| T6 | UPDATE | `dresscave/lib/store/store-provider.tsx` | T5 | `tsc --noEmit` |
| T7 | CREATE | `dresscave/lib/actions/auth.ts` | T3, T4 | `tsc --noEmit` |
| T8 | CREATE | `dresscave/components/auth/auth-provider.tsx` | T5, T7 | `tsc --noEmit` |
| T9 | CREATE | `dresscave/components/auth/signup-form.tsx` | T4, T7 | `tsc --noEmit` |
| T10 | CREATE | `dresscave/components/auth/login-form.tsx` | T4, T7 | `tsc --noEmit` |
| T11 | CREATE | `dresscave/components/auth/forgot-password-form.tsx, reset-password-form.tsx` | T4, T7 | `tsc --noEmit` |
| T12 | CREATE | `dresscave/app/(auth)/` | T9, T10, T11 | `tsc --noEmit` |
| T13 | CREATE | `dresscave/app/auth/confirm/route.ts` | T3, T7 | `tsc --noEmit` |
| T14 | CREATE | `dresscave/middleware.ts` | T3 | `tsc --noEmit` |
| T15 | CREATE | `dresscave/components/layout/header.tsx` | T8 | `tsc --noEmit` |
| T16 | UPDATE | `dresscave/app/layout.tsx` | T8, T15 | `tsc --noEmit` |
| T17 | CREATE | `dresscave/components/profile/` | T4, T7, T8 | `tsc --noEmit` |
| T18 | CREATE | `dresscave/app/(dashboard)/` | T17, T14 | `tsc --noEmit` |
| T19 | CREATE | `dresscave/tests/auth/` | T4, T5, T9, T10 | `npm test -- --run` |

### Task Details

#### T1: Install Supabase dependencies
- **Action:** UPDATE `dresscave/package.json`
- **Details:** Add `@supabase/supabase-js` and `@supabase/ssr` to dependencies, then run `npm install`
- **Validate:** `ls dresscave/node_modules/@supabase/supabase-js` and `npx tsc --noEmit`

#### T2: Create .env.local
- **Action:** CREATE `dresscave/.env.local`
- **Details:** Add `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=` with placeholder values. Include `.env.local` in `.gitignore` (verify it already is).
- **Validate:** File exists with both variables
- **Note:** Actual Supabase credentials require manual Supabase project creation

#### T3: Create Supabase client files
- **Action:** CREATE `dresscave/lib/supabase/server.ts`, `client.ts`, `middleware.ts`
- **Patterns:** Zustand store pattern (vanilla createStore) — mirror file structure style
- **Details:**
  - `server.ts`: `createServerClient()` with `cookies()` from `next/headers`
  - `client.ts`: `createBrowserClient()` for client components
  - `middleware.ts`: `createServerClient()` with `NextRequest`/`NextResponse` cookies
- **Validate:** All 3 files exist, TypeScript compiles

#### T4: Extend Zod schemas
- **Action:** UPDATE `dresscave/lib/schemas/user.ts`
- **Patterns:** Mirror `product.ts` pattern (exported schemas + inferred types)
- **Details:** Add:
  - `SignupSchema`: email, password (8+ chars, mixed case), full_name
  - `LoginSchema`: email, password
  - `ForgotPasswordSchema`: email
  - `ResetPasswordSchema`: new_password, confirm_password
  - `ProfileUpdateSchema`: full_name, phone, avatar_url, communication_preferences
  - `AccountDeletionSchema`: password confirmation
- **Validate:** TypeScript compiles

#### T5: Create auth Zustand store
- **Action:** CREATE `dresscave/lib/store/auth.ts`
- **Patterns:** Mirror `cart.ts` (vanilla `createStore`, `AuthStore` type, `AuthStoreApi` type, `createAuthStore` factory)
- **Details:** Store shape: `{ user, session, isLoading, setUser, setSession, clearAuth }`
- **Validate:** TypeScript compiles

#### T6: Add auth store to StoreProvider
- **Action:** UPDATE `dresscave/lib/store/store-provider.tsx`
- **Patterns:** Mirror existing cart/wishlist provider pattern
- **Details:** Add `AuthStoreContext`, `AuthStoreApi`, `useAuthStore<T>()` hook. Wrap in provider alongside cart and wishlist.
- **Validate:** TypeScript compiles

#### T7: Create auth server actions
- **Action:** CREATE `dresscave/lib/actions/auth.ts`
- **Details:** Implement using `"use server"` directives:
  - `signup(email, password, full_name)` — calls `supabase.auth.signUp()`, creates profile
  - `login(email, password)` — calls `supabase.auth.signInWithPassword()`
  - `logout()` — calls `supabase.auth.signOut()`
  - `resetPasswordRequest(email)` — calls `supabase.auth.resetPasswordForEmail()`
  - `updatePassword(password)` — calls `supabase.auth.updateUser()`
  - `updateProfile(data)` — updates `profiles` table
  - `deleteAccount(password)` — deletes user and marks for GDPR removal
- **Validate:** TypeScript compiles

#### T8: Create AuthProvider component
- **Action:** CREATE `dresscave/components/auth/auth-provider.tsx`
- **Patterns:** Mirror `StoreProvider` pattern
- **Details:** Client component that fetches session on mount via `supabase.auth.getUser()`, populates auth store, and renders children.
- **Validate:** TypeScript compiles

#### T9: Create signup form
- **Action:** CREATE `dresscave/components/auth/signup-form.tsx`
- **Patterns:** Mirror Card layout pattern, use Button + Input components
- **Details:** `"use client"`, RHF + ZodResolver, fields: full_name, email, password, confirm_password. Show/hide password toggle. Submit calls signup server action. Displays validation errors inline. Shows loading state. Redirects to verify-email page on success.
- **Validate:** TypeScript compiles

#### T10: Create login form
- **Action:** CREATE `dresscave/components/auth/login-form.tsx`
- **Patterns:** Mirror Card layout pattern
- **Details:** `"use client"`, RHF + ZodResolver, fields: email, password. "Remember me" checkbox. "Forgot Password?" link. Submit calls login server action. Shows errors for invalid credentials / unverified email. Redirects to account dashboard on success.
- **Validate:** TypeScript compiles

#### T11: Create password reset forms
- **Action:** CREATE `dresscave/components/auth/forgot-password-form.tsx` and `dresscave/components/auth/reset-password-form.tsx`
- **Details:** Forgot: email field only, calls `resetPasswordRequest`. Reset: new_password + confirm_password, calls `updatePassword`. Both use RHF + Zod.
- **Validate:** Both files exist, TypeScript compiles

#### T12: Create auth route group pages
- **Action:** CREATE `dresscave/app/(auth)/` with layout and pages
- **Details:**
  - `(auth)/layout.tsx` — centered card layout for all auth pages
  - `(auth)/login/page.tsx` — renders login form
  - `(auth)/signup/page.tsx` — renders signup form
  - `(auth)/forgot-password/page.tsx` — renders forgot password form
  - `(auth)/reset-password/page.tsx` — renders reset password form
  - `(auth)/verify-email/page.tsx` — static "check your email" confirmation page
- **Validate:** All pages exist, TypeScript compiles

#### T13: Create auth callback route handler
- **Action:** CREATE `dresscave/app/auth/confirm/route.ts`
- **Details:** `GET` handler that exchanges auth code for session using `createServerClient()`, redirects to dashboard on success, login page on failure
- **Validate:** TypeScript compiles

#### T14: Create root middleware
- **Action:** CREATE `dresscave/middleware.ts` (root of dresscave/)
- **Patterns:** Mirror `lib/supabase/middleware.ts` pattern
- **Details:** Uses `updateSession()` from Supabase middleware. Protects `/account/*` routes by redirecting unauthenticated users to `/login`. Refreshes session on every request.
- **Validate:** TypeScript compiles

#### T15: Create header with user menu
- **Action:** CREATE `dresscave/components/layout/header.tsx`
- **Patterns:** Mirror shadcn component patterns (data-slot, cn()), use `@base-ui/react/menu` for dropdown
- **Details:** `"use client"`. Logo/brand link. Navigation links (Women, Kids, Men). If logged in: user avatar + dropdown menu (My Account, Measurements, Wishlist, Cart, Settings, Logout). If logged out: Login / Sign Up buttons. Mobile hamburger menu for small screens.
- **Validate:** TypeScript compiles

#### T16: Update root layout
- **Action:** UPDATE `dresscave/app/layout.tsx`
- **Details:** Import and render `<Header />` inside `<body>` before `<main>`. Wrap with `<AuthProvider>` inside `<StoreProvider>`. Update page structure to use semantic HTML.
- **Validate:** TypeScript compiles

#### T17: Create profile components
- **Action:** CREATE `dresscave/components/profile/profile-form.tsx`, `measurements-form.tsx`, `delete-account-dialog.tsx`
- **Patterns:** Mirror Dialog, Card, Select component patterns
- **Details:**
  - `profile-form.tsx`: edit full_name, phone, communication preferences; email change triggers verification
  - `measurements-form.tsx`: chest, waist, hips, inseam, height, weight with unit toggle (cm/inches); multiple measurement profiles
  - `delete-account-dialog.tsx`: Dialog with password confirmation, warning text, "I understand" checkbox
- **Validate:** All 3 files exist, TypeScript compiles

#### T18: Create dashboard route group pages
- **Action:** CREATE `dresscave/app/(dashboard)/` with layout and pages
- **Details:**
  - `(dashboard)/layout.tsx` — sidebar layout with account navigation
  - `(dashboard)/account/page.tsx` — overview with personalized greeting, order history summary
  - `(dashboard)/account/measurements/page.tsx` — list/save measurements, unit toggle
  - `(dashboard)/account/settings/page.tsx` — profile form, communication preferences
  - `(dashboard)/account/delete/page.tsx` — account deletion with confirmation dialog
- **Validate:** All 5+ files exist, TypeScript compiles

#### T19: Write tests
- **Action:** CREATE `dresscave/tests/auth/schemas.test.ts`, `store.test.ts`
- **Patterns:** Mirror `tests/example.test.ts`
- **Details:**
  - `schemas.test.ts`: test each auth schema (valid input passes, invalid fails)
  - `store.test.ts`: test auth store setters/getters (setUser, setSession, clearAuth)
- **Validate:** `npm test -- --run` passes

## Testing Strategy
- **Unit tests**: Zod schema validation (valid/invalid inputs), Zustand store operations
- **Component tests**: Form rendering, validation error display, loading states
- **Integration tests**: Server action mocking with form submissions
- **Edge cases**: Duplicate email, weak password, expired reset link, unverified login attempt, GDPR data retention period

## Validation Plan
- **Type-check:** `npx tsc --noEmit` — must pass after each task
- **Lint:** `npx next lint` — verify code quality
- **Tests:** `npm test -- --run` — all tests pass
- **Build:** `npm run build` — production build succeeds (may require Supabase project)

## Manual Prerequisites
Before starting T1, the following must be completed manually:
1. Create a Supabase project at https://supabase.com
2. Enable Email/Password auth in Supabase Auth settings
3. Create a `profiles` table with RLS policies (or use Supabase's built-in user management)
4. Note the `SUPABASE_URL` and `SUPABASE_ANON_KEY` for `.env.local`

---
*DCW artifact — generated by deterministic-code-workflow*
