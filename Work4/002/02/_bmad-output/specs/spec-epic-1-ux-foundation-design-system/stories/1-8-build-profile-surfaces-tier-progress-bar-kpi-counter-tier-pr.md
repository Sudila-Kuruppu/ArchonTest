---
title: 'Story 1.8: Build Profile Surfaces (Tier Progress Bar, KPI Counter, Tier Privilege Tooltip, Star Rating Input)'
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

**Problem:** Every profile surface in epic 2 (own profile + public profile) and epic 5 (review breakdown) renders a tier progress bar (how close the user is to the next tier), a KPI counter (transactions, reviews, dispute count), a tier-privilege tooltip (what the current tier unlocks), and a star-rating input (1-5 stars with optional text). No token-driven recipe exists; without these, every profile page invents its own progress meter and the star rating UX drifts.

**Approach:** Append a 'Profile Surfaces' section to `public/assets/css/tickettrade.css`. Add `public/assets/js/star-rating.js` (ES module with Web Component `<star-rating-input>` and `<star-rating-display>`). Add a TierPrivilegeTooltip Web Component in `public/assets/js/identity.js` (1.6). Ship `public/profile-test.html` with 12 I/O-Matrix assertions.

## Boundaries & Constraints

**Always.** Tier progress bar: shows the user's current tier fill + a track for the next tier; the fill width = `(points - tier_min) / (next_tier_min - tier_min)`; `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` (numeric — points are fine here, the rank badge never shows them). Tier S is full; the tooltip reads `Legend (S): Top tier. No further progress.` KPI counter: `display-md` numeric value + caption label; tile is a `<div class="kpi-counter">` with `role="group"` and `aria-label="<label>: <value>"`; no animation on value change. Tier privilege tooltip: focusable `<button>` with `aria-describedby`; hover/focus opens the popover; ESC closes; returns focus to trigger on close; popover is NOT a modal (no overlay); reduced-motion disables transform. Star rating input: keyboard-accessible via Arrow keys (←/→ move focus between stars, 1-5 number keys set the rating); radio-group semantics (`role="radiogroup"`); `aria-label` "Rate this transaction"; emits `rating:change` event with the numeric value (1-5) or 0 for cleared.

**Ask First.** Adding a new tier rank color or rank tier (e.g. beyond S): HALT and ask. Adding a half-star or 0.5 increments: HALT and ask (locked to whole numbers per FR-RAT-001).

