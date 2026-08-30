# Epic 1 Context: UX Foundation & Design System

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Lock the visual and behavioral identity before any feature ships. Every color, font, spacing, shape, and elevation flows from a single design-token set so no later surface carries a one-off hex, hard-coded font-size, or magic padding. Light/dark themes persist, the accessibility floor is enforced, and core components, toast system, and locked anti-patterns are wired into a linter so every later epic inherits the same look, feel, and contract. Three promoted mockups (Board, My Tickets, Admin Dashboard) become the canonical visual reference for everything that follows.

## Stories

- Story 1.1: Implement Design Token System
- Story 1.2: Implement Light/Dark Theme with LocalStorage Persistence
- Story 1.3: Build Core Component Library (Buttons, Inputs, Modals, Bottom Nav)
- Story 1.4: Build Brand-Specific Components (Rank Badge, Ticket-Code Block, Status Badge, Listing Card, Leaderboard Row)
- Story 1.5: Build Corkboard Board Presentation with List-View Toggle
- Story 1.6: Build Toast System and Identity Badges (Verified, Velocity, On-Break, Avatar Picker)
- Story 1.7: Build Tab, Search, Bulk-Action, Analytics, Report, and Audit-Log Row Components
- Story 1.8: Build Profile Surfaces (Tier Progress Bar, KPI Counter, Tier Privilege Tooltip, Star Rating Input)
- Story 1.9: Build Form Modals (Dispute, Report, Purchase Confirmation) and Admin Re-Auth Dialog
- Story 1.10: Enforce the Accessibility Floor (WCAG 2.1 AA, Keyboard, Screen Reader, Reflow, Reduced Motion, Tap Targets)
- Story 1.11: Ship the Three Promoted Mockup-Driven Reference Screens
- Story 1.12: Enforce Banned-Interaction Patterns and Voice-and-Tone Microcopy
- Story 1.13: Build Empty-State and Error-State Library for Every Surface

## Requirements & Constraints

- Tokens are the single source of truth for visual decisions; no raw hex, font-size, or spacing may appear outside the token file or its generated CSS. Adding a new visual value requires a named token first.
- Two theme modes persist in `localStorage` under `tickettrade.theme` and apply before first paint; first-visit fallback chains through role default → `prefers-color-scheme` → `data-theme` on `<html>`. Theme bootstrap must not call auth or time helpers.
- WCAG 2.1 AA is the floor: text contrast ≥4.5:1, large text and UI elements ≥3:1. Keyboard is mandatory: skip link first, focus-visible outlines, focus trap in modals, ESC to close, focus returns to trigger on close, ARIA roles and live regions on async feedback.
- Layout reflows to 320px without horizontal scroll. All motion respects `prefers-reduced-motion: reduce` — transforms and glow animations disabled. Tap targets ≥44pt iOS / 48dp Android; status badges are not interactive.
- A linter (`composer test:banned`) blocks banned patterns: emoji in functional copy, streak counters, daily-login displays, badge counts on the bottom nav, push-notification strings, infinite-scroll markers, nested modal markers, algorithmic-reputation-score markers, and encouragement filler.
- Toast feedback is required for all async actions; error and warning toasts need manual dismiss. Every surface that can be empty or fail must expose an actionable empty or error state with a recovery action.

## Technical Decisions

