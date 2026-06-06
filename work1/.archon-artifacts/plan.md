# DCW PLAN — Epic 2: Product Catalog Management

## Meta
- **Feature:** Product Catalog Management (Epic 2)
- **Phase:** PLAN
- **Date:** 2026-06-06
- **Codebase:** Next.js 14.x App Router + Supabase + Tailwind CSS + Zod + react-hook-form

## Summary
Enable store administrators to manage the entire product catalog: create products with variants (sizes, colors), upload/optimize images, organize into categories and subcategories, soft-delete products, and toggle featured/new arrival status.

### UX Flow
```
Before: Admin has no product management UI — only auth/profile features exist.
After:  Admin navigates to /admin dashboard, manages products via list/create/edit/delete
        forms, organizes categories, toggles featured/new badges, and uploads images.
```

## Scope

### In Scope
- Supabase SQL migration: `products` table, `categories` table (hierarchical), RLS (public read / admin write), Storage bucket for product images
- Zod schemas: expanded `ProductSchema` with `is_new_arrival`, `deleted_at`, `category_id`; new `CreateProductSchema`, `UpdateProductSchema`; new `CategorySchema` with hierarchy
- Server Actions: full CRUD for products (create, read, update, soft delete) + image upload/delete + featured/new arrival toggle
- Server Actions: full CRUD for categories (create, read, update, delete)
- Middleware: `/admin/*` routes protected + admin role check against `profiles.is_admin`
- Admin layout with sidebar navigation (Dashboard, Products, Categories)
- Admin dashboard homepage with quick stats
- Admin products list page with search/filter and inline featured/new arrival toggles
- Reusable product form component (shared for create + edit modes)
- Product creation page + edit page (with dynamic `[id]` route)
- Delete product confirmation dialog (soft delete)
- Image uploader component with drag-and-drop, preview, reorder, delete
- Category management page with CRUD UI (tree hierarchy)
- `next.config.mjs` update for Supabase Storage remote image patterns
- Schema validation tests for product and category schemas

### Out of Scope
- Storefront product display (homepage featured section, category browsing, product detail pages)
- Shopping cart integration with products
- Review/rating system
- Order management from admin panel
- Bulk product import/export
- Product analytics or sales reports
- Inventory tracking or stock management
- Product sorting/filtering on storefront
- Wishlist integration

## Task Overview

### Dependency Order
```
T1  T2  T3  T6  T7
 │   │           │
 │   ├── T4 ─────┤
 │   ├── T5 ─────┤
 │   │           │
 │   │      T8 ←─┤
 │   │           │
 │   ├── T4 ── T9 ←─┤
 │   ├── T5 ── T15←─┤
 │   │              │
 │   ├── T4 ── T14  │
 │   │              │
 │   ├── T2 ── T16  │
 │   │              │
 │   └── T4 ── T10 ─┤── T11 ── T12
 │                   │
 │              T9 ──┤── T13
 │                   │
 └── T1 (migration)  │
                     │
T3 (next.config)     │
T6 (middleware)      │
T7 (admin layout) ───┤
```

