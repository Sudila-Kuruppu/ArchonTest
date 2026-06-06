# DCW DISCOVER — Codebase & Research Report

## Meta
- **Feature:** Epic 2: Product Catalog Management — DressCave
- **Phase:** DISCOVER
- **Date:** 2026-06-06

## Codebase Overview
- **Framework:** Next.js 14.2.0 (App Router)
- **Language:** TypeScript 5.x
- **UI Library:** @base-ui/react v1.5.0 (MUI headless primitives) + Tailwind CSS 3.4
- **Form handling:** react-hook-form v7.77 + @hookform/resolvers v5.4 + Zod v4.4
- **State management:** Zustand v5 (vanilla stores via React context)
- **URL state:** nuqs v2.8
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **Test framework:** Vitest v4 + @testing-library/react
- **Source root:** `/home/user/archontesting/work1/dresscave/`

### Key Files
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout — wraps NuqsAdapter, StoreProvider, AuthProvider, Header |
| `app/page.tsx` | Home page (currently default Next.js starter) |
| `app/globals.css` | Tailwind base + shadcn CSS variable theme (light/dark) |
| `middleware.ts` | Route protection for `/account/*` paths |
| `lib/supabase/client.ts` | Supabase browser client factory |
| `lib/supabase/server.ts` | Supabase server client factory (cookies) |
| `lib/supabase/middleware.ts` | Supabase middleware session refresh |
| `lib/actions/auth.ts` | Server Actions: signup, login, logout, resetPasswordRequest, updatePassword, updateProfile, deleteAccount |
| `lib/schemas/product.ts` | Product Zod schema (name, description, price, category, sizes, colors, images, etc.) |
| `lib/schemas/user.ts` | User/auth Zod schemas (signup, login, measurement, profile, deletion) |
| `lib/schemas/order.ts` | Order Zod schema (items, status, total) |
| `lib/store/cart.ts` | Zustand vanilla store for cart state |
| `lib/store/wishlist.ts` | Zustand vanilla store for wishlist state |
| `lib/store/auth.ts` | Zustand vanilla store for auth state |
| `lib/store/store-provider.tsx` | React context provider wrapping all stores |
| `components/auth/auth-provider.tsx` | Client component managing Supabase auth listener |
| `components/layout/header.tsx` | Header with nav (Women/Kids/Men), user menu, mobile menu |
| `components/ui/button.tsx` | Base UI Button shadcn-style wrapper |
| `components/ui/input.tsx` | Base UI Input shadcn-style wrapper |
| `components/ui/dialog.tsx` | Base UI Dialog shadcn-style wrapper (with header/footer) |
| `components/ui/select.tsx` | Base UI Select shadcn-style wrapper |
| `components/ui/card.tsx` | Card shadcn-style component |
| `components/auth/signup-form.tsx` | Signup form (pattern reference) |
| `components/auth/login-form.tsx` | Login form (pattern reference) |
| `components/profile/profile-form.tsx` | Profile edit form (pattern reference) |
| `components/profile/measurements-form.tsx` | Measurements form (complex form with field array pattern) |
| `components/profile/delete-account-dialog.tsx` | Delete account dialog (dialog pattern + form) |
| `app/(dashboard)/layout.tsx` | Dashboard sidebar layout template |
| `tailwind.config.ts` | Full Tailwind theme — brand colors, typography, animations |

## Existing Patterns

### Component Pattern
```
file:components/auth/signup-form.tsx:1 - 177
```
- **Functional components** with `"use client"` directive for interactive components
- **Server Components** for simple page layouts with metadata export
- **Props pattern:** destructured `{ children }` and typed props interfaces
- **Hooks usage:** `useForm` from react-hook-form, `useRouter`, `useState`
- **Form pattern:** `zodResolver` + `useForm` + server action call on submit
- **Error display:** Inline `<div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">` block

### Data Fetching Pattern
```
file:lib/actions/auth.ts:7 - 191
```
- **Server Actions** (`"use server"`) for mutations
- Return `{ success: true/false, error?: string }` tuple
- Supabase `createClient()` from `@/lib/supabase/server`
- `revalidatePath` + `redirect` from Next.js navigation
- **Server Components** fetch directly via Supabase client (`app/(dashboard)/account/page.tsx:19`)
- No TanStack Query or API routes currently used

### State Management Pattern
```
file:lib/store/store-provider.tsx:1 - 84
```
- **Zustand vanilla stores** created with `createStore` (not `create`)
- Stores wrapped in **React context** providers
- Custom hooks: `useCartStore`, `useWishlistStore`, `useAuthStore` with selector pattern
- Example: `useAuthStore((state) => state.user)`

### Routing Pattern
```
file:app/(dashboard)/layout.tsx:1 - 48
```
- Route groups: `(auth)/`, `(dashboard)/` for layout grouping
- Flat routing with nested page files
- `middleware.ts` protects `/account/*` routes
- Dashboard uses sidebar-aside + main grid layout

### Error Handling Pattern
```
file:lib/actions/auth.ts:24 - 28
```
- **Server Actions:** check `error` from Supabase, return `{ success: false, error: error.message }`
- **Client forms:** `serverError` state variable, displayed in destructive color alert
- **Form validation:** Zod schema + react-hook-form errors shown per-field
- No global error boundary or toast system yet

