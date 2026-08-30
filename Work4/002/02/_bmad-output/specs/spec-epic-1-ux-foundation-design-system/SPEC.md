---
title: 'Epic 1 — UX Foundation & Design System'
id: SPEC-epic-1-ux-foundation-design-system
type: 'feature'
created: '2026-08-30'
status: 'in-progress'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 1
companions:
  - token-reference.md
  - accessibility-floor.md
  - banned-patterns-microcopy.md
  - empty-error-state-library.md
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/EXPERIENCE.md'
---

<!-- Master Epic 1 spec. Decomposes into 13 story sub-specs under stories/.
     The 7 capabilities below are the load-bearing contract. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem.** A campus-only marketplace stands or falls on whether the visual identity, accessibility floor, and copy feel coherent from the first screen a student opens. Without Epic 1, every later epic (Auth, Listings, Tickets, Reviews, Points, Reports, Admin, Operational Substrate) invents its own tokens, theme behavior, component styles, and copy — and visual drift ships with the first feature PR.

**Approach.** Ship the tokenized design system, the light/dark theme, the brand-aligned component library, the corkboard board view, the accessibility floor (WCAG 2.1 AA), the three promoted mockup-driven reference screens, the banned-interaction linter, and the empty/error-state library before any feature surface lands. Epic 1 produces only the static assets, tokens, components, mockups, linters, and copy catalog; functional screens land in epics 2-8.

## Story Decomposition

Epic 1 decomposes into 13 story sub-specs under `stories/`. Each sub-spec is the per-slice implementation contract; the master spec captures the epic-wide intent and the 7-capability distillation below.

| # | Capability | Sub-spec |
|---|-----------|----------|
| 1-1 | CAP-1 tokens | stories/1-1-implement-design-token-system.md |
| 1-2 | CAP-1 theme | stories/1-2-implement-light-dark-theme-with-localstorage-persistence.md |
| 1-3 | CAP-2 core components | stories/1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md |
| 1-4 | CAP-2 brand components | stories/1-4-build-brand-specific-components-rank-badge-ticket-code-block.md |
| 1-5 | CAP-3 + CAP-7 board | stories/1-5-build-corkboard-board-presentation-with-list-view-toggle.md |
| 1-6 | CAP-2 toast + identity | stories/1-6-build-toast-system-and-identity-badges-verified-velocity-on.md |
| 1-7 | CAP-2 data-surface rows | stories/1-7-build-tab-search-bulk-action-analytics-report-and-audit-log.md |
| 1-8 | CAP-2 profile surfaces | stories/1-8-build-profile-surfaces-tier-progress-bar-kpi-counter-tier-pr.md |
| 1-9 | CAP-2 form modals + re-auth | stories/1-9-build-form-modals-dispute-report-purchase-confirmation-and-a.md |
| 1-10 | CAP-4 accessibility floor | stories/1-10-enforce-the-accessibility-floor-wcag-2-1-aa-keyboard-screen.md |
| 1-11 | CAP-5 promoted mockups | stories/1-11-ship-the-three-promoted-mockup-driven-reference-screens.md |
| 1-12 | CAP-6 banned + microcopy | stories/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-micro.md |
| 1-13 | CAP-7 empty/error library | stories/1-13-build-empty-state-and-error-state-library-for-every-surface.md |

Per-slice verify (`scripts/verify/1-N-*.sh`) is wired by each story. Epic roll-up at `scripts/verify/epic-1.sh` chains them in story-id order. The full Epic 1 demo-day command is `bash scripts/verify/all.sh` once all 13 are green.

## Capabilities