**Never.** No raw hex outside the 1.1 allowlist. No emoji on any rating star. No tier code shown on the progress bar (codes appear only in the rank badge companion text and the privilege tooltip).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| TIER_PROGRESS_BAR | user at 175 points (Operative) | bar fill width = (175-150)/(400-150) = 10%; `aria-valuenow="175"` `aria-valuemin="150"` `aria-valuemax="400"` | N/A |
| TIER_PROGRESS_MAX | user at Legend (≥1500) | bar fill = 100%; `aria-valuemax="1500"`; tooltip reads `Legend (S): Top tier. No further progress.` | N/A |
| TIER_PROGRESS_ZERO | user at Recruit (0 points) | bar fill = 0%; `aria-valuenow="0"` `aria-valuemin="0"` `aria-valuemax="50"` | N/A |
| KPI_COUNTER | `<div class="kpi-counter" data-label="Transactions">12</div>` | `role="group"`; `aria-label="Transactions: 12"`; no animation on value change | N/A |
| TIER_PRIVILEGE_TOOLTIP | hover or focus on `<button>` | popover opens with the tier's privilege list; `aria-describedby` linking the button to the popover | ESC closes + returns focus to trigger |
| TIER_PRIVILEGE_REDUCED_MOTION | `prefers-reduced-motion: reduce` | popover appears without transform (no slide/fade) | N/A |
| STAR_RATING_INPUT | `<star-rating-input></star-rating-input>` | 5 star buttons in a `role="radiogroup"`; default empty; `aria-label` "Rate this transaction" | N/A |
| STAR_RATING_KEYBOARD | focus on star 1, press ArrowRight | focus moves to star 2; pressing 1-5 sets the rating; pressing 0 or Backspace clears | N/A |
| STAR_RATING_DISPLAY | `<star-rating-display value="3.5" max="5">` | renders 3.5 filled stars + 1.5 empty (using CSS `width: 70%` overlay on the 4th star) | N/A |
| STAR_RATING_CHANGE | user selects 4 stars | `rating:change` event fires with `detail.value = 4`; visual updates to 4 filled stars | N/A |
| TIER_PROGRESS_KEYBOARD | focus on the progress bar | no Tab trap; screen reader announces `aria-valuenow` of current tier points | N/A |
| PROFILE_SELF_TEST | hidden `[data-profile-self-test]` fixture | every token used resolves to a non-empty value | unresolved halts verify |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the rank ladder and tier thresholds.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- tier progress bar, kpi-counter, tier-privilege-tooltip, star-rating-input tokens. The rank ladder thresholds: E 0-49, D 50-149, C 150-399, B 400-799, A 800-1499, S 1500+.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md` -- companion distillation; the tier thresholds live in `config/ranks.php` (Epic 6 owns it; 1.8 reads the constants via the DOM data attribute for now).
- `public/assets/css/tickettrade.css` -- existing. Append 'Profile Surfaces' section. Recipes: `.tier-progress` + `.tier-progress-fill` + `.tier-progress-track`, `.kpi-counter` + `.kpi-counter-value` + `.kpi-counter-label`, `.tier-privilege-trigger` + `.tier-privilege-popover`, `.star-rating-input` + `.star-rating-input-star` + `.star-rating-display`.
- `public/assets/js/star-rating.js` (new) -- ES module. Web Components `<star-rating-input>` (interactive) + `<star-rating-display>` (read-only). Emits `rating:change`.
- `public/assets/js/identity.js` -- existing from 1.6. Add `TierPrivilegeTooltip` Web Component here.
- `public/assets/js/a11y.js` -- existing from 1.3. `announce` reused for star rating changes.
- `public/profile-test.html` (new) -- 12 assertions.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- append 'Profile Surfaces' section. Recipes using ONLY existing tokens. Tier progress fill uses the tier's color token; KPI counter uses `display-md` typography; star rating uses `secondary` fill for selected stars and `surface-container-high` for unselected.
- [ ] `public/assets/js/star-rating.js` -- ES module. Web Components `<star-rating-input>` (interactive, keyboard, emits `rating:change`) + `<star-rating-display>` (read-only, supports fractional via overlay).
- [ ] `public/assets/js/identity.js` -- extend with `TierPrivilegeTooltip` Web Component. `<button>` trigger + popover. Keyboard accessible. Reduced-motion guard.
- [ ] `public/profile-test.html` -- 12 assertions.
- [ ] `scripts/verify/1-8-build-profile-surfaces-tier-progress-bar-kpi-counter-tier-pr.sh` -- atomic per-slice verify.

**Acceptance Criteria:**
- Given a developer renders `<div class="tier-progress" data-points="175">`, when the page renders, then the bar fill width is 10%, `aria-valuenow="175"`, `aria-valuemin="150"`, `aria-valuemax="400"`, and the color matches the Operative tier token.
- Given a user is at Legend (≥1500), when the page renders, then the bar fill is 100% and the tooltip reads `Legend (S): Top tier. No further progress.`
- Given a developer renders `<div class="kpi-counter" data-label="Transactions">12</div>`, when the page renders, then `role="group"` is set and `aria-label="Transactions: 12"`.
- Given a developer renders `<button class="tier-privilege-trigger" data-tier="c">`, when the button receives focus or hover, then the popover opens with the Operative tier's privilege list; ESC closes and returns focus to the trigger; no transform under reduced motion.
- Given a developer renders `<star-rating-input></star-rating-input>`, when the user focuses star 1 and presses ArrowRight, then focus moves to star 2; pressing 3 sets the rating to 3 filled stars and emits `rating:change` with `detail.value = 3`.
- Given a developer renders `<star-rating-display value="3.5" max="5">`, when the page renders, then 3.5 filled stars + 1.5 empty are shown (the 4th star is 70% filled via CSS overlay).

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/verify/1-8-build-profile-surfaces-tier-progress-bar-kpi-counter-tier-pr.sh` -- expected: exit 0
- `composer test:profile` -- expected: exit 0 (placeholder echo)
