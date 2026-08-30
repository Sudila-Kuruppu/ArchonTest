---
title: 'Story 1.3: Build Core Component Library (Buttons, Inputs, Modals, Bottom Nav)'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-2'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Stories 1.4-1.13 and every later epic need a single accessible, token-driven library for the four most-reused primitives (buttons, text inputs, modals, mobile bottom nav) or every later surface invents its own styles, focus behavior, and nav layout. DESIGN.md's `Components` block has deferred gaps: no shadow tokens (toasts/cards/modals render flat), btn-* disabled states are unspecified, and the bottom nav 5-item count + xs icon-only collapse + iOS/Android safe-area offset live only in prose.

**Approach:** Append a 'Core Components' section to `public/assets/css/tickettrade.css` (existing 1.1 single production stylesheet) using only existing tokens + three new shadow/scrim tokens in the same file (raw-hex scope preserved). Add two ES-module helpers under `public/assets/js/` — `a11y.js` (focus trap, return-focus, aria-live announcer) and `modal.js` (open/close API, scroll-lock with counter, per-call scrim-click guard, refuses nested opens). Ship `public/components-test.html` modeled on `public/theme-test.html` with 13 I/O-Matrix assertions.

## Boundaries & Constraints

**Always.** Every visual value resolves through `var(--token)`; no raw hex outside the 1.1 allowlist. Light/dark parity: use the `*-dark` pair tokens from 1.1; themes rebind without class swaps. Modals trap focus, close on ESC and X, return focus to the trigger on close, expose `role="dialog"` + `aria-modal="true"` + `aria-labelledby`. Scrim click closes after per-call `scrimGuardMs` (default 0; 1.9 purchase flow opts in). Tap targets ≥44px (iOS) / 48dp (Android). Bottom nav 64px tall. `prefers-reduced-motion: reduce` removes transform/box-shadow animations. Bottom nav: 5 items Board, My Listings, My Tickets, Sales, Profile in that order, `aria-current="page"` on the active one, `aria-label` retained when labels collapse to icons at <576px, hidden ≥768px, `padding-bottom: env(safe-area-inset-bottom)`. No badge counts (locked anti-pattern). New shadow tokens (`--shadow-1`, `--shadow-2`, `--scrim`) are declared in `public/assets/css/tickettrade.css` (the allowlisted file).