- **CAP-1 — Design tokens + light/dark theme persistence.** Single CSS custom-property source of truth; `data-theme` persists to `localStorage` as `tickettrade.theme` with role-default fallback (dark for students, light for admin); `prefers-color-scheme` seeds the first visit; no FOUC. Token reference: `token-reference.md`.
- **CAP-2 — Brand-aligned component library.** Every screen composes from documented primitives: core (buttons, inputs, modals, bottom nav), brand (rank badge, ticket-code block, status badge, listing card, leaderboard row), data-surface (tab, search, bulk-action, analytics, report, audit-log row), profile (tier progress, KPI counter, tier tooltip, star rating), form-modal (dispute, report, purchase confirmation, re-auth), toast, and identity badges (verified, velocity, on-break, avatar picker). Each component has documented anatomy, ARIA roles, `autocomplete`, focus-trap, and live-region semantics. Token reference: `token-reference.md`.
- **CAP-3 — Corkboard board view with list-view fallback.** Cork texture + paper card surfaces with deterministic ±2° rotation seeded by listing id + pushpin graphics render on ≥768px (decorative, `aria-hidden`); header toggle flips to a plain grid via `aria-pressed`; <768px and `prefers-reduced-motion` auto-degrade with identical listing order; cork texture asset ≤100 KB; motion is transform/opacity-only.
- **CAP-4 — Accessibility floor (WCAG 2.1 AA, screen reader, keyboard, reflow, reduced motion, tap targets).** Every color pair passes the Contrast Ledger (text ≥4.5:1, UI elements ≥3:1, large text ≥3:1); keyboard reach + visible focus outlines; modals trap and return focus; live regions on async feedback; 320 px reflow; reduced-motion disables hover-lift, rank-S glow, modal slide-up, toast slide-in, save spinner, auto-save pulse; tap targets ≥44 pt iOS / 48 dp Android; redemption code input is `autocomplete="off"`; numeric inputs use `inputmode`. Floor: `accessibility-floor.md`.
- **CAP-5 — Three promoted mockup-driven reference screens.** `mockups/board-mobile.html`, `mockups/my-tickets.html`, `mockups/admin-dashboard.html` ship as the canonical visual references; their information architecture is consistent with `EXPERIENCE.md`'s route table and state patterns; design wins on conflict.
- **CAP-6 — Banned-interaction patterns + voice/tone microcopy + automated guard.** `composer test:banned` greps for emoji in functional copy, streak counters, daily-login displays, badge counts on bottom nav, push-notification strings, infinite-scroll markers, nested modal markers, algorithmic-reputation-score markers, encouragement filler, numeric points totals on rank badges, and streak/combo language; tier names pair with codes on first reference; dispute counts use `N disputes on record`; purchase confirmations always include `a reservation, not payment`. Linter targets + voice rules: `banned-patterns-microcopy.md`.
- **CAP-7 — Empty-state + error-state library for every surface Epic 1 owns or its tokens reach.** Documented copy catalogued in `empty-error-state-library.md` ships with a CTA / Clear filter / Clear search / retry action; never uses emoji or encouragement filler.

## Constraints

- **Tokenized CSS is the single source of truth.** No raw hex, font-size, or spacing value may appear outside `public/assets/css/tickettrade.css` or `DESIGN.md`; adding a new visual value requires a named token first.
- **Theme bootstrap is auth-free and time-free.** The localStorage read and `data-theme` flip happen before the framework boots; `Support\Auth::current_user()` and `Support\Time::now()` are not called on theme bootstrap.
- **Design wins on conflict.** `DESIGN.md` and `EXPERIENCE.md` are authoritative over any mockup, wireframe, or `imports/*` reference; promotion order is spine → mockup → imports.
- **Inter is loaded via Google Fonts** preconnect + css2 link in `<head>` (not self-hosted); until wired, `--font-display-lg` / `--font-headline-md` / `--font-title-sm` fall back to `system-ui`.
- **Reduced-motion is non-negotiable.** Hover-lift, rank-S glow, modal slide-up, toast slide-in, save spinner, auto-save pulse are disabled under `prefers-reduced-motion: reduce`.
- **Redemption code input is `autocomplete="off"`** for security; all other inputs declare `autocomplete` per the documented mapping; numeric inputs use `inputmode`.
- **One modal level maximum.** Purchase confirmation is the deepest stack, opening on top of the listing modal (which stays mounted but inert); no nested modals beyond this.
- **Audit-log row is a display primitive only.** The hash-chain integrity check lands with the `Support\Audit` writer in Epic 8.
- **`composer test:banned` is the source-of-truth guard.** Its rule list is the implementation contract for CAP-6.
- **Ticket-code block is the only monospace amber-on-near-black surface** in the product — used for ticket codes, redemption input, and `points_log.event_uuid`.

