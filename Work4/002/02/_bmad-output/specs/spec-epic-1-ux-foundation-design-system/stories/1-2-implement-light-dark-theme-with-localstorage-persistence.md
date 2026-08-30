---
title: 'Story 1.2: Implement Light/Dark Theme with LocalStorage Persistence'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-1'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.1's token file binds to `[data-theme="dark"]` and `[data-theme="light"]`, but nothing flips the attribute, persists the choice, or hosts a toggle. Every later surface needs the theme infrastructure first, and the bootstrap must not call auth or time helpers so first paint is the right theme with no FOUC.

**Approach:** A vanilla-JS module under `public/assets/js/` owns theme state. A synchronous inline bootstrap in `<head>` sets `data-theme` before first paint. A reusable 3-state toggle widget (Light / Dark / System) renders the choice. The page emits `data-default-theme` on `<html>` at render time; the role default (student=dark, admin=light) is the page's job, not the module's. The `/settings` page that hosts the toggle lands later (out of scope here).

## Boundaries & Constraints

**Always.**
- `data-theme` on `<html>` is the single source of theme state; CSS in `tickettrade.css` already binds to it.
- `localStorage` key is exactly `tickettrade.theme` with value `light` | `dark` | `system`; anything else is treated as absent.
- Bootstrap is a synchronous inline `<script>` in `<head>` that runs before the framework boots; it reads localStorage, falls back to `data-default-theme` (role default), then `prefers-color-scheme`, then `dark`.
- Bootstrap does NOT call `Support\Auth::current_user()` or `Support\Time::now()`.
- Toggle widget is a 3-state control: Light / Dark / System; current state is `aria-pressed="true"`; System is the state where localStorage is absent and `prefers-color-scheme` decides.
- Theme change emits a `tickettrade:theme-change` CustomEvent so other modules can re-render.
- Admin pages render `<html data-default-theme="light">`; student pages render `<html data-default-theme="dark">`.
- Toggle ships as a Web Component (`<theme-toggle>`) so any page can drop it in.

**Ask First.**
- Adding a fourth state to the toggle (e.g. `auto`/`high-contrast`): HALT and ask.
- Moving the toggle out of `<head>` to defer parsing: HALT and ask (FOUC is the contract).

**Never.**
- Calling auth or time helpers in the bootstrap script (FOUC risk).
- Reading localStorage at module import time (still defers, can FOUC).
- Persisting the toggle state on the server (out of scope; this is local-only).
- Adding a CSS animation to the theme flip (reduced-motion friendly transitions are owned by the component recipes in 1.3+).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| BOOTSTRAP_NO_THEME | no localStorage, no `data-default-theme`, no system preference | `data-theme="dark"` is the final state | N/A |
| BOOTSTRAP_LIGHT_DEFAULT | no localStorage, `<html data-default-theme="light">` | `data-theme="light"` is the final state | N/A |
| BOOTSTRAP_SYSTEM | no localStorage, system `prefers-color-scheme: light` | `data-theme="light"` is the final state | N/A |
| BOOTSTRAP_PERSISTED | localStorage `tickettrade.theme=dark` | `data-theme="dark"` is the final state; previous theme is overwritten only on explicit user action | corrupt localStorage value falls through to role default |
| BOOTSTRAP_FOUC | page load with persisted `light` | first paint uses light tokens; no flash of dark | no FOUC means bootstrap runs synchronously in `<head>` |
| TOGGLE_LIGHT | click Light while in dark | tokens flip to light; `aria-pressed="true"` on Light; localStorage=`light`; `tickettrade:theme-change` fires with `detail.theme="light"` | N/A |
| TOGGLE_DARK | click Dark while in light | tokens flip to dark; `aria-pressed="true"` on Dark; localStorage=`dark` | N/A |
| TOGGLE_SYSTEM | click System | localStorage key removed; tokens flip to `prefers-color-scheme` value; System `aria-pressed="true"` | N/A |
| CHANGE_EVENT | theme change from any source | `tickettrade:theme-change` CustomEvent fires; subscribers can re-render | N/A |

