---
title: 'Story 1.5: Build Corkboard Board Presentation with List-View Toggle'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-3 + CAP-7'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/empty-error-state-library.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Visitors (student or guest) browse the marketplace as a corkboard with paper-flyer listing cards. The cork is the campus metaphor and the distinctive visual identity, but the chrome must degrade automatically on small screens and for reduced-motion users. The board also owns three empty states (no listings, no category results, no search matches) and one error state (fetch fails), each with a recovery action — Epic 1 ships the chrome + copy, Epic 3 owns the data.

**Approach:** Append a 'Board' section to `public/assets/css/tickettrade.css` after the 1.4 Brand-Specific Components block. Add a cork texture SVG asset under `public/assets/img/cork.svg` (≤100 KB). Add `public/assets/js/corkboard.js` for the deterministic ±2° rotation seeded by listing id + the list-view toggle. Ship `public/board.php` (static stub — Epic 3 owns the data) and `public/board-test.html` with 10 I/O-Matrix assertions covering both presentations, the toggle, and the four state copies.

## Boundaries & Constraints

**Always.** Cork texture background + paper card surfaces with deterministic ±2° rotation seeded by listing id render on ≥768px; cork/pin/rotation are `aria-hidden`; ranking is never conveyed by rotation. Header toggle flips to a plain grid via `aria-pressed` and persists per session via `sessionStorage` (NOT `localStorage` — list-view is a session-scoped preference). On <768px and on `prefers-reduced-motion: reduce`, the corkboard auto-degrades with identical listing order. The cork texture asset is ≤100 KB. All motion is transform/opacity-only. Empty/error copy from `empty-error-state-library.md` ships verbatim: `No listings yet. Create your first one.` (CTA: `Create Listing` FAB), `No listings in {category}.` (`Clear filter` link), `No matches for {query}.` (`Clear search` link), `Couldn't load listings. Tap to retry.` (refresh icon). No emoji, no encouragement filler.

**Ask First.** Changing the rotation seed algorithm or angle range: HALT and ask (the visual identity hinges on the seed). Persisting list-view across sessions: out of scope (session-only).

