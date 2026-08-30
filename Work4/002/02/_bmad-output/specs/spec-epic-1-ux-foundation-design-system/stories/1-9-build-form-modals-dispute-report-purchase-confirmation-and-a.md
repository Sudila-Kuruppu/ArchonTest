---
title: 'Story 1.9: Build Form Modals (Dispute, Report, Purchase Confirmation) and Admin Re-Auth Dialog'
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

**Problem:** Every later epic (4 tickets, 7 reports, 8 admin) needs three form-modal patterns (dispute, report, purchase confirmation) and the admin re-auth dialog that gates destructive admin actions. The 1.3 modal pattern is the chrome — 1.9 ships the form fields, validation, and copy that distinguish them. Without these, the form stories (epics 4/7/8) each reinvent their own dispute/report/purchase flow.

**Approach:** Append a 'Form Modals' section to `public/assets/css/tickettrade.css`. Add `public/assets/js/form-modal.js` (ES module composing 1.3's `openModal` with form-specific helpers: `openDisputeModal`, `openReportModal`, `openPurchaseConfirmModal`, `openReauthDialog`). Reuses 1.3 modal stack; never opens nested. Ship `public/forms-test.html` with 14 I/O-Matrix assertions covering all four form types and the scrim-click guard override on purchase confirmation.

## Boundaries & Constraints

**Always.** All form modals reuse 1.3's `openModal` API (same focus trap, ESC, X, scrim). Purchase confirmation opts into `scrimGuardMs: 2000` (the 2s suppress-scrim-click window) and uses a single primary `Confirm purchase` button; ESC and X still close but trigger a confirm-step. Dispute + report modals use a 3-field layout (category, evidence textarea, optional notes); inputs declare `autocomplete` per the documented mapping (`name`, `given-name`, etc.). Purchase confirmation body always includes `a reservation, not payment`; never `pay now` or `complete your purchase`. Admin re-auth dialog: single password field (`autocomplete="current-password"`); submit triggers `Support\Auth::reauth($password)` (Epic 8 owns the helper; 1.9 ships the UI only with a stub `Promise`); 300s sliding re-auth window tracked in `sessionStorage.tickettrade.reauthAt` (NOT `localStorage`); 5/min/IP rate-limit (UX-visible error: `Too many attempts. Try again in 1 minute.`). Every form modal closes on successful submit; emits `form:submit` event with the form data; the form data is captured before close.

**Ask First.** Adding a new form-modal type beyond dispute/report/purchase/re-auth: HALT and ask. Changing the re-auth sliding-window from 300s: HALT and ask (AD-19 is the contract).

**Never.** No raw hex outside the 1.1 allowlist. No nested modals (deepest stack is listing modal → purchase confirmation). No emoji in form copy. No exclamation in functional copy. No encouragement filler. No `pay now` or `complete your purchase` in purchase confirmation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DISPUTE_OPEN | `openDisputeModal({ ticketId })` | opens the dispute modal with category dropdown + evidence textarea + optional notes; `aria-labelledby` on title | N/A |
| DISPUTE_SUBMIT | user fills category + evidence + submits | `form:submit` fires with `detail = { kind: 'dispute', ticketId, category, evidence, notes }`; modal closes | N/A |
| DISPUTE_VALIDATION | submit with no evidence | inline error `Evidence is required.` adjacent to the textarea; `aria-invalid="true"` | form does not submit |
| REPORT_OPEN | `openReportModal({ targetType, targetId })` | opens the report modal; category options adapt to targetType (listing/profile/ticket) | N/A |
| REPORT_SUBMIT | user fills + submits | `form:submit` fires; modal closes | N/A |
| PURCHASE_OPEN | `openPurchaseConfirmModal({ listingId, priceCents, totalSessions })` | opens on top of the listing modal (which stays mounted but inert); scrim click suppressed for 2s; body always includes `a reservation, not payment` | N/A |
| PURCHASE_SCRIM_GUARD | within 2s of opening, click scrim | scrim click is ignored | after 2s, scrim click closes |
| PURCHASE_SUBMIT | user clicks `Confirm purchase` | `form:submit` fires; modal closes; listing modal regains focus | N/A |
| REAUTH_OPEN | `openReauthDialog({ action })` | opens the admin re-auth dialog; single password field with `autocomplete="current-password"`; submit button `Confirm` | N/A |
| REAUTH_VALIDATION | submit empty password | inline error `Password is required.` | form does not submit |
| REAUTH_RATE_LIMIT | 6 failed attempts in 60s | dialog disabled for 60s; error `Too many attempts. Try again in 1 minute.` | N/A |
| REAUTH_SUCCESS | submit correct password | `Support.Auth.reauth()` resolves; `form:submit` fires; `sessionStorage.tickettrade.reauthAt = now`; modal closes; admin action proceeds | rejection: inline error `Incorrect password.` |
| REAUTH_NESTED_BLOCKED | `openReauthDialog` while another modal is open | returns `false`; `console.warn`; outer modal stays focused (1.3 enforces) | N/A |
| FORMS_SELF_TEST | hidden `[data-forms-self-test]` fixture | every token used resolves to a non-empty value | unresolved halts verify |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the modal pattern + form modal scope.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- dispute-modal, report-modal, purchase-confirm-modal, re-auth-dialog component tokens.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md` -- companion distillation.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/banned-patterns-microcopy.md` -- voice rules; purchase confirmation always includes `a reservation, not payment`.
- `public/assets/css/tickettrade.css` -- existing. Append 'Form Modals' section. Recipes: `.form-modal-dispute`, `.form-modal-report`, `.form-modal-purchase`, `.form-modal-reauth`, `.form-field` + `.form-field-error`, `.form-actions`.
- `public/assets/js/modal.js` -- existing from 1.3. Imported by `form-modal.js`.
- `public/assets/js/a11y.js` -- existing from 1.3. `announce` reused.
- `public/assets/js/form-modal.js` (new) -- ES module. Exports `openDisputeModal`, `openReportModal`, `openPurchaseConfirmModal`, `openReauthDialog`. Composes 1.3's `openModal`. Stub `Support.Auth.reauth()` returns a `Promise` that resolves if `password === 'test'` (Epic 8 owns the real implementation).
- `public/forms-test.html` (new) -- 14 assertions.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- append 'Form Modals' section. Recipes using ONLY existing tokens. Form fields use the 1.3 `.input-field` + `.input-error` recipes.
- [ ] `public/assets/js/form-modal.js` -- ES module. Composes 1.3 modal + form helpers. `openDisputeModal({ ticketId })`, `openReportModal({ targetType, targetId })`, `openPurchaseConfirmModal({ listingId, priceCents, totalSessions })` (with `scrimGuardMs: 2000`), `openReauthDialog({ action })`. Rate-limit tracker lives in the module (60s window).
- [ ] `public/forms-test.html` -- 14 assertions for I/O Matrix. Tests the rate-limit (issues 6 attempts and asserts the 6th is blocked).
- [ ] `scripts/verify/1-9-build-form-modals-dispute-report-purchase-confirmation-and-a.sh` -- atomic per-slice verify.

**Acceptance Criteria:**
- Given a developer calls `openDisputeModal({ ticketId: 'T-42' })`, when the call runs, then the dispute modal opens with category dropdown + evidence textarea + optional notes; submitting fires `form:submit` with `{ kind: 'dispute', ticketId, category, evidence, notes }`.
- Given a developer calls `openPurchaseConfirmModal({ listingId: 'L-1', priceCents: 5000, totalSessions: 1 })`, when the call runs, then the modal opens on top of the listing modal (which stays mounted but inert), the body always includes `a reservation, not payment`, scrim click is suppressed for 2s, and ESC/X close.
- Given a developer calls `openReauthDialog({ action: 'ban-user' })`, when the user submits the correct password, then `Support.Auth.reauth()` resolves, `form:submit` fires, `sessionStorage.tickettrade.reauthAt` updates, and the modal closes; with an incorrect password, the inline error `Incorrect password.` appears.
- Given a user makes 6 failed re-auth attempts within 60s, when the 6th attempt fires, then the dialog is disabled for 60s and the error `Too many attempts. Try again in 1 minute.` appears.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/verify/1-9-build-form-modals-dispute-report-purchase-confirmation-and-a.sh` -- expected: exit 0
- `composer test:forms` -- expected: exit 0 (placeholder echo)