### Task Table
| ID | Action | Primary File | Depends | Validate |
|----|--------|-------------|---------|----------|
| T1 | CREATE | `supabase/migrations/002_create_products.sql` | — | File check |
| T2 | UPDATE | `lib/schemas/product.ts` | — | `vitest run` |
| T3 | UPDATE | `next.config.mjs` | — | `tsc --noEmit` |
| T4 | CREATE | `lib/actions/products.ts` | T2 | `tsc --noEmit` |
| T5 | CREATE | `lib/actions/categories.ts` | T2 | `tsc --noEmit` |
| T6 | UPDATE | `middleware.ts` | — | `tsc --noEmit` |
| T7 | CREATE | `app/(dashboard)/admin/layout.tsx` | — | `tsc --noEmit` |
| T8 | CREATE | `app/(dashboard)/admin/page.tsx` | T7 | `tsc --noEmit` |
| T9 | CREATE | `app/(dashboard)/admin/products/page.tsx` | T4, T7 | `tsc --noEmit` |
| T10 | CREATE | `components/products/product-form.tsx` | T2, T4, T5 | `tsc --noEmit` |
| T11 | CREATE | `app/(dashboard)/admin/products/new/page.tsx` | T10 | `tsc --noEmit` |
| T12 | CREATE | `app/(dashboard)/admin/products/[id]/edit/page.tsx` | T10, T11 | `tsc --noEmit` |
| T13 | CREATE | `components/products/delete-product-dialog.tsx` | T4, T9 | `tsc --noEmit` |
| T14 | CREATE | `components/products/image-uploader.tsx` | T4 | `tsc --noEmit` |
| T15 | CREATE | `app/(dashboard)/admin/categories/page.tsx` | T5, T7 | `tsc --noEmit` |
| T16 | CREATE | `tests/products/schemas.test.ts` | T2 | `vitest run` |

### Task Details

#### T1: Create SQL Migration File
- **Action:** CREATE `dresscave/supabase/migrations/002_create_products.sql`
- **Contents:**
  - `categories` table: id (uuid PK), name (text), slug (text unique), parent_id (uuid self-ref FK nullable), created_at
  - `products` table: id (uuid PK), name (text), description (text), category_id (uuid FK → categories), price (numeric), sizes (text[]), colors (text[]), images (jsonb[]), is_featured (boolean), is_new_arrival (boolean), age_range (jsonb), deleted_at (timestamptz nullable), created_at, updated_at
  - Indexes on: category_id, is_featured, is_new_arrival, deleted_at, created_at, name search
  - RLS: Enable on both tables — public SELECT, admin INSERT/UPDATE/DELETE (checks profiles.is_admin)
  - Storage: `product-images` bucket with RLS — public SELECT, admin INSERT/UPDATE/DELETE
- **Validate:** `test -f dresscave/supabase/migrations/002_create_products.sql && echo 'Migration file created'`

#### T2: Update Product Zod Schemas + Create Category Schema
- **Action:** UPDATE `dresscave/lib/schemas/product.ts` + CREATE `dresscave/lib/schemas/category.ts`
- **Patterns:** `dresscave/lib/schemas/user.ts` (barrel exports, inline types)
- **Changes to product.ts:**
  - Add `is_new_arrival: z.boolean().default(false)` to ProductSchema
  - Add `deleted_at: z.string().datetime().nullable().optional()` to ProductSchema
  - Refactor `category` from `z.enum(CATEGORIES)` to `category_id: z.string().uuid()`
  - Create `CreateProductSchema` (omit `id` from ProductSchema, make `images` optional with default [])
  - Create `UpdateProductSchema` (all fields optional, partial of CreateProductSchema)
  - Keep backward compatibility with OrderItemSchema imports (SIZES, CATEGORIES exports)
- **Category schema** (`lib/schemas/category.ts`):
  - `CategorySchema`: id (uuid), name (string), slug (string), parent_id (uuid nullable), created_at
  - `CreateCategorySchema`: name (required), parent_id (optional uuid)
- **Validate:** `npx vitest run --reporter=verbose 2>&1 | tail -30`