- Tokens, components, and behavior specs live in `public/assets/css/tickettrade.css`, `public/assets/js/`, and `Support\` helpers (`A11y`, `Toast`, `Modal`, `BulkAction`). CSS uses native custom properties as `var(--token-name)`; component recipes reference the design file via `{path.to.token}` syntax.
- Brand identity is NSBM green with a six-tier rank ladder (E Recruit through S Legend), each tier a fixed fill+foreground pair. Tier S carries a 2.4s `legend-glow` box-shadow pulse, disabled under reduced motion.
- Typography: `system-ui` for body, `Inter` for display and headlines, `ui-monospace` with `letter-spacing: 0.04em` for code surfaces. Spacing scale 4/8/12/16/24/32/48/64 px. Radii: `sm` 4px, `md` 8px, `lg` 12px, `xl` 16px, `full` 9999px.
- Frontend is Bootstrap 5.3.8 (CDN in dev, bundled for prod), vanilla ES2020 JS, no build step. Icons are inline SVG; no emoji in functional UI. Architecture spine is the Layered Modular Monolith; design and experience files win on conflict with any mock, wireframe, or import.
- Status palette has eight role fills (pending, active, rejected, redeemed, expired, sold, disputed, removed). Semantic palette is mode-invariant and AA-safe in both themes.
- Admin re-auth is a modal with a single password field; the window is a 300s sliding re-auth, rate-limited at 5/min/IP. Toasts: container with `aria-live`, max 3 queued, 4s auto-dismiss (pauses on hover/focus), manual dismiss required on error and warning; bottom-right on desktop, top on mobile.

## UX & Interaction Patterns

- **Corkboard metaphor on Board (≥768px).** Cork texture background, listing cards on paper surfaces with deterministic ±2° rotation seeded by listing id, pushpin graphic alternating red/blue by listing-id hash. Rotation, pin, and cork are `aria-hidden`; ranking is never conveyed by rotation. A list-view toggle in the header flips to a plain grid (state persisted per session via `aria-pressed`); on <768px the corkboard auto-degrades to the plain grid and the toggle is hidden.
- **Modal pattern.** Surface-raised fill, `rounded.lg` (12px), 24px padding, `max-width: 600px`. Closes on ESC, X button, or scrim click (purchase confirmation suppresses scrim click for 2s). Focus is trapped, returns to trigger on close, `aria-modal="true"`, `role="dialog"`, `aria-labelledby` on the title.
- **Status and rank badges.** Read-only full pills at caption typography. Status badges carry an `aria-label` with the human-readable state plus a timestamp tooltip on hover/focus. Rank badges show the tier name only — never a numeric points total.
- **Ticket code block.** Monospace amber text on near-black surface, 1px amber border, `rounded.sm`, `letter-spacing: 0.04em`, always preceded by `TK-`. Reveal/mask toggle (keyboard accessible, announces state) and a Copy button (`Copy` → `Copied` 1.5s) sit adjacent; a WhatsApp share button is adjacent.
- **Bottom nav (mobile).** 64px tall, fixed to bottom, five items (Board, My Listings, My Tickets, Sales, Profile). Active item uses primary icon+label; inactive uses on-surface-variant. `aria-current="page"` on the active item; no badge counts; hidden ≥768px.
- **Microcopy rules.** Short complete sentences with period, no exclamation in functional copy (landing hero excepted), tier names paired with tier code on first reference, dispute counts use "N disputes on record", purchase confirmations always include "a reservation, not payment".

## Cross-Story Dependencies

- **Story 1.1 (Design Tokens) underpins every other story in this epic and every later epic.** All visual decisions in 1.2–1.13 and every later story reference tokens from 1.1; raw values are rejected.
- **Story 1.2 (Theme) consumes tokens from 1.1 plus the light/dark neutral surface tokens. It must land before 1.11 ships so the promoted mockups reflect real theme behavior.**
- **Story 1.3 (Core Components) supplies the primitives used by 1.4, 1.6, 1.7, 1.8, 1.9, 1.13.** Buttons, inputs, modals, and the bottom nav must exist before brand-specific and form-modal stories can compose them.
- **Story 1.6 (Toast system) is consumed by every later epic** for async-action feedback.
- **Story 1.10 (Accessibility Floor) gates every visual decision in 1.1–1.9 and every later epic.** Contrast, keyboard, ARIA, reflow, reduced-motion, and tap-target rules are verified at every commit.
- **Story 1.12 (Banned patterns and microcopy) constrains copy in 1.5, 1.6, 1.8, 1.9, 1.13 and every later epic.** The `composer test:banned` linter is wired here.
- **Story 1.11 (Promoted mockups) is the visual contract for epics 2–5** and must align with the route table and state patterns in `EXPERIENCE.md`.
