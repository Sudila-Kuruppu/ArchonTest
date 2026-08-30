# Accessibility Floor

Companion to SPEC-epic-1-ux-foundation-design-system, supporting **CAP-4**. The authoritative source is the Accessibility Floor section of `EXPERIENCE.md` (`_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/EXPERIENCE.md`) and the Contrast Ledger in `DESIGN.md`. This companion distills the verifiable rules an implementer can audit against.

## WCAG 2.1 AA contrast

- **Text:** ≥4.5:1 (body text).
- **Large text:** ≥3:1 (18 px regular or 14 px bold).
- **UI elements and graphical objects:** ≥3:1.
- **Audit source:** `DESIGN.md` Contrast Ledger lists all load-bearing combinations (primary/semantic/status/code/surface in light and dark). Any new color must clear the bar before landing.
- **Known deliberate trade-off:** `rank-d` and `rank-e` use dark text on the blue/gray fill in dark mode (the white-on-blue/gray pairs fail AA). The `rank-badge-d` and `rank-badge-e` component recipes configure dark text accordingly.
- **Known deliberate trade-off:** `border-hairline-dark` against `surface-base-dark` is 1.16:1; use `outline-variant-dark` for borders that need AA; hairline is permitted only for non-load-bearing dividers.

## Keyboard

- Every interactive element is reachable by Tab in DOM order.
- Focus-visible outlines: primary 2 px outline with 2 px offset on all interactive elements.
- Skip link is the first focusable element on every page and jumps to `#main`.
- ESC closes any open modal.
- Focus is trapped inside open modals; focus returns to the trigger on close.
- Arrow keys cycle filter tabs and star rating inputs; arrow keys navigate the listing modal (←/→ prev/next category).

## Screen reader

- Toasts: `role="status"` (polite) for success/info, `role="alert"` (assertive) for error/warning; ARIA live region announces the toast.
- Form errors: announced via live region; inline error text adjacent to the field.
- Modals: `aria-modal="true"`, `role="dialog"`, `aria-labelledby` on title, `aria-describedby` on body when a description exists.
- Decorative elements: cork texture, pin graphic, rotation transforms, inline icons are `aria-hidden` / `aria-hidden="true"`.
- Status badges carry `aria-label` with the human-readable state plus a timestamp tooltip on hover/focus.
- Verified-student badge always shows the full label `Verified Student` (not the badge alone) for screen readers.
- Rank badges show tier name only — never a numeric points total.
- `prefers-reduced-motion` users get no animation announcements; state transitions still occur but without transform.

## Forms

- `autocomplete` attribute is set per the documented mapping: `email`, `current-password`, `new-password`, `one-time-code`, `name`, `given-name`, `family-name`, `tel`, `url`. Any new form input picks one of these or justifies a new value in the spec.
- **Redemption code input is `autocomplete="off"`** for security (prevents browser autofill of codes).
- Numeric inputs use `inputmode` (`numeric` or `decimal`).

## Reflow

- Layout reflows to 320 px without horizontal scroll.
- The only exception: data tables, which scroll inside their container with a sticky first column.

## Reduced motion (`prefers-reduced-motion: reduce`)

The following animations are **disabled** under reduced motion:
- Corkboard hover-lift on listing cards.
- Rank-S `legend-glow` pulse.
- Modal slide-up.
- Toast slide-in.
- Save spinner pulse.
- Auto-save pulse.

State transitions (e.g., disabled → enabled) still occur but with no transform — only opacity / instant change.

## Tap targets

- All interactive elements: ≥44 pt iOS / 48 dp Android.
- Bottom nav items: 64 px tall.
- Star rating input: 48 dp touch targets.
- Status badges are NOT interactive (no tap target needed).

## Autofocus and tabindex discipline

- No `autofocus` on inputs that load user-sensitive data (avoid screen-reader surprise on the redemption code input).
- `tabindex="0"` only when the natural DOM order is wrong; never add positive tabindex values.
- `inert` on inert portions of the DOM when a modal opens (purchase confirmation sitting on top of the listing modal keeps the listing modal inert).

## Verification at every commit

- axe-core run in CI fails any commit introducing a critical or serious accessibility issue.
- Manual keyboard pass (no mouse) before any PR merges.
- Manual screen reader pass (VoiceOver / NVDA) before any PR merges when toasts, modals, or new form inputs are touched.
- Reduced-motion test toggled on and off before any PR merges when motion-bearing components are touched.

## Adoption by later epics

Every later epic that ships an interactive surface inherits this floor. CAP-4 is the contract; an epic that can't pass an accessibility audit doesn't ship. Story 1.10 enforces the floor against Epic 1's tokens and components; the same audit discipline repeats in epics 2-8 against their feature-specific additions.