#### T3: Update next.config.mjs
- **Action:** UPDATE `dresscave/next.config.mjs`
- **Changes:** Add Supabase Storage remote pattern:
  ```js
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/product-images/**",
  }
  ```
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T4: Create Product Server Actions
- **Action:** CREATE `dresscave/lib/actions/products.ts`
- **Patterns:** `dresscave/lib/actions/auth.ts` (Server Action pattern with `"use server"`, `createClient()`, `revalidatePath`, `redirect`)
- **Functions:**
  - `getProducts(filter?)`: Fetch all non-deleted products with category info, optional search/filter
  - `getProduct(id)`: Fetch single product by ID
  - `createProduct(data: CreateProductInput)`: Insert new product, return success
  - `updateProduct(id, data: UpdateProductInput)`: Update product fields, revalidate
  - `deleteProduct(id)`: Soft delete (set `deleted_at`), revalidate
  - `setFeatured(id, isFeatured)`: Toggle is_featured, revalidate
  - `setNewArrival(id, isNewArrival)`: Toggle is_new_arrival, revalidate
  - `uploadImage(productId, formData)`: Upload to Supabase Storage, return URL
  - `deleteImage(productId, imageUrl)`: Remove from Storage + update product.images array
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T5: Create Category Server Actions
- **Action:** CREATE `dresscave/lib/actions/categories.ts`
- **Patterns:** `dresscave/lib/actions/auth.ts`
- **Functions:**
  - `getCategories()`: Fetch all categories with parent info for tree display
  - `createCategory(data: CreateCategoryInput)`: Insert category, revalidate
  - `updateCategory(id, data)`: Update category name/slug/parent, revalidate
  - `deleteCategory(id)`: Delete category (only if no products reference it), revalidate
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T6: Update Middleware for Admin Route Protection
- **Action:** UPDATE `dresscave/middleware.ts`
- **Changes:**
  - Add `/admin` to `protectedRoutes` array
  - Add admin role check: query `profiles.is_admin` for authenticated users on `/admin/*` paths
  - Redirect non-admin users to `/account` with error
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T7: Create Admin Layout with Sidebar
- **Action:** CREATE `dresscave/app/(dashboard)/admin/layout.tsx`
- **Patterns:** `dresscave/app/(dashboard)/layout.tsx`
- **Features:**
  - Sidebar with nav links: Dashboard (LayoutDashboardIcon), Products (PackageIcon), Categories (FolderTreeIcon)
  - Active link highlighting using `usePathname()`
  - Client component with `"use client"` for pathname tracking
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T8: Create Admin Dashboard Homepage
- **Action:** CREATE `dresscave/app/(dashboard)/admin/page.tsx`
- **Patterns:** `dresscave/app/(dashboard)/account/page.tsx`
- **Features:**
  - Server component fetching stats: total products count, featured count, new arrivals count, categories count
  - Stat cards using Card component
  - Quick action buttons: "Add Product", "Manage Categories"
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T9: Create Admin Products List Page
- **Action:** CREATE `dresscave/app/(dashboard)/admin/products/page.tsx`
- **Patterns:** `dresscave/app/(dashboard)/account/page.tsx`
- **Features:**
  - Server component fetching all non-deleted products with category name join
  - Table with columns: Name, Category, Price, Featured (toggle), New Arrival (toggle), Actions
  - Search input filtering by name (URL state via nuqs)
  - Client component for the interactive parts (toggles, search)
  - "Add Product" button linking to `/admin/products/new`
  - Inline toggle buttons for is_featured and is_new_arrival calling server actions
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T10: Create Reusable Product Form Component
- **Action:** CREATE `dresscave/components/products/product-form.tsx`
- **Patterns:**
  - `dresscave/components/auth/signup-form.tsx` (form structure, error display)
  - `dresscave/components/profile/measurements-form.tsx` (complex form with selects)