**Ask First.** Adding the new shadow tokens to `DESIGN.md` frontmatter here is out of scope; that update belongs to 1.4. The `Support\Modal::open()` PHP helper is forward-looking; the PHP autoloader does not exist yet (story 2.1 owns `composer.json` + `App\` PSR-4). 1.3 ships the browser-side API; the PHP wrapper is a no-op here.

**Never.** No emoji, no bottom-nav badge counts, no raw hex outside the allowlist, no `style="..."` inline in the test page, no new build step (vanilla ES2020), no nested modals (deepest stack is listing modal → purchase confirmation, owned by 1.9).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| BUTTON_VARIANTS | `<button class="btn-primary|danger|secondary|ghost">` | primary/danger: token fill + on-primary text; secondary: transparent + primary text/border; ghost: transparent + on-surface text; all use `--radius-md`, 44px min-height, hover swap; `disabled` → `surface-container-high` + `on-surface-variant` + no hover | N/A |
| BUTTON_LOADING | `<button class="btn-primary" data-loading="true">Confirm</button>` | label replaced by inline SVG spinner with `aria-label="Loading"`, `aria-busy="true"`, `min-width` preserves original label width | N/A |
| INPUT | `<input class="input-field" type="email" autocomplete="email">` (+ optional `<small class="input-error">` sibling) | `surface-raised` fill, on-surface text, `outline-variant` 1px border, `--radius-sm`, `body-md` size; dark mode rebinds via `*-dark` pair tokens; focus ring follows `sm` radius; `data-error` swaps border to `var(--color-error)`, sets `aria-invalid="true"` | N/A |
| MODAL_OPEN | call `openModal(rootEl, { trigger, scrimGuardMs: 2000 })` | body scroll locked (counter), focus moves to first focusable inside, Tab/Shift+Tab trapped, ESC and X close, scrim click closes after `scrimGuardMs`; on close: focus returns to `trigger`, body scroll restored | missing `role="dialog"` or `aria-modal="true"` throws `TypeError` before any DOM mutation |
| MODAL_NESTED | `openModal` while another is open | returns `false`, `console.warn("nested modal blocked")`, outer modal stays focused | N/A |
| BOTTOM_NAV | `<nav class="bottom-nav" aria-label="Primary">` with 5 `.bottom-nav-item` children (2nd has `aria-current="page"`) | 64px tall, `position:fixed; bottom:0`, `border-top:1px solid var(--color-border-hairline)`, `padding-bottom:env(safe-area-inset-bottom)`; 5 items evenly distributed; active uses `var(--color-primary)` icon+label, inactive uses `var(--color-on-surface-variant)`; labels collapse to icons at <576px; `display:none` at ≥768px | N/A |
| INPUT_ERROR | INPUT with `data-error="true"` + sibling error | `aria-invalid="true"` + `aria-describedby="x"` on the input, border `var(--color-error)`, error text 12px `var(--color-error)` | N/A |
| MODAL_ESC | press ESC after `openModal` | modal closes, focus returns to trigger | N/A |
| MODAL_X_CLOSE | click `[data-modal-close]` after `openModal` | modal closes, focus returns to trigger | N/A |
| MODAL_SCRIM_GUARD | with `scrimGuardMs: 50`, click scrim within 50ms (ignored), wait 60ms, click scrim again | first click ignored, second click closes | N/A |
| MODAL_FOCUS_RETURN | close a modal opened with `trigger: btn` | `document.activeElement === btn` | N/A |
| MODAL_INVALID_ROLE | `openModal` on element missing `role="dialog"` | `TypeError` thrown before any DOM mutation | N/A |
| BOTTOM_NAV_HIDDEN_DESKTOP | viewport ≥768px | `getComputedStyle(bottomNav).display === 'none'` | N/A |

</frozen-after-approval>

## Code Map

- `public/assets/css/tickettrade.css` -- 1.1 token file + 1.2 theme + toggle widget. Append a 'Core Components' section. New shadow tokens declared in `:root`. All recipes use `var(--...)` only.
- `public/assets/js/a11y.js` -- ES module. Exports `trapFocus(container)`, `releaseFocus(container, returnTo?)`, `announce(message, { politeness: 'polite'|'assertive' })`, `getFocusable(root)`, `bindSkipLink(skipLinkEl, mainId)`. Owns a single `<div id="a11y-announcer" aria-live="polite" aria-atomic="true">`.
- `public/assets/js/modal.js` -- ES module. Imports from `./a11y.js`. Exports `openModal(rootEl, options)`, `closeModal(rootEl)`, `isOpen(rootEl)`. Scroll-lock via `document.body.style.overflow = 'hidden'` + a counter.
- `public/components-test.html` -- Mirrors `public/theme-test.html`. `<head>` loads `assets/css/tickettrade.css`. 13 assertions; PASS/FAIL to `<pre>`; `data-pass` / `data-fail`.
- `scripts/check_no_raw_hex.sh` -- 1.1 linter, no change.
- `composer.json` -- Add `"test:components"` placeholder (echo).

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- Append 'Core Components' section. Declare `--shadow-1`, `--shadow-2`, `--scrim` in `:root`. Recipes: `.btn-primary/danger/secondary/ghost` + `:hover` + `:disabled` + `[data-loading]`, `.input-field` + `:focus-visible` + `[data-error]`, `.input-error`, `.modal-scrim`, `.modal-dialog`, `.bottom-nav`, `.bottom-nav-item`, `.bottom-nav-item[aria-current="page"]`. 44px min-height on `.btn-*`. Reduced-motion guard. -- single production stylesheet
- [ ] `public/assets/js/a11y.js` -- ES module. `trapFocus` stores `document.activeElement`, focuses first item from `getFocusable`, binds keydown that wraps Tab/Shift+Tab. `releaseFocus` removes handler and calls `returnTo.focus()`. `announce` updates the shared `#a11y-announcer`. `bindSkipLink` jumps to `#main` and shifts focus. -- focus trap + live region
- [ ] `public/assets/js/modal.js` -- ES module. `openModal` validates `role="dialog"` and `aria-modal="true"` (throws `TypeError` otherwise), refuses nested opens (returns `false`, `console.warn`), removes `hidden`, pushes onto open stack, locks body scroll via counter, calls `trapFocus`. `scrimGuardMs` via `setTimeout` cleared on close. `closeModal` reverses all and calls `releaseFocus`. -- open/close API
- [ ] `public/components-test.html` -- 13 assertions for I/O Matrix. One example of each component, hidden `[data-component-self-test]` fixture, `<pre id="results">` log. PASS/FAIL to `<pre>`; `data-pass`/`data-fail` on `<pre>`. -- atomic verify target
- [ ] `composer.json` -- Add `"test:components"` echo placeholder. Real headless wiring is epic 9. -- composer wiring in place
- [ ] `scripts/verify/1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.sh` -- Atomic per-slice verify. Boots dev server, fetches `/components-test.html`, asserts all 13 I/O rows via `php-cli` and `DOMDocument` evaluation. Captures evidence to `verification_evidence/1-3-.../<ts>/`. -- atomic per-slice verify is green

**Acceptance Criteria:**
- Given a developer writes `<button class="btn-primary">Confirm</button>`, when the page renders in either theme, then the button uses the token fill + on-primary text + `--radius-md` + 44px min-height, the hover swap to `var(--color-primary-dark)` fires, the `disabled` state uses `surface-container-high` + `on-surface-variant` with no hover, and no raw hex appears outside the allowlist.
- Given `data-loading="true"` on a primary button, when the attribute is present, then the label is replaced by an inline SVG spinner with `aria-label="Loading"`, `aria-busy="true"` is set, and the button width is preserved.
- Given a developer writes `<input class="input-field" type="email" autocomplete="email">`, when the page renders in dark mode, then the input binds to the `*-dark` pair tokens, the focus-visible ring follows the `sm` border-radius, and `data-error` swaps the border to `var(--color-error)` and sets `aria-invalid="true"`.
- Given a developer calls `openModal(rootEl, { trigger, scrimGuardMs: 2000 })`, when the call runs, then body scroll locks, focus moves inside, Tab/Shift+Tab is trapped, ESC and X close, the first 2s of scrim clicks are ignored, and on close focus returns to `trigger`. Missing `role="dialog"` or `aria-modal="true"` throws before any DOM mutation.
- Given a developer opens a second modal while the first is open, when the second call runs, then it returns `false`, `console.warn("nested modal blocked")` fires, and the first modal stays focused.
- Given a developer writes a `<nav class="bottom-nav">` with 5 items (2nd has `aria-current="page"`), when the page renders at 375px, then the nav is 64px tall, fixed, with `padding-bottom: env(safe-area-inset-bottom)`, the 5 items distribute evenly, the active item uses `var(--color-primary)` icon+label, inactives use `var(--color-on-surface-variant)`, labels collapse to icons at <576px, and at ≥768px the nav is `display:none`.
- Given `prefers-reduced-motion: reduce`, when a button enters the loading state, then the spinner is static.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0 (1.1 contract is preserved)
- `bash scripts/verify/1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.sh` -- expected: exit 0; `OK: 1-3 core component library green`; evidence written
- `composer test:tokens` -- expected: exit 0
- `composer test:components` -- expected: exit 0 (placeholder echo until epic 9)