## Non-Goals

- Full feature screens (login, listing form, ticket redemption, admin user-list, reports queue, leaderboard render) are NOT shipped in Epic 1.
- The `Custom\Sniffs\NoRawHash` phpcs sniff lands in Epic 9; Epic 1 follows the rule manually.
- The cron schedule for any sweep lands in Epic 9.
- Back-end writers (Points Service, Points Log Model, Audit primitive, ImageUpload, ImageProxy) are NOT shipped in Epic 1.
- Production asset bundling: Bootstrap 5 is CDN in dev and only bundled for production; Epic 1 does not ship a build pipeline.

## Success Signal

A new developer can clone the repo, import `public/assets/css/tickettrade.css`, and ship any later epic's screens using only the documented tokens, components, and three reference mockups — with every interaction meeting WCAG 2.1 AA, no banned pattern surviving `composer test:banned`, and the corkboard board view degrading cleanly on small screens and for reduced-motion users.

## Cross-Epic Convention (so future epics follow the same shape)

- Master epic spec at `_bmad-output/specs/spec-{{epic-n}}-{{slug}}/SPEC.md`.
- Companion distillation files alongside the master spec.
- Per-story sub-specs at `_bmad-output/specs/spec-{{epic-n}}-{{slug}}/stories/{{story-key}}-{{slug}}.md`.
- Per-slice verify at `scripts/verify/{{story-key}}-{{slug}}.sh`; epic roll-up at `scripts/verify/epic-{{n}}.sh`; full sweep at `scripts/verify/all.sh`.
- Sprint-status updates flow through `_bmad-output/implementation-artifacts/sprint-status.yaml`.

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- refreshed Epic 1 context (Goal, Stories, Requirements, Technical Decisions, UX Patterns, Cross-Story Dependencies). Each per-slice sub-spec carries its own Context anchor.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` and `EXPERIENCE.md` -- read-only spines, authoritative on visual and interaction decisions.
- `DESIGN.md` (project root) -- promoted spine copy; source of truth for every token declared in CSS.
- `public/assets/css/tickettrade.css` -- 1.1 token file + 1.2 theme + 1.3+ components appended in capability order. Single production stylesheet.
- `scripts/check_no_raw_hex.sh` -- 1.1 guard. `composer test:tokens` runs it.
- `scripts/verify/1-1-implement-design-token-system.sh` -- 1.1 atomic verify.
- `scripts/verify/epic-1.sh` -- epic roll-up. Each new story appends a row.
- `scripts/verify/all.sh` -- demo-day sweep. Walks all `epic-*.sh` roll-ups.
- `config/bootstrap.php` -- `Support\` PHP autoload is owned by Epic 2; Epic 1 ships browser-side ES2020 modules under `public/assets/js/`.
- `composer.json` -- `scripts` block grows per story (`test:tokens` exists; `test:components`, `test:a11y`, `test:banned` land in their owning stories).
- `archive/implementation-artifacts/spec-1-1...1-4-*.md` -- prior session's shipped specs. Reference for reviewer findings and golden patterns; NOT authoritative for current intent.

## Tasks & Acceptance

**Execution:**
- [ ] `stories/1-1-implement-design-token-system.md` -- rewritten as draft (the prior spec was a "mistake" — see Spec Change Log).
- [ ] `stories/1-2-implement-light-dark-theme-with-localstorage-persistence.md` -- new draft.
- [ ] `stories/1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md` -- new draft.
- [ ] `stories/1-4-build-brand-specific-components-rank-badge-ticket-code-block.md` -- new draft.
- [ ] `stories/1-5-build-corkboard-board-presentation-with-list-view-toggle.md` -- new draft (CAP-3 + CAP-7 board empty/error).
- [ ] `stories/1-6-build-toast-system-and-identity-badges-verified-velocity-on.md` -- new draft.
- [ ] `stories/1-7-build-tab-search-bulk-action-analytics-report-and-audit-log.md` -- new draft.
- [ ] `stories/1-8-build-profile-surfaces-tier-progress-bar-kpi-counter-tier-pr.md` -- new draft.
- [ ] `stories/1-9-build-form-modals-dispute-report-purchase-confirmation-and-a.md` -- new draft.
- [ ] `stories/1-10-enforce-the-accessibility-floor-wcag-2-1-aa-keyboard-screen.md` -- new draft.
- [ ] `stories/1-11-ship-the-three-promoted-mockup-driven-reference-screens.md` -- new draft.
- [ ] `stories/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-micro.md` -- new draft.
- [ ] `stories/1-13-build-empty-state-and-error-state-library-for-every-surface.md` -- new draft.
- [ ] `scripts/verify/epic-1.sh` -- append each new `scripts/verify/1-N-*.sh` to the loop.

**Acceptance Criteria:**
- The 13 story sub-specs each have a `status: draft` frontmatter, a frozen-after-approval block, an I/O & Edge-Case Matrix, Tasks & Acceptance (with Given/When/Then ACs), a Verification block, and a Spec Change Log entry on first review.
- `bash scripts/verify/epic-1.sh` exits 0 when every 1-1..1-13 per-slice verify is green.
- `composer test:tokens` exits 0; `OK: no raw hex outside token files`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` reflects each story's status as the per-slice work lands.

