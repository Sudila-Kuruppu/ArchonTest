---
title: 'Story 1.11: Ship the Three Promoted Mockup-Driven Reference Screens'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-5'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/EXPERIENCE.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epics 2-5 (Auth, Listings, Tickets) need a canonical visual contract for the three surfaces a student sees first (Board, My Tickets) and the surface admins see first (Admin Dashboard). Without promoted mockups, every later surface invents its own information architecture, layout, and chrome, and visual regression becomes subjective.

**Approach:** Promote the three reference mockups from `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/mockups/` (`board-mobile.html`, `my-tickets.html`, `admin-dashboard.html`) to `public/mockups/` as the canonical visual contract. Reconcile each mockup's information architecture with `EXPERIENCE.md`'s route table and state patterns. Ship `public/mockups/index.html` linking all three. Wire `composer test:mockups` that asserts each mockup parses as HTML, every documented token reference resolves, and the route table + state patterns match `EXPERIENCE.md`.

## Boundaries & Constraints

**Always.** The three mockups are the canonical visual contract for epics 2-5; design wins on conflict (DESIGN.md and EXPERIENCE.md are authoritative over any mockup, wireframe, or imports/* reference; promotion order is spine → mockup → imports). Each mockup is a static HTML file using ONLY tokens from `public/assets/css/tickettrade.css` + the 1.x components from `public/assets/js/`. The mockups link to each other via a top-nav. The mockups do not include any back-end writers (epics 3-5 own the data). Mockups may use a 1px data-table sticky-first-column for the Admin Dashboard tables. Mockups load Inter via Google Fonts preconnect + css2 link in `<head>` (per the constraint). `prefers-reduced-motion: reduce` is honored in every mockup (the corkboard 1.5 mockup auto-degrades; the toasts 1.6 mockup has no slide animation). Each mockup is keyboard-reachable end-to-end.

**Ask First.** Adding a fourth mockup (e.g. `profile.html`): HALT and ask. Changing the route table: HALT and ask (it lives in `EXPERIENCE.md`).

**Never.** No raw hex outside the 1.1 allowlist. No back-end writers in the mockups. No new build step. No emoji. No encouragement filler.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| MOCKUP_PROMOTED | the three mockups from `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/mockups/` | copied to `public/mockups/board-mobile.html`, `public/mockups/my-tickets.html`, `public/mockups/admin-dashboard.html`; each normalized to the canonical token system | any token reference that fails the 1.1 contract halts the copy |
| MOCKUP_INDEX | `public/mockups/index.html` | links all three mockups with `<a>`; the top-nav uses the 1.3 button primitives | N/A |
| ROUTE_TABLE_RECONCILE | each mockup's `<nav>` and `<a href>` | matches `EXPERIENCE.md`'s route table | any drift is a Spec Change Log entry |
| TOKENS_RESOLVE | every `var(--token)` in the mockups | resolves to a non-empty value via `getComputedStyle` | N/A |
| INTER_LOADED | `<head>` of every mockup | includes Google Fonts preconnect + css2 link for Inter; falls back to `system-ui` if the link is offline | N/A |
| KEYBOARD_REACH | every interactive element in the mockups | Tab order covers all interactive elements; visible focus | N/A |
| REDUCED_MOTION | corkboard 1.5 mockup with `prefers-reduced-motion: reduce` | corkboard auto-degrades to plain grid; no rotation; no pushpin | N/A |
| REFLOW_320 | each mockup at 320px | no horizontal scroll; data tables (admin) scroll inside container with sticky first column | N/A |
| DESIGN_WINS | a conflict between mockup and DESIGN.md | DESIGN.md wins; the mockup is updated to match | conflict recorded in Spec Change Log |
| MOCKUP_LINKS | click a link from one mockup to another | navigation works; the back link returns to `index.html` | broken link halts the audit |
| ARIA_LANDMARKS | each mockup | has `<header>`, `<main>`, `<nav>`, `<footer>` landmarks with `aria-label` where needed | N/A |
| SKIP_LINK | each mockup | first focusable element is the skip link to `#main` | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the Cross-Story Dependencies section is the contract (1.11 is the visual contract for epics 2-5).
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- tokens + components.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/EXPERIENCE.md` -- route table + state patterns. Read-only; authoritative.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md` -- companion distillation.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/mockups/board-mobile.html`, `my-tickets.html`, `admin-dashboard.html` -- the source mockups.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/imports/*-prior.html` -- prior session's reference mockups; informational only.
- `public/mockups/board-mobile.html` (new) -- promoted canonical reference.
- `public/mockups/my-tickets.html` (new) -- promoted canonical reference.
- `public/mockups/admin-dashboard.html` (new) -- promoted canonical reference.
- `public/mockups/index.html` (new) -- top-level mockup directory; links all three.
- `public/assets/css/tickettrade.css` -- existing; all mockups reference this.
- `scripts/check_no_raw_hex.sh` -- existing; mockups must not introduce raw hex.

## Tasks & Acceptance

**Execution:**
- [ ] `public/mockups/board-mobile.html` (new) -- promote from the planning tree; normalize to the canonical token system; add Google Fonts preconnect + css2 link; add skip link; ensure `prefers-reduced-motion: reduce` is honored; ensure 320px reflow.
- [ ] `public/mockups/my-tickets.html` (new) -- same.
- [ ] `public/mockups/admin-dashboard.html` (new) -- same; data tables scroll inside container with sticky first column.
- [ ] `public/mockups/index.html` (new) -- links all three with the 1.3 button primitives.
- [ ] `composer.json` -- add `"test:mockups"` script that asserts each mockup parses as HTML, every documented token reference resolves, and the route table + state patterns match `EXPERIENCE.md`.
- [ ] `scripts/verify/1-11-ship-the-three-promoted-mockup-driven-reference-screens.sh` (new) -- atomic per-slice verify.

**Acceptance Criteria:**
- Given a developer opens `public/mockups/board-mobile.html`, when the page renders, then the corkboard presentation matches the canonical token system, every `var(--token)` resolves to a non-empty value, the page is keyboard-reachable, and `prefers-reduced-motion: reduce` is honored.
- Given a developer opens `public/mockups/my-tickets.html`, when the page renders, then the four-tab structure (Active / Redeemed / Expired / Disputed) matches `EXPERIENCE.md` and the ticket-code block uses the amber-on-near-black token set.
- Given a developer opens `public/mockups/admin-dashboard.html`, when the page renders, then the four KPI tiles use the analytics card chrome from 1.7 and data tables scroll inside their container with a sticky first column.
- Given a conflict between a mockup and `DESIGN.md`/`EXPERIENCE.md` is found, when the audit runs, then `DESIGN.md`/`EXPERIENCE.md` wins and the conflict is logged in the Spec Change Log.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/verify/1-11-ship-the-three-promoted-mockup-driven-reference-screens.sh` -- expected: exit 0
- `composer test:mockups` -- expected: exit 0
