---
title: 'Story 1.13: Build Empty-State and Error-State Library for Every Surface'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-7'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/empty-error-state-library.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every surface that can be empty (no data) or fail (fetch error) needs documented, actionable copy with a recovery action. The catalogued copy lives in `empty-error-state-library.md` but the chrome (rendered component, focus order, ARIA, color) is not in the codebase. Without a shared library, every later story reinvents its own empty state.

**Approach:** Append a 'State' section to `public/assets/css/tickettrade.css`. Add `public/assets/js/state.js` (ES module exporting `renderEmpty(rootEl, { copy, cta? })` and `renderError(rootEl, { copy, retry? })`). Ship `public/state-test.html` with 12 I/O-Matrix assertions covering the Board, My Tickets, Listing Modal, Seller Dashboard, Admin Reports Queue, and Leaderboard states. The catalogued copy ships verbatim — deviations need an explicit `composer test:banned` review override.

## Boundaries & Constraints

**Always.** Copy catalogued in `empty-error-state-library.md` ships verbatim (no paraphrasing). Every state includes a recovery action: CTA, `Clear filter`, `Clear search`, or retry. Empty state for the Board when listings = []: `No listings yet. Create your first one.` (CTA: `Create Listing` FAB; guest variant: `No listings yet. Be the first to post.` with sign-in CTA). Empty state for category filter: `No listings in {category}.` with `Clear filter` link. Empty state for search: `No matches for {query}.` with `Clear search` link (includes the query). Fetch fail state: `Couldn't load listings. Tap to retry.` with refresh icon button (no auto-retry). My Tickets empty: `No tickets yet. Buy your first item.` with link to Board. Listing Modal out of stock: `Sold out` (Buy Now replaced; status badge `sold`). Self-owned listing: Buy Now hidden; `Edit` + `Delete` actions visible; `You own this listing.` note. Wrong redemption code attempts 1-4: inline error `Code not recognized.` with counter `N of 5 attempts remaining`. Wrong code attempt 5 (rate-limit): field disabled for 1 hour; error `Too many attempts. Try again in 1 hour.`. Already-redeemed code: `This ticket was already redeemed on {timestamp}.` (no new state change; idempotent). No emoji. No encouragement filler.

**Ask First.** Adding a new surface's empty/error states: HALT and ask (the catalogued surfaces are the locked scope). Paraphrasing the catalogued copy: HALT and ask.

**Never.** No raw hex outside the 1.1 allowlist. No emoji in any state copy. No encouragement filler (`You're doing great!`, `Way to go!`, etc.). No nested modal markers (state renders inline, not as a modal). No raw hex in the state components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| STATE_EMPTY_BOARD | listings = [] | centered copy `No listings yet. Create your first one.` + FAB `Create Listing` (or guest variant + sign-in CTA); cork background visible | N/A |
| STATE_EMPTY_CATEGORY | filtered to category with 0 listings | copy `No listings in {category}.` + `Clear filter` link | N/A |
| STATE_EMPTY_SEARCH | search query with 0 matches | copy `No matches for {query}.` + `Clear search` link (includes the query text) | N/A |
| STATE_FETCH_FAIL | listings fetch rejects | copy `Couldn't load listings. Tap to retry.` + refresh icon button (no auto-retry) | N/A |
| STATE_EMPTY_MY_TICKETS | tickets = [] across all tabs | copy `No tickets yet. Buy your first item.` + link to Board | N/A |
| STATE_LISTING_OUT_OF_STOCK | `quantity_sold == quantity` | Buy Now button replaced with `Sold out` text; status badge `sold` | N/A |
| STATE_SELF_OWNED | seller == current user | Buy Now hidden; `Edit` + `Delete` actions visible; note `You own this listing.` above seller row | N/A |
| STATE_REDEEM_FAIL | wrong redemption code, attempts 1-4 | inline error `Code not recognized.` + counter `N of 5 attempts remaining`; field remains interactive | N/A |
| STATE_REDEEM_RATE_LIMIT | wrong code attempt 5 | field disabled for 1 hour; error `Too many attempts. Try again in 1 hour.` | N/A |
| STATE_REDEEM_REPLAY | already-redeemed code | `This ticket was already redeemed on {timestamp}.`; idempotent — no new state change, no error code thrown | N/A |
| STATE_A11Y_ROLES | every state container | `role="status"` for empty, `role="alert"` for error; `aria-live` matches; copy is keyboard-reachable | N/A |
| STATE_NO_EMOJI | every state copy | `composer test:banned` (1.12) confirms no emoji | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the empty/error states cross-story dependency (1.5 owns Board, 1.13 owns the library chrome).
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- tokens.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/empty-error-state-library.md` -- companion distillation; the copy catalog.
- `public/assets/css/tickettrade.css` -- existing. Append 'State' section. Recipes: `.state-empty`, `.state-error`, `.state-action`, `.state-redeem-fail`, `.state-redeem-rate-limit`, `.state-already-redeemed`.
- `public/assets/js/state.js` (new) -- ES module. Exports `renderEmpty(rootEl, { copy, cta? })`, `renderError(rootEl, { copy, retry? })`. Sets `role="status"` / `role="alert"`.
- `public/state-test.html` (new) -- 12 assertions.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- append 'State' section. Recipes using ONLY existing tokens. Empty/error states use `surface-container` fill + `on-surface` text + `rounded.lg` + centered layout.
- [ ] `public/assets/js/state.js` -- ES module. `renderEmpty(rootEl, { copy, cta? })` renders the empty state with `role="status"` and `aria-live="polite"`. `renderError(rootEl, { copy, retry? })` renders with `role="alert"` and `aria-live="assertive"`. Both render the CTA / Clear filter / Clear search / retry action as appropriate.
- [ ] `public/state-test.html` -- 12 assertions for I/O Matrix. Mirrors `components-test.html`.
- [ ] `scripts/verify/1-13-build-empty-state-and-error-state-library-for-every-surface.sh` (new) -- per-slice verify.

**Acceptance Criteria:**
- Given a developer calls `renderEmpty(rootEl, { copy: 'No listings yet. Create your first one.', cta: { label: 'Create Listing', href: '/listings/new' } })`, when the call runs, then the empty state renders with `role="status"`, the copy is verbatim, the CTA is keyboard-reachable, and the screen reader announces the copy.
- Given a developer calls `renderError(rootEl, { copy: "Couldn't load listings. Tap to retry.", retry: () => location.reload() })`, when the call runs, then the error state renders with `role="alert"`, the refresh icon button calls `retry()` on click, and the screen reader announces the copy.
- Given the wrong redemption code is entered on attempts 1-4, when the user submits, then the inline error `Code not recognized.` appears with counter `N of 5 attempts remaining`. On attempt 5, the field is disabled for 1 hour and the error `Too many attempts. Try again in 1 hour.` appears.
- Given an already-redeemed code is submitted, when the user submits, then `This ticket was already redeemed on {timestamp}.` appears; no new state change, no error code thrown (idempotent).
- Given the catalogued copy is paraphrased, when `composer test:banned` runs, the linter does not fail (the linter checks anti-patterns, not copy fidelity) — copy fidelity is a code-review concern. Spec Change Log records any paraphrasing exceptions.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/check_banned_patterns.sh` -- expected: exit 0 (no emoji in state copy)
- `bash scripts/verify/1-13-build-empty-state-and-error-state-library-for-every-surface.sh` -- expected: exit 0