## Spec Change Log

- **2026-08-30 (planning, this rewrite)** -- the prior `_bmad-output/implementation-artifacts/spec-1-1-implement-design-token-system.md` was authored before the 7-capability distillation in this master spec existed and reads as a separate intent. It is superseded by `stories/1-1-implement-design-token-system.md`. KEEP the existing `public/assets/css/tickettrade.css`, `scripts/check_no_raw_hex.sh`, and `scripts/verify/1-1-implement-design-token-system.sh` -- they implement the 1.1 contract and are the audit target for the rewritten spec.

- **2026-08-30 (implementation, step-03, story 1-1)** -- ran `bash scripts/verify/1-1-implement-design-token-system.sh` against the existing implementation on disk. All 7 audit rows pass; verdict PASS. The existing CSS / guard / verify script already implement the 1.1 contract from the rewritten spec; no code changes required. Story 1-1 status: `in-review`. Evidence: `verification_evidence/1-1-implement-design-token-system/20260830T042611Z/`.

- **2026-08-30 (review r1, story 1-1)** -- 3 reviewer subagents ran in parallel (blind-hunter 50 findings, edge-case-hunter 34 findings, verification-gap 3 findings). Story 1-1 directly-actionable subset was 7 items (1 bad_spec on the `:root` default theme language, 3 patches on the verify script [URL_FRAGMENT_OK step, :root assertion, header comment overstating runtime consumption], 2 bad_spec copy fixes [spacing/component counts, Code Map claim]). Story 1-1 review_loop_iteration: 0 → 1. Remaining 80+ findings are deferred to stories 1-2..1-13 or routed to the master for the cross-epic convention; they will be addressed when those specs go through their own step-02/03/04 cycles. Story 1-1 status: `in-review` (verify green after r1 patches; ready for step-05).

## Verification

**Commands:**
- `bash scripts/verify/all.sh` -- expected: exits 0 when every Epic 1 per-slice verify is green.
- `bash scripts/verify/epic-1.sh` -- expected: exits 0 when every 1-1..1-13 per-slice verify is green.
- `composer test:tokens` -- expected: exits 0; `OK: no raw hex outside token files`.

**Manual checks (if no CLI):**
- Open `DESIGN.md` and confirm the frontmatter has `colors`, `typography`, `rounded`, `spacing`, and `components` blocks.
- Open `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/` and confirm 13 draft story specs are present.
