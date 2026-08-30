---
title: 'Story 1.4: Build Brand-Specific Components (Rank Badge, Ticket-Code Block, Status Badge, Listing Card, Leaderboard Row)'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-2'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/EXPERIENCE.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Stories 1.5, 1.6, 1.7, 1.8, 1.11, and every later epic (3, 4, 5, 6) compose listing cards, rank badges, ticket codes, status badges, and leaderboard rows — but no token-driven recipe exists for any of them. The DESIGN.md `Components` block pins their anatomy, color, sizing, and reduced-motion behavior, but the CSS recipes, JS interactions, and a tested 16-assertion page are not in the codebase. 1.4 also closes the first shadow-token consumer (`--shadow-2` for listing-card hover) that story 1.3 forward-declared.

**Approach:** Append a 'Brand-Specific Components' section to `public/assets/css/tickettrade.css` after the 1.3 Core Components block. Use only existing 1.1 tokens + the 1.3 `--shadow-2` (no new tokens). Add one new ES-module helper `public/assets/js/ticket-code.js` for the reveal/mask + copy-to-clipboard + WhatsApp-share interactions. Ship `public/brand-test.html` modeled on `components-test.html` with 16 I/O-Matrix assertions covering all five components.

## Boundaries & Constraints

**Always.** Every visual value resolves through `var(--token)`; no raw hex outside the 1.1 allowlist. `scripts/check_no_raw_hex.sh` must continue to exit 0. Tier S carries a 2.4s ease-in-out `legend-glow` animation (box-shadow only) disabled under reduced motion. Status badges carry `aria-label` with the human-readable state plus a timestamp tooltip on hover/focus; rank badges show tier name only (never a numeric points total). Ticket-code block: monospace amber text on near-black surface, 1px amber border, `rounded.sm`, `letter-spacing: 0.04em`, always preceded by `TK-`. Reveal/mask toggle is keyboard-accessible and announces state; Copy button shows `Copied` for 1.5s. Listing card: hover elevation (4px translateY + 0 4px 12px shadow at 12% opacity), disabled under reduced motion. Leaderboard row: dense list item at `body-sm` size, `--radius-sm`, no hover elevation; rank badge appears inline as a full pill.

**Ask First.** Adding a new tier rank color outside the six-tier ladder: HALT and ask. Persisting the reveal/mask state across sessions: out of scope (always masked on each page load).

