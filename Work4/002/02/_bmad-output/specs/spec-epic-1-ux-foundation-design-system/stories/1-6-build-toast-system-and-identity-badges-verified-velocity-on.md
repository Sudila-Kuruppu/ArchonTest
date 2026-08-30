---
title: 'Story 1.6: Build Toast System and Identity Badges (Verified, Velocity, On-Break, Avatar Picker)'
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
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/banned-patterns-microcopy.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every async action in every later epic needs a non-blocking feedback surface (toast) and a small set of identity signals (verified, velocity-flag, on-break, avatar picker) so users see trustworthy identity context. Without the toast surface, async state lives in inconsistent inline copy; without identity badges, the trust signals in DESIGN.md never reach a screen.

**Approach:** Append a 'Toast' section + 'Identity Badges' section to `public/assets/css/tickettrade.css`. Add `public/assets/js/toast.js` (ES module exporting `success|error|warning|info($message, { title?, actions? })` with max-3 queue, 4s auto-dismiss for success/info, manual dismiss required for error/warning, pause on hover/focus, bottom-right on desktop, top on mobile). Add `public/assets/js/identity.js` (ES module with `VerifiedBadge`, `VelocityFlagBadge`, `OnBreakBadge` web components; an `<avatar-picker>` Web Component with file-picker + 4 built-in presets). Ship `public/toast-test.html` with 12 assertions.

## Boundaries & Constraints

**Always.** Toasts: `role="status"` (polite) for success/info, `role="alert"` (assertive) for error/warning; manual dismiss button required on error/warning; max 3 queued; 4s auto-dismiss (success/info only) pauses on hover/focus; bottom-right on ≥768px, top on <768px; reduced-motion disables slide animation (toast still appears, no transform). Identity badges: read-only full pills at caption typography; verified-student badge shows full label `Verified Student` for screen readers (not just the badge icon); velocity-flag badge links to the static page on the user's own profile; on-break pill appears only on listings/profiles when status=break. Avatar picker: file input with `accept="image/png,image/jpeg,image/webp"`; 4 built-in presets (greenery, sunset, ocean, monochrome) as inline SVG. Toast copy follows voice rules from `banned-patterns-microcopy.md`: short complete sentences with period; no exclamation in functional copy; tier names pair with codes on first reference.

**Ask First.** Adding a new identity badge (e.g. `mentor`): HALT and ask. Changing the toast queue depth (currently 3): HALT and ask.