### Styling Pattern
```
file:tailwind.config.ts:1 - 180
```
- **Tailwind CSS** with CSS variable theme (shadcn style)
- Brand colors defined under `brand:` namespace
- Custom font families: `Playfair Display` (heading), `Inter` (body)
- Custom animations: fade-in, fade-in-up, slide-up, scale-in
- 44px touch targets for mobile
- `cn()` utility from `@/lib/utils` (clsx + tailwind-merge)

### Testing Pattern
```
file:tests/auth/schemas.test.ts:1 - 228
```
- Vitest with `describe/it/expect`
- Schema tests: `Schema.safeParse()` with `.success` assertion
- Store tests: `createStore()` + `getState()` + subscription
- Single setup file with `@testing-library/jest-dom/vitest`
- Test location: `/tests/` directory, organized by domain

### Imports Pattern
- Absolute paths with `@/*` alias (maps to project root)
- Barrel exports via index files (where applicable)
- Imports organized: React → Next.js → components → lib → icons

## Web Research

### Supabase Image Upload & Storage
- **Source:** Web search + Supabase docs
- **Finding:** Best practice is to upload via signed URLs from Server Actions (avoids Next.js 1MB body limit). Create a `product-images` bucket with RLS policies. Store image URLs in the product record. Use `supabase.storage.from('bucket').upload()` with unique file paths. The public URL pattern is `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`.
- **Relevance:** Story 2.7 requires image upload to Supabase Storage. Must implement signed URL pattern or direct client upload with RLS.

### Next.js Server Actions + react-hook-form + Zod
- **Source:** Web search
- **Finding:** The established pattern is: client form with `react-hook-form` + `zodResolver` for client validation → form submits to server action → server re-validates with Zod → inserts to Supabase → returns success/error. Server Actions can be called from client components as async functions (not form action prop only).
- **Relevance:** Directly applicable to Story 2.2, 2.3 (product CRUD forms).

### Supabase RLS for Admin Roles
- **Source:** Web search + Supabase docs
- **Finding:** Check admin status by looking up a `profiles.is_admin` boolean column. Use `security definer` functions for admin checks, or inline subqueries. For Storage, use `bucket_id = 'product-images' AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)`. The `service_role` key can bypass RLS for server-side admin operations.
- **Relevance:** Stories 2.1-2.7 require admin-only write access. RLS must be: public read, admin write. Need to add `is_admin` column to profiles or create an admin table.

### @base-ui/react Components (shadcn-style)
- **Source:** Web search + https://baseui-cn.com
- **Finding:** @base-ui/react by MUI provides headless primitives for Dialog, Select, Menu, etc. The project already has shadcn-style wrappers. Base UI uses compound component pattern (`Root`, `Trigger`, `Popup`, `Portal`, `Item`). Compatible with Tailwind CSS.
- **Relevance:** Stories 2.2-2.6 can reuse existing wrappers. Color picker may need a custom component (Base UI doesn't have a built-in color picker).

### Supabase Soft Delete Pattern
- **Source:** General knowledge
- **Finding:** Add `deleted_at TIMESTAMPTZ` column to products table. Modify queries to filter `WHERE deleted_at IS NULL`. Admin queries can include deleted records. Related records (reviews, orders) remain intact via foreign key references.
- **Relevance:** Story 2.4 requires soft delete.

## Integration Points

- [ ] `lib/schemas/product.ts` — Expand schema: currently has basic product fields, need to add `is_new_arrival`, `age_range` optional for children, align with input schema (no `id` required for creation)
- [ ] `lib/actions/` — Create `lib/actions/products.ts` with Server Actions for CRUD operations on products
- [ ] `lib/supabase/` — Add Supabase Storage client for image uploads
- [ ] `app/(dashboard)/` — Add `admin/` route group under dashboard for product management (or standalone `/admin/` routes)
- [ ] `app/(dashboard)/layout.tsx` — Add admin sidebar links (conditionally for admin users)
- [ ] `middleware.ts` — Add `/admin/*` to protected routes list with admin role check
- [ ] `lib/actions/products.ts` — New file: createProduct, updateProduct, deleteProduct (soft), getProducts, getProduct, uploadImage, deleteImage, setFeatured, setNewArrival
- [ ] `lib/schemas/product.ts` — Add `CreateProductSchema` (without `id`, `images` URLs can be nullable for creation), update `ProductSchema` to include `is_new_arrival`, `deleted_at`, `age_range`
- [ ] `components/products/` — New directory: create-product-form, edit-product-form, product-image-uploader, product-variant-selector, category-manager, delete-product-dialog
- [ ] `app/admin/products/` — New routes: `/admin` (dashboard), `/admin/products` (list), `/admin/products/new` (create), `/admin/products/[id]/edit` (edit)
- [ ] `app/admin/categories/` — New routes: category CRUD management
- [ ] `tests/` — Add `tests/products/` directory with schema, store, and action tests
- [ ] `tailwind.config.ts` — May need to add Supabase Storage remote pattern to `next.config.mjs` for product images
- [ ] `.env.local` — Will need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured (currently placeholder values)
- [ ] Supabase SQL migration — Create `products` table, `categories` table, RLS policies, Storage bucket setup for product images

## Clarifications
None — the feature description is clear and well-scoped. The existing codebase patterns provide a solid foundation for all 7 stories.

---
*DCW artifact — generated by deterministic-code-workflow*