**Never.** No raw hex outside the 1.1 allowlist. No new build step (vanilla ES2020 + SVG). No infinite scroll (lists are paginated — Epic 3 owns the paging). No emoji in any state copy. No nested modal markers. No algorithmic reputation scores on listing cards.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| CORKBOARD_DESKTOP | viewport ≥768px, listings = [1,2,3] | cork texture background; cards rotated ±2° (seeded by id); pushpin graphics on `::before`; ranking conveyed by position not rotation; all decorative items `aria-hidden` | N/A |
| CORKBOARD_MOBILE | viewport <768px | auto-degrades to plain grid; no rotation; no pushpin; identical listing order | N/A |
| CORKBOARD_REDUCED_MOTION | `prefers-reduced-motion: reduce` | same as mobile (plain grid; no rotation; no pushpin) | N/A |
| LIST_VIEW_TOGGLE | click toggle in header | flips to plain grid; `aria-pressed="true"`; `sessionStorage.corkboard.listView = "true"` | N/A |
| LIST_VIEW_TOGGLE_RESTORE | reload after toggling list-view | restores to list-view on this session (sessionStorage hit); next session returns to corkboard default | sessionStorage absent → corkboard default |
| LIST_VIEW_MOBILE | viewport <768px | toggle hidden; plain grid is the only presentation | N/A |
| EMPTY_NO_LISTINGS | listings = [] | cork background visible (cork is the surface, not the data); centered copy `No listings yet. Create your first one.` + FAB `Create Listing` (visible only to authenticated students; for guests, copy is `No listings yet. Be the first to post.` + sign-in CTA) | N/A |
| EMPTY_CATEGORY_FILTER | listings filtered to category = [] | copy `No listings in {category}.` + `Clear filter` link | N/A |
| EMPTY_SEARCH | search query with 0 matches | copy `No matches for {query}.` + `Clear search` link (includes the query so the user sees the right search ran) | N/A |
| FETCH_FAIL | listings fetch rejects | copy `Couldn't load listings. Tap to retry.` + refresh icon button (no auto-retry) | the copy and recovery action are the contract; the fetch retry is Epic 3's behavior |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the UX Patterns section covers the corkboard metaphor.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- cork base/grain tokens, listing-card component tokens. Read-only.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/empty-error-state-library.md` -- the four state copies + recovery actions for the board.
- `public/assets/css/tickettrade.css` -- existing. Append a 'Board' section with `.corkboard`, `.corkboard-card`, `.corkboard-card[data-listing-id]` (uses `transform: rotate(...)` via inline style for the seeded rotation), `.corkboard-pin`, `.corkboard-list-view`, `.board-state-empty`, `.board-state-error`.
- `public/assets/img/cork.svg` (new) -- cork texture SVG, ≤100 KB. Tileable; uses the existing `--color-cork-base` and `--color-cork-grain` tokens. (Raw hex appears only inside the SVG asset's text — the linter excludes `.svg` files.)
- `public/assets/js/corkboard.js` (new) -- ES module. Exports `applyRotations(listingCards)`, `initToggle(toggleEl, containerEl)`. Reads `sessionStorage.corkboard.listView`. Sets `transform: rotate(<seeded-deg>deg)` on each card via inline style.
- `public/board.php` (new) -- static stub. Loads `tickettrade.css`, `corkboard.js`, renders the corkboard shell + 4 state stubs (no listings, no category, no search, fetch fail). Epic 3 wires the data.
- `public/board-test.html` (new) -- 10 assertions for I/O Matrix.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- append 'Board' section. Recipes using ONLY existing tokens: `.corkboard` (cork texture background, decorative), `.corkboard-card` (paper surface, `rounded.md`, `aria-hidden="false"`), `.corkboard-pin` (pushpin graphic on `::before`, `aria-hidden="true"`), `.corkboard-list-view` (plain grid via `aria-pressed` selector on the toggle), `.board-state-empty`, `.board-state-error`. Reduced-motion guard. `@media (max-width: 767px)` auto-degrade to plain grid. `@media (prefers-reduced-motion: reduce)` auto-degrade to plain grid.
- [ ] `public/assets/img/cork.svg` -- tileable cork texture SVG, ≤100 KB. Uses `--color-cork-base` and `--color-cork-grain` tokens (referenced via CSS or as embedded currentColor).
- [ ] `public/assets/js/corkboard.js` -- ES module. `applyRotations(cards)` sets `transform: rotate(<seeded-deg>deg)` per card. `initToggle(toggleEl, containerEl)` reads `sessionStorage.corkboard.listView`, applies the toggle state, persists on click. Both honor reduced-motion and mobile breakpoint (no-op on <768px).
- [ ] `public/board.php` -- static stub. Renders the corkboard shell + 4 state stubs. Loads `tickettrade.css` and `corkboard.js`. No data wiring (Epic 3 owns the data).
- [ ] `public/board-test.html` -- 10 assertions for I/O Matrix.
- [ ] `composer.json` -- add `"test:board"` echo placeholder.
- [ ] `scripts/verify/1-5-build-corkboard-board-presentation-with-list-view-toggle.sh` -- atomic per-slice verify.

**Acceptance Criteria:**
- Given a developer renders the board at viewport ≥768px with listings = [1,2,3], when the page renders, then cork texture background is visible, each card is rotated ±2° (seeded by listing id), pushpin graphics appear, all decorative items are `aria-hidden`, and ranking is conveyed by position not rotation.
- Given a developer renders the board at viewport <768px or with `prefers-reduced-motion: reduce`, when the page renders, then the corkboard auto-degrades to a plain grid with identical listing order.
- Given a developer clicks the list-view toggle in the header, when the click is processed, then the board flips to a plain grid, `aria-pressed="true"` on the toggle, and `sessionStorage.corkboard.listView = "true"`. Restoring the session restores the list-view.
- Given listings = [], when the page renders, then the cork background is visible, the copy is `No listings yet. Create your first one.` (or guest variant), and the FAB CTA is present for authenticated students.
- Given a search query returns 0 matches, when the page renders, then the copy is `No matches for {query}.` with a `Clear search` link that includes the query text.
- Given the listings fetch fails, when the page renders, then the copy is `Couldn't load listings. Tap to retry.` with a refresh icon button.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/verify/1-5-build-corkboard-board-presentation-with-list-view-toggle.sh` -- expected: exit 0
- `composer test:board` -- expected: exit 0 (placeholder echo)
