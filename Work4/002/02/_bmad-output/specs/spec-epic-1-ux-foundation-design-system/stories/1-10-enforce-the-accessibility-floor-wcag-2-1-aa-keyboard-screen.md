---
title: 'Story 1.10: Enforce the Accessibility Floor (WCAG 2.1 AA, Keyboard, Screen Reader, Reflow, Reduced Motion, Tap Targets)'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-4'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/accessibility-floor.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every Epic 1 surface must meet WCAG 2.1 AA. The contract lives in the Contrast Ledger, the keyboard rules, the screen-reader semantics, the 320px reflow, the reduced-motion rules, and the tap-target sizes. Each surface 1.1-1.9 ships is checked against this floor, but the floor itself is not enforced at CI time — a later story could ship a color pair that fails the Contrast Ledger or a button that's 40px tall.

**Approach:** Add `scripts/check_a11y.sh` that audits every page rendered by the Epic 1 static chrome (token CSS, theme toggle, components-test, theme-test, brand-test, board-test, toast-test, data-test, profile-test, forms-test, board.php) against the 7 audit rows (contrast, keyboard reach, focus-visible, ARIA roles, reflow at 320px, reduced-motion, tap targets). Wire it as `composer test:a11y`. Use `php-cli` + `DOMDocument` + a Python contrast calculator (PyPI `colour-science` or a vendored 10-line sRGB→relative-luminance script).

## Boundaries & Constraints

**Always.** Audit source is `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/accessibility-floor.md` (the companion distillation). The audit runs as part of `scripts/verify/all.sh` and exits 0 only if every page passes every audit row. New color pairs that land in `DESIGN.md` or `tickettrade.css` are validated against the Contrast Ledger (text ≥4.5:1, UI elements ≥3:1, large text ≥3:1). Reflow at 320px is asserted via `getComputedStyle` on the root and key containers. Reduced-motion audit asserts that hover-lift, rank-S glow, modal slide-up, toast slide-in, save spinner, and auto-save pulse have `@media (prefers-reduced-motion: reduce)` guards. Tap targets ≥44px iOS / 48dp Android audited per interactive element. ARIA roles audit asserts that toasts use `role="status"`/`role="alert"`, modals use `role="dialog"` + `aria-modal="true"`, status badges carry `aria-label`, verified badge has the full `Verified Student` label.

**Ask First.** Adding a new audit row (e.g. color-blindness simulation): HALT and ask (the audit surface is locked). Lowering a contrast threshold: HALT and ask (WCAG 2.1 AA is the contract).

**Never.** No raw hex outside the 1.1 allowlist (the audit also fails any new violation). No automated `aria-label` injection (every `aria-label` must be human-written).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| CONTRAST_PASS | every color pair in the Contrast Ledger | audit reports `OK: contrast ratios all >= 4.5:1 (text) / 3:1 (UI / large text)` | N/A |
| CONTRAULT_FAIL | injected `#1B5E20` on `#9E9E9E` (a known-bad pair) | audit reports the failing pair with its ratio; exits non-zero | N/A |
| KEYBOARD_REACH | all interactive elements on the test pages | audit reports every interactive element has `tabindex >= 0` (or default focusable); focus order is DOM order | N/A |
| FOCUS_VISIBLE | every interactive element | `focus-visible` outline computed style is non-empty and ≥2px | N/A |
| ARIA_ROLES | every toast, modal, status badge, verified badge | role attribute matches the expected value | N/A |
| REFLOW_320 | root + key containers at 320px width | `getComputedStyle(documentElement).overflowX === 'hidden'` OR every key container fits; data tables scroll inside their container with sticky first column | N/A |
| REDUCED_MOTION | every motion keyframe (hover-lift, rank-S glow, modal slide-up, toast slide-in, save spinner, auto-save pulse) | guarded by `@media (prefers-reduced-motion: reduce)`; under reduced motion, transform/opacity is the initial value | N/A |
| TAP_TARGETS | every interactive element | `getBoundingClientRect().height >= 44 && .width >= 44` (px); status badges are exempt (they are not interactive) | N/A |
| A11Y_SUMMARY | audit completes | prints `OK: accessibility floor green (7 rows)` with per-row counts; evidence written to `verification_evidence/1-10-.../<ts>/` | any row fail → exit non-zero |
| A11Y_PAGES | audit walks every test page | each page's audit results are appended to the evidence log | N/A |
| NEW_PAGE_AUDIT | a new test page is added | audit walks it too (the page list is generated from `public/*-test.html` + `public/board.php`) | N/A |
| A11Y_BASELINE | audit re-run on a previously-passing tree | exit 0; same per-row counts | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the UX Patterns + Cross-Story Dependencies sections.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- Contrast Ledger (the audit source).
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/accessibility-floor.md` -- companion distillation; the 7 audit rows.
- `scripts/check_a11y.sh` (new) -- the audit script. Walks `public/*-test.html` + `public/board.php`, runs 7 audit rows, exits non-zero on any failure. Uses `python3` for contrast calculation.
- `scripts/verify/1-10-enforce-the-accessibility-floor-wcag-2-1-aa-keyboard-screen.sh` (new) -- per-slice verify; calls `check_a11y.sh`.
- `composer.json` -- add `"test:a11y": "bash scripts/check_a11y.sh"`.
- `public/*-test.html` (the 9 Epic 1 test pages) -- audit targets.
- `public/board.php` -- audit target.

## Tasks & Acceptance

**Execution:**
- [ ] `scripts/check_a11y.sh` (new, executable, `set -euo pipefail`) -- walks every `public/*-test.html` and `public/board.php`. For each, runs the 7 audit rows. Uses `python3` + `DOMDocument` for headless evaluation; uses a vendored sRGB→relative-luminance function for contrast. Exits 0 only if every page passes every row. Captures per-page evidence under `verification_evidence/1-10-.../<ts>/<page>/`.
- [ ] `composer.json` -- add `"test:a11y": "bash scripts/check_a11y.sh"`.
- [ ] `scripts/verify/1-10-enforce-the-accessibility-floor-wcag-2-1-aa-keyboard-screen.sh` (new) -- per-slice verify; sources `_lib.sh`, calls `check_a11y.sh`, asserts exit 0 and prints `OK: 1-10 accessibility floor green`.

**Acceptance Criteria:**
- Given `composer test:a11y` runs, when the audit completes, then every Epic 1 test page + `public/board.php` pass all 7 audit rows; exit 0; `OK: accessibility floor green (7 rows)` printed.
- Given a developer adds a new color pair that fails the Contrast Ledger (e.g. text 4.0:1 on background), when the audit runs, then the failing pair is named with its ratio and the audit exits non-zero.
- Given a developer adds a 40px-tall button, when the audit runs, then the tap-target row fails, names the button, and exits non-zero.
- Given a developer adds a toast without `role="status"` or `role="alert"`, when the audit runs, then the ARIA roles row fails and exits non-zero.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_a11y.sh` -- expected: exit 0; `OK: accessibility floor green (7 rows)`; evidence written
- `composer test:a11y` -- expected: exit 0
- `bash scripts/verify/1-10-enforce-the-accessibility-floor-wcag-2-1-aa-keyboard-screen.sh` -- expected: exit 0