</frozen-after-approval>

## Code Map

- `public/assets/js/theme.js` -- ES2020 module. Exports `getTheme()`, `setTheme(value)`, `applyTheme(value)`, `clearStoredTheme()`, and a Web Component `<theme-toggle>`. Owns the `tickettrade:theme-change` event.
- `public/assets/js/theme-bootstrap.js` -- Synchronous inline-script variant. Emits the bootstrap logic in a way that can be pasted into `<head>` without a module loader.
- `public/theme-test.html` -- Test page. Boots with localStorage set/unset, exercises all 3 toggle states, fires the change event, and asserts no FOUC via a probe element at the top of `<body>` that records `getComputedStyle` at first paint.
- `public/index.php` -- Existing front controller. Add `<html data-default-theme="dark">` for the student surface.
- `public/admin/index.php` -- Existing admin front controller. Add `<html data-default-theme="light">`.
- `public/assets/css/tickettrade.css` -- Existing token file. No new tokens; the `[data-theme="dark"]` and `[data-theme="light"]` blocks already exist from 1.1.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/js/theme.js` -- Create the module. `getTheme()` returns the active theme; `setTheme(value)` updates localStorage and calls `applyTheme`; `applyTheme(value)` flips `data-theme` on `<html>` and fires `tickettrade:theme-change`. `clearStoredTheme()` removes the key. The Web Component renders the 3-state toggle, syncs `aria-pressed` on the active button, and delegates clicks to `setTheme`/`clearStoredTheme`. -- browser-side state owner
- [ ] `public/assets/js/theme-bootstrap.js` -- Synchronous bootstrap snippet. Reads localStorage, falls back to `data-default-theme` on `<html>`, then `prefers-color-scheme`, then `dark`. Sets `data-theme` synchronously. The snippet is the source for the inline `<head>` block. -- FOUC-free first paint
- [ ] `public/theme-test.html` -- Mirror of `components-test.html` pattern. Boots with localStorage set/unset, exercises all 3 toggle states, asserts no FOUC via a probe element at the top of `<body>` that records `getComputedStyle` at first paint; hidden `[data-theme-self-test]` fixture reads the bootstrap output via DOMContentLoaded. -- atomic verify target
- [ ] `public/index.php` -- Add `<html data-default-theme="dark">` for the student surface; add the inline `<head>` bootstrap snippet. -- role default wired
- [ ] `public/admin/index.php` -- Add `<html data-default-theme="light">`; add the inline `<head>` bootstrap snippet. -- admin role default wired
- [ ] `scripts/verify/1-2-implement-light-dark-theme-with-localstorage-persistence.sh` -- Atomic per-slice verify. Asserts all 9 I/O-Matrix rows; boots the dev server, fetches `/` and `/admin/` and asserts `data-theme` matches role default on first paint; exercises the toggle and asserts localStorage updates and `tickettrade:theme-change` fires. Captures evidence to `verification_evidence/1-2-.../<ts>/`. -- atomic per-slice verify is green

**Acceptance Criteria:**
- Given no localStorage and no system preference, when the bootstrap runs, then `<html data-theme="dark">` is set synchronously before first paint.
- Given localStorage `tickettrade.theme=light`, when the page loads, then first paint uses light tokens and no FOUC occurs.
- Given a user clicks Light in the toggle, when the click is processed, then tokens flip to light, `aria-pressed="true"` is on Light, localStorage=`light`, and `tickettrade:theme-change` fires with `detail.theme="light"`.
- Given a user clicks System, when the click is processed, then localStorage is cleared and tokens flip to `prefers-color-scheme`.
- Given the bootstrap snippet is moved to module-import time (not inline), when the page loads with persisted `light`, then a FOUC occurs and the verify script fails the BOOTSTRAP_FOUC row.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/verify/1-2-implement-light-dark-theme-with-localstorage-persistence.sh` -- expected: exit 0; `OK: 1-2 light/dark theme green`; evidence written
- `composer test:tokens` -- expected: exit 0 (1.1 contract is unaffected)