**Never.** No emoji on any badge. No numeric points total on the rank badge (locked anti-pattern). No raw hex outside the allowlist. No new CSS file. No nested modal markers (ticket-code reveal is a toggle, not a modal). No reduced-motion violations on legend-glow or hover-lift.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| RANK_BADGE | `<span class="rank-badge rank-c">Operative (C)</span>` | green pill with white text; `aria-label="Tier C: Operative"`; full pill at caption typography; no numeric points | N/A |
| RANK_BADGE_GLOW | tier S badge in a non-reduced-motion context | 2.4s ease-in-out `legend-glow` box-shadow pulse; `--shadow-1` baseline | reduced-motion media query disables |
| TICKET_CODE_BLOCK | `<code class="ticket-code">TK-AbCdEfGh12345678</code>` | monospace amber `#FFD600` on `#1E1E1E`, 1px amber border, `rounded.sm`, `letter-spacing: 0.04em`; `Copy` button adjacent | N/A |
| TICKET_CODE_REVEAL | click the reveal toggle | text becomes `TK-AbCdEfGh12345678`; `aria-pressed="true"`; live region announces `Code revealed` | N/A |
| TICKET_CODE_COPY | click `Copy` | `navigator.clipboard.writeText(code)`; button shows `Copied` for 1.5s; live region announces `Code copied` | clipboard API unavailable → `console.warn` + `Copy` stays visible |
| TICKET_CODE_SHARE | click WhatsApp share | `<a href="https://wa.me/?text=TK-..." target="_blank" rel="noopener">` opens in new tab | N/A |
| STATUS_BADGE | `<span class="status-badge status-active">Active</span>` | green fill + dark text; `aria-label="Status: Active, 2026-08-30 09:00"`; full pill at caption typography; not interactive | N/A |
| STATUS_BADGE_TIMING | hover or focus on a status badge | tooltip with human-readable timestamp (`<time datetime="...">`); non-modal | N/A |
| LISTING_CARD | `<article class="listing-card">` | paper surface (cork-board decoration is 1.5), `rounded.md`, hover elevation (`--shadow-2`); 3-line title clamp, 2-line description clamp; price badge in `secondary` fill | N/A |
| LISTING_CARD_CORKBOARD | listing card rendered on the corkboard (≥768px) | `transform: rotate(±2deg)` seeded by listing id; pushpin graphic on `::before` | cork pin/rotation `aria-hidden` |
| LISTING_CARD_REDUCED_MOTION | corkboard with `prefers-reduced-motion: reduce` | rotation is 0; pushpin hidden; identical listing order to non-cork | N/A |
| LEADERBOARD_ROW | `<li class="leaderboard-row">` with rank badge + display name + points | `body-sm` size, `--radius-sm`, dense list; rank badge inline; name + points right-aligned | N/A |
| LEADERBOARD_ROW_DENSE | 20 rows rendered | no hover elevation, no separators other than `border-bottom: 1px solid var(--color-border-hairline-dark)` | N/A |
| BRAND_SELF_TEST | `[data-brand-self-test]` fixture with `var(--shadow-2)` | resolves to a non-empty value | unresolved halts the verify script |
| LISTING_CARD_HOVER | hover on a listing card | `translateY(-4px)` + `box-shadow: 0 4px 12px rgba(0,0,0,0.12)` | reduced-motion disables transform |
| TICKET_CODE_MASKED | page load | code masked as `••• ••• ••• ••• •••` until reveal | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the "Locked anti-patterns" section (no bottom-nav badges, no emoji, no infinite scroll) is the contract.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- component token frontmatter (rank-badge-*, ticket-code, status-badge-*, listing-card, listing-card-dark, leaderboard-row) and the `Components` body. Read-only.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/EXPERIENCE.md` -- `Component Patterns` table is the load-bearing behavioral contract.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md` -- companion distillation of palette/typography/spacing/radii/elevation details.
- `public/assets/css/tickettrade.css` -- 1.1 token + 1.2 theme + 1.3 Core Components block. Append a 'Brand-Specific Components' section. New shadow tokens declared in `:root`. All recipes use `var(--...)` only.
- `public/assets/js/ticket-code.js` (new) -- ES module. Exports `initTicketCode(rootEl)` that wires up reveal, copy, share for a `.ticket-code-block` element.
- `public/assets/js/a11y.js` -- existing from 1.3. Imported by `ticket-code.js` for `announce`.
- `public/brand-test.html` (new) -- mirrors `components-test.html`. `<head>` loads `assets/css/tickettrade.css`. 16 assertions; PASS/FAIL to `<pre>`; `data-pass`/`data-fail`.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- append 'Brand-Specific Components' section. Add recipes using ONLY existing 1.1 tokens + `--shadow-2`: `.rank-badge` + `.rank-badge-{a|b|c|d|e|s}`, `.ticket-code-block` + `.ticket-code-block-reveal` + `.ticket-code-block-copy` + `.ticket-code-block-share`, `.status-badge` + `.status-badge-{pending|active|rejected|redeemed|expired|sold|disputed|removed}`, `.listing-card` + `:hover` + `[data-corkboard="true"]` + reduced-motion guard, `.leaderboard-row` + `.leaderboard-row-name` + `.leaderboard-row-points`. Tier S `legend-glow` keyframes (2.4s ease-in-out infinite; box-shadow only; disabled under reduced motion).
- [ ] `public/assets/js/ticket-code.js` -- ES module. `initTicketCode(rootEl)` wires up `.ticket-code-block-reveal` (toggle mask + `announce`), `.ticket-code-block-copy` (`navigator.clipboard.writeText` + button label flip for 1.5s + `announce`), `.ticket-code-block-share` (no JS needed; it's an `<a target="_blank">`). Handles `navigator.clipboard` unavailable with `console.warn` and the Copy button stays visible.
- [ ] `public/brand-test.html` -- 16 assertions for I/O Matrix. One example of each component, hidden `[data-brand-self-test]` fixture, `<pre id="results">` log. PASS/FAIL to `<pre>`; `data-pass`/`data-fail`.
- [ ] `composer.json` -- add `"test:brand"` echo placeholder.
- [ ] `scripts/verify/1-4-build-brand-specific-components-rank-badge-ticket-code-block.sh` -- atomic per-slice verify.

**Acceptance Criteria:**
- Given a developer writes `<span class="rank-badge rank-c">Operative (C)</span>`, when the page renders in either theme, then the pill uses the green fill + white text + caption typography + `aria-label="Tier C: Operative"`, no numeric points appear, and Tier S carries a 2.4s `legend-glow` animation disabled under reduced motion.
- Given a developer writes `<code class="ticket-code">TK-AbCdEfGh12345678</code>` with adjacent reveal/copy/share, when the page renders, then the code is masked by default; clicking reveal shows the full code and announces `Code revealed`; clicking copy writes to clipboard, shows `Copied` for 1.5s, and announces `Code copied`; clicking share opens a new tab to WhatsApp.
- Given a developer writes `<span class="status-badge status-active">Active</span>`, when the page renders, then the badge uses the green fill + dark text + `aria-label="Status: Active, <timestamp>"` and is not interactive.
- Given a developer writes `<article class="listing-card">` on the corkboard (≥768px), when the page renders, then the card uses paper surface + `rounded.md`, rotates ±2° seeded by listing id (decorative, `aria-hidden`), carries a pushpin graphic, and on hover lifts 4px with `--shadow-2` (disabled under reduced motion).
- Given a developer writes `<li class="leaderboard-row">`, when 20 rows render, then the list is dense, no hover elevation, separators via `border-bottom`.
- Given `composer test:tokens` and `composer test:brand` run, when the scripts execute, then both exit 0.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/verify/1-4-build-brand-specific-components-rank-badge-ticket-code-block.sh` -- expected: exit 0
- `composer test:tokens` -- expected: exit 0
- `composer test:brand` -- expected: exit 0 (placeholder echo)