- **Features:**
  - Props: `mode: 'create' | 'edit'`, `defaultValues?: Product`, `onSuccess: () => void`
  - Fields: name (Input), description (textarea), category (Select from categories list), subcategory (Input), price (number Input), sizes (checkbox group from SIZES), colors (color picker + add/remove), age_range (min/max number inputs, shown only for children categories)
  - Zod validation via zodResolver
  - Server-side submit calling createProduct or updateProduct
  - Loading state, error display, success redirect
  - Includes ImageUploader component for product images
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T11: Create Product Creation Page
- **Action:** CREATE `dresscave/app/(dashboard)/admin/products/new/page.tsx`
- **Patterns:** `dresscave/app/(dashboard)/account/measurements/page.tsx`
- **Features:**
  - Server component (shell) that wraps ProductForm in `mode="create"`
  - Title: "New Product"
  - On success redirects to `/admin/products`
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T12: Create Product Edit Page
- **Action:** CREATE `dresscave/app/(dashboard)/admin/products/[id]/edit/page.tsx`
- **Patterns:** `dresscave/app/(dashboard)/account/measurements/page.tsx`
- **Features:**
  - Dynamic route `[id]` parameter
  - Server component that fetches product by ID
  - Passes product data as defaultValues to ProductForm in `mode="edit"`
  - Title: "Edit Product"
  - 404 handling if product not found
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T13: Create Delete Product Dialog
- **Action:** CREATE `dresscave/components/products/delete-product-dialog.tsx`
- **Patterns:** `dresscave/components/profile/delete-account-dialog.tsx`
- **Features:**
  - Dialog with confirmation text and product name
  - Calls `deleteProduct` server action
  - Loading state, error display
  - On success refreshes product list and closes dialog
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T14: Create Image Uploader Component
- **Action:** CREATE `dresscave/components/products/image-uploader.tsx`
- **Patterns:** `dresscave/components/profile/measurements-form.tsx`
- **Features:**
  - Drag-and-drop zone with click-to-upload fallback
  - Multiple file selection
  - Preview thumbnails for uploaded images
  - Set primary image (star/check indicator)
  - Drag-to-reorder (using HTML5 drag events)
  - Delete individual images with confirmation
  - Calls `uploadImage` / `deleteImage` server actions
  - Client component with `"use client"`
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T15: Create Category Management Page
- **Action:** CREATE `dresscave/app/(dashboard)/admin/categories/page.tsx`
- **Patterns:**
  - `dresscave/app/(dashboard)/account/page.tsx`
  - `dresscave/app/(dashboard)/admin/products/page.tsx`
- **Features:**
  - Server component fetching all categories
  - Display categories in hierarchical tree/list
  - Inline "Add Subcategory" button for each parent
  - Edit inline (name change) or via dialog
  - Delete with protection (won't delete if products reference it)
  - Client component for interactive parts
- **Validate:** `npx tsc --noEmit 2>&1 | tail -20`

#### T16: Add Product Schema Tests
- **Action:** CREATE `dresscave/tests/products/schemas.test.ts`
- **Patterns:** `dresscave/tests/auth/schemas.test.ts`
- **Test cases:**
  - `CreateProductSchema` accepts valid data, rejects missing name, rejects negative price, rejects empty sizes/colors
  - `UpdateProductSchema` accepts partial update, rejects invalid field types
  - `ProductSchema` accepts full product data, handles optional deleted_at
  - `CATEGORIES` and `SIZES` constants exported correctly
  - `CategorySchema` accepts valid category, rejects missing name
  - `CreateCategorySchema` accepts with/without parent_id
- **Validate:** `npx vitest run --reporter=verbose 2>&1 | tail -30`

## Testing Strategy

- **Unit tests (Vitest):** Zod schema validation tests for CreateProductSchema, UpdateProductSchema, ProductSchema, CategorySchema — following the pattern in `tests/auth/schemas.test.ts`
- **Type checking:** `npx tsc --noEmit` after each task to catch type errors early
- **Manual testing:** Admin can navigate to `/admin/products/new`, create a product, see it in the list, edit it, toggle featured/new, upload images, delete it
- **Future (not in scope):** E2E tests with Playwright for admin flows, integration tests for server actions

## Validation Plan

| Step | Command | When |
|------|---------|------|
| Type-check | `npx tsc --noEmit` | After each task |
| Lint | `npx next lint` | After all tasks |
| Test | `npx vitest run` | After T16 + at end |
| Build | `npm run build` | At end |

---
*DCW artifact — generated by deterministic-code-workflow*