**Never.** No emoji in toast copy. No exclamation in functional copy (landing hero excepted). No raw hex outside the 1.1 allowlist. No infinite-scroll patterns. No badge counts on bottom nav (locked anti-pattern).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| TOAST_SUCCESS | `toast.success("Ticket created.")` | success toast appears bottom-right (≥768px) or top (<768px); `role="status"`; auto-dismiss after 4s; pauses on hover/focus | N/A |
| TOAST_ERROR | `toast.error("Couldn't create ticket.")` | error toast appears; `role="alert"`; manual dismiss required; stays until clicked | N/A |
| TOAST_QUEUE | 4 toasts fired in 500ms | first 3 appear immediately, 4th waits in queue (depth 3) | N/A |
| TOAST_REDUCED_MOTION | `prefers-reduced-motion: reduce` + new toast | toast appears without slide animation (no transform) | N/A |
| VERIFIED_BADGE | `<verified-badge user="..."></verified-badge>` | green checkmark pill with full label `Verified Student` for screen readers; `aria-label="Verified Student"`; not interactive | N/A |
| VELOCITY_BADGE | `<velocity-flag-badge user="..."></velocity-flag-badge>` | orange flag pill; `<a href="/profile/{user}/velocity">` wraps the badge; `aria-label="Velocity flag: see explanation"` | N/A |
| ON_BREAK_BADGE | `<on-break-badge></on-break-badge>` | blue pill with `On break`; appears only when status=break | N/A |
| AVATAR_PICKER_FILE | file selected from picker | previews the image; size limit 2 MB; type validation (PNG/JPEG/WebP); emits `avatar:change` event with File | invalid type/size → `console.warn` + revert |
| AVATAR_PICKER_PRESET | click a preset | swaps the preview to the preset's inline SVG; emits `avatar:change` with the preset id | N/A |
| TOAST_ANNOUNCE | success toast appears | screen reader announces via `aria-live="polite"` region | N/A |
| TOAST_ACTION | toast with `{ actions: [{ label, onClick }] }` | action button appears; clicking invokes `onClick` and dismisses | N/A |
| IDENTITY_SELF_TEST | hidden `[data-identity-self-test]` fixture | resolves to non-empty values via `getComputedStyle` | unresolved halts verify script |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Toast surface + identity badge patterns.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- toast container, verified-student, velocity-flag-fill/text, on-break pill, avatar-picker tokens.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md` -- companion distillation.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/banned-patterns-microcopy.md` -- voice rules that toast copy must follow.
- `public/assets/css/tickettrade.css` -- existing. Append 'Toast' + 'Identity Badges' sections. Use `--shadow-1` from 1.3 for the toast container.
- `public/assets/js/toast.js` (new) -- ES module. Exports `success|error|warning|info($message, options)`. Owns the `.toast-container` element.
- `public/assets/js/identity.js` (new) -- ES module. Defines `<verified-badge>`, `<velocity-flag-badge>`, `<on-break-badge>` Web Components + `<avatar-picker>`.
- `public/assets/js/a11y.js` -- existing from 1.3. `announce` is reused for the toast live region.
- `public/toast-test.html` (new) -- 12 assertions.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- append 'Toast' and 'Identity Badges' sections. Recipes using ONLY existing tokens: `.toast-container` (fixed, `aria-live="polite"`, `aria-atomic="false"`), `.toast` + `.toast-{success|error|warning|info}` (uses semantic tokens), `.toast-dismiss`, `.verified-badge`, `.velocity-flag-badge`, `.on-break-badge`, `.avatar-picker` + `.avatar-picker-preview` + `.avatar-picker-preset`. Reduced-motion guard (no transform).
- [ ] `public/assets/js/toast.js` -- ES module. `success|error|warning|info($message, options)`. Queue depth 3 (FIFO). 4s auto-dismiss for success/info, manual for error/warning. Pause on hover/focus. Bottom-right on ≥768px, top on <768px. Imports `announce` from `./a11y.js`.
- [ ] `public/assets/js/identity.js` -- ES module. Web Components: `<verified-badge>` (full label `Verified Student` for AT), `<velocity-flag-badge>` (wraps in `<a href="/profile/{user}/velocity">`), `<on-break-badge>` (renders only when `status=break`), `<avatar-picker>` (file input + 4 built-in SVG presets + emits `avatar:change`).
- [ ] `public/toast-test.html` -- 12 assertions for I/O Matrix.
- [ ] `scripts/verify/1-6-build-toast-system-and-identity-badges-verified-velocity-on.sh` -- atomic per-slice verify.

**Acceptance Criteria:**
- Given `toast.success("Ticket created.")`, when the call runs, then a success toast appears with `role="status"`, auto-dismisses after 4s, pauses on hover/focus, and the screen reader announces the message.
- Given `toast.error("Couldn't create ticket.")`, when the call runs, then an error toast appears with `role="alert"`, requires a manual dismiss, and the screen reader announces the message immediately.
- Given 4 toasts fire in 500ms, when the calls run, then only 3 are visible; the 4th waits in the queue (FIFO).
- Given a developer renders `<verified-badge>`, when the page renders, then the green pill appears with `aria-label="Verified Student"` for screen readers and is not interactive.
- Given a developer renders `<velocity-flag-badge user="42">`, when the page renders, then the orange flag pill is wrapped in `<a href="/profile/42/velocity">` and the `aria-label` is `Velocity flag: see explanation`.
- Given a developer renders `<avatar-picker>` and selects a PNG file ≤2 MB, when the file is loaded, then the preview shows the file and `avatar:change` fires with the File object.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/verify/1-6-build-toast-system-and-identity-badges-verified-velocity-on.sh` -- expected: exit 0
- `composer test:tokens` -- expected: exit 0
- `composer test:toast` -- expected: exit 0 (placeholder echo)
