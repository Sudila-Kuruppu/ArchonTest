# Token Reference

Companion to SPEC-epic-1-ux-foundation-design-system, supporting **CAP-1** (design tokens + theme) and **CAP-2** (component library). The authoritative source for tokens and component anatomy is `DESIGN.md` at the project root and `EXPERIENCE.md` under `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/`. This companion distills the load-bearing details an implementer needs without re-reading the full spines.

## Palette layers (per DESIGN.md Colors)

- **Layer 1 — brand:** primary NSBM green `#1B5E20` (light) / `#2E7D32` (dark hover); trust amber secondary `#F57F17` / `#F9A825`; info blue tertiary `#0277BD` / `#0288D1`. On-* and *-container variants per token table in `DESIGN.md`.
- **Layer 2 — semantic (mode-invariant, AA-safe in both themes):** success `#2E7D32`, error `#C62828`, warning `#B45309`, info `#0277BD`.
- **Layer 2 — status role fills (eight):** `status-pending-fill/text`, `status-active-fill/text`, `status-rejected-fill/text`, `status-redeemed-fill/text`, `status-expired-fill/text`, `status-sold-fill/text`, `status-disputed-fill/text`, `status-removed-fill/text`. Each is a fill+text pair that reads as a badge against any surface; the Contrast Ledger lists all eight combinations (ratios ≥5.3:1).
- **Layer 2 — rank tier (six):** `rank-e` Recruit gray, `rank-d` Rookie blue, `rank-c` Operative green (= primary), `rank-b` Specialist gold, `rank-a` Elite orange, `rank-s` Legend red. Tier S carries a 2.4 s ease-in-out `legend-glow` animation (box-shadow only) disabled under `prefers-reduced-motion`.
- **Layer 3 — surface tokens (light + dark):** `surface-base / -raised / -container / -container-high / -outline-variant / -border-hairline / -on-surface / -on-surface-variant`. Both modes share structural roles so a token-built component works in either.
- **Decorative:** `cork-base` (`#C8A878`) + `cork-grain` (board view cork texture), `pin-red` / `pin-blue` (push-pin graphics), `velocity-flag-fill/text`, `on-break-pill`. None carry meaning; none exposed to assistive tech.

## Contrast Ledger (load-bearing, all AA-pass)

Per `DESIGN.md` Contrast Ledger; full table of 20+ pairs covers primary/semantic/status/code/surface combinations in light and dark. Implementers must use this ledger as the audit source — a new color clears the bar before landing.

## Typography scale

- **Body:** `system-ui` for body (fast, platform-native). Sizes per `typography.body-sm/md/lg` tokens.
- **Display + headlines:** Inter, loaded via Google Fonts preconnect + css2 link in `<head>` (not self-hosted). Sizes: `display-lg` 32 px / 700 / -0.01 em; `headline-md` 24 px / 600; `title-sm` 18 px / 600.
- **Monospace:** `ui-monospace` with `letter-spacing: 0.04em` for ticket code block, redemption input, `points_log.event_uuid`. The amber-on-near-black surface (`code-text` `#FFD600` / `#FFEA00` on `code-bg` `#1E1E1E` / `#0A0A0A`) is the only place this treatment appears.

## Spacing + radii + elevation

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px. `gutter-mobile` 16 px, `gutter-desktop` 32 px, `section-gap` 24 px, `card-gap` 16 px.
- **Radii:** `sm` 4 px (inputs, redemption code field, leaderboard rows, dense status badges), `md` 8 px (cards, buttons, listing card, toast, modal footer actions), `lg` 12 px (modals, large surfaces, profile pages), `xl` 16 px (hero surfaces, success modals), `full` 9999 px (rank pills, status badges, on-break pill, verified-student badge, nav-icon containers).
- **Elevation:** two layers — base (1 dp = hairline border + 0.5 px-tint shadow on surface-raised) and hover (4 dp = 4 px translateY + 0 4px 12px shadow at 12% opacity on listing cards and corkboard cards). No other element gets hover elevation.

## Component anatomy — CAP-2

Each component is declared as a class selector. Implementations reference tokens only; raw values fail CI.

### Core structural (Story 1.3)
- **Button — primary:** `class="btn-primary"`. `var(--color-primary)` fill, `var(--color-on-primary)` text, `var(--radius-md)`. Hover → `var(--color-primary-dark)`. Disabled → `var(--color-surface-container-high)` fill, `var(--color-on-surface-variant)` text. Loading state: spinner replaces label, width preserved.
- **Button — danger:** `class="btn-danger"`. `var(--color-error)` fill, `var(--color-on-primary)` text; always followed by a confirmation step (modal or re-auth).
- **Button — secondary:** `class="btn-secondary"`. Transparent fill with `var(--color-primary)` text and border; hover fills with `var(--color-primary-container)`.
- **Button — ghost:** `class="btn-ghost"`. Transparent with `var(--color-on-surface)` text; hover fills with `var(--color-surface-container)`.
- **Input — field:** `class="input-field"`. `var(--color-surface-raised)` fill, `var(--color-outline-variant)` border, `var(--radius-sm)`. Error state: error border + 12 px error text below. `autocomplete` attribute set per the accessibility floor mapping.
- **Modal — dialog:** `class="modal-dialog"` or `Support\Modal::open(...)`. `var(--color-surface-raised)` fill, `var(--radius-lg)`, 24 px padding, `max-width: 600px`. Closes on ESC, X button, scrim click (purchase confirmation suppresses scrim for 2 s); focus trapped; focus returns to trigger; `aria-modal="true"`, `role="dialog"`, `aria-labelledby` on title.
- **Bottom nav:** `class="bottom-nav"`. 64 px tall, fixed to bottom, five items (Board, My Listings, My Tickets, Sales, Profile). Active item uses primary icon+label; inactive uses on-surface-variant. `aria-current="page"` on active. Hidden on ≥768 px. No badge counts.

### Brand-specific (Story 1.4)
- **Rank badge:** `class="rank-badge" data-tier="E|D|C|B|A|S"`. Full pill at caption (12 px / 700) with tier's fixed fill+foreground pair. Tier S shows the 2.4 s ease-in-out `legend-glow` animation (box-shadow only) disabled under `prefers-reduced-motion`. Badge never carries a numeric points total. Inactive 14+ days → `on-break-pill` variant with tooltip `Inactive 14+ days — next action restores full badge`; next action restores full color instantly.
- **Ticket-code block:** `class="ticket-code-block"`. Monospace amber text on near-black surface, 1 px amber border, `var(--radius-sm)`, `letter-spacing: 0.04em`. Always preceded by `TK-`, rendered in one unbroken line. Adjacent: reveal/mask toggle (keyboard accessible, announces state), Copy button (`Copy` → `Copied` 1.5 s confirmation), WhatsApp share button.
- **Status badge:** `class="status-badge" data-status="pending|active|rejected|redeemed|expired|sold|disputed|removed"`. Full pill at caption (12 px / 600) with the documented fill+text pair. Read-only; tooltip on hover/focus shows the date the status was set; `aria-label` carries the human-readable state.
- **Listing card:** `class="listing-card"`. `var(--radius-md)`, 4:3 image aspect ratio, title in title-sm, price in headline-md with secondary accent. Hover on desktop: `translateY(-4px)` + 0 4px 12px shadow at 12% (suppressed on touch + reduced motion). Single tab stop with inner text `aria-hidden`; tap opens the listing modal.
- **Leaderboard row:** `class="leaderboard-row"`. `var(--color-surface-container)` fill, `var(--radius-sm)`, 2/3 padding. Rank number in secondary at headline-md; display name in body-md; program/year in body-sm with on-surface-variant; tier badge right-aligned.

### Identity badges + toast (Story 1.6)
- **Toast:** call `Support\Toast::success|error|warning|info($message)`. Bottom-right on desktop, top on mobile. Matching semantic fill, white text. Auto-dismiss 4 s, pauses on hover/focus. Error and warning toasts include a manual dismiss button. `role="status"` for success/info, `role="alert"` for error/warning. Max 3 queued.
- **Verified-student badge:** `class="verified-student-badge"`. `var(--color-primary-container)` fill, `var(--color-on-primary-container)` text, inline-SVG checkmark icon, `var(--radius-full)`. Never clickable; full label `Verified Student` shown. Renders on profile, listing cards, listing modal.
- **Velocity-flag badge:** `class="velocity-flag-badge"`. `var(--color-velocity-flag-fill)` + `var(--color-velocity-flag-text)`, `var(--radius-sm)`. Tooltip `Earning above legitimate ceiling — review queued`. On admin Users list, clickable to user detail with flag log; on the user's own profile, links to the static page explaining the freeze.
- **On-Break pill:** replaces rank badge on profile and leaderboard rows after 14+ days inactivity. Grayscale surface + neutral text, full pill radius, tooltip `Inactive 14+ days — next action restores full badge`. Next action restores full tier color instantly with no point penalty.
- **Avatar picker:** `class="avatar-picker"`. Grid (4×3 desktop, 3×4 mobile) of circular `var(--radius-full)` thumbnails on surface-raised, 12 predefined illustrations shipped as inline SVG. Selected avatar carries a 2 px primary ring. No upload, no custom images.

### Data-surface (Story 1.7)
- **Filter tabs:** `class="filter-tabs"` with `role="tablist"` containing `role="tab"` buttons. Active swaps to primary-container fill with on-primary-container text; inactive transparent. Order follows PRD state machine. Keyboard arrow keys cycle. `aria-current="page"` on active.
- **Search input:** `class="search-input"`. Pill shape, leading magnifier icon, surface-container fill, outline-variant border, `var(--radius-full)`, 2/4 padding. Debounced 250 ms; `/` focuses Board search from any surface; empty state copy renders when no results.
- **Bulk-action bar:** `class="bulk-action-bar" hidden` plus `Support\BulkAction::show(count, actions)`. Sticky (top of table on desktop, bottom on mobile), surface-container-high fill, `var(--radius-md)`, slides in when 1+ rows selected. Shows count and a dropdown of bulk actions (ban, suspend, promote, approve, reject, remove, dismiss, delete, relist, export); destructive actions trigger the admin re-auth dialog.
- **Analytics card:** `class="analytics-card"`. Surface-raised fill, border-hairline 1 px border, `var(--radius-md)`, 4 px padding. KPI value in display-lg with primary text; subtitle in body-sm with on-surface-variant text; trend line below in success or error. Click opens analytics detail with the chart.
- **Report row:** `class="report-row"`. Surface-raised fill, border-hairline 1 px border, `var(--radius-sm)`, 2/3 padding. Dispute overlay badge replaces status pill for disputes; row click expands evidence detail inline; bulk-select checkbox on left.
- **Audit log row:** `class="audit-log-row"`. Surface-container fill, `var(--radius-sm)`, mono-code font. Hash cell uses code-bg with code-text amber; old/new values collapsed by default; filters are date range, actor, action, target; hash-chain integrity check runs on every page load (Epic 8 Support\\Audit); mismatch shows a red banner.

### Profile surfaces (Story 1.8)
- **Tier progress bar:** `class="tier-progress" data-current-tier="..." data-next-tier="..."`. Horizontal; surface-container track, `var(--radius-full)`, 8 px tall; fill uses current tier color. Tooltip `X of Y toward {next tier name}`; caption below shows next tier name and threshold.
- **KPI counter:** `class="kpi-counter" data-value="..."`. Single large number in display-lg (32 px / 700) with primary text; caption (12 px / 500) subtitle in on-surface-variant. Value updates in place when data refreshes (no animation).
- **Tier privilege tooltip:** `class="tier-privilege-tooltip-trigger" data-tier="..."` with a popover attaching on hover/focus. Surface-raised fill, outline-variant border, `var(--radius-md)`, 3 px padding, `max-width: 280px`. Lists what the current tier unlocks (C+: up to 5 active listings; B+: search rank boost; A+: featured listings; S: Hall of Fame + early access). Progressive disclosure — never a separate page.
- **Star rating input:** `class="star-rating-input"`. Five named radio inputs (1-5), radios hidden. Visible label is a 24 px star icon; filled stars use secondary, empty use outline-variant. Hover and focus preview; arrow keys cycle; screen reader announces `Rating: N of 5`; `Clear` link resets to 0; 48 dp touch targets.

### Form modals (Story 1.9)
- **Dispute modal:** `class="modal-dialog dispute-modal"`. Error 2 px destructive-action border. Reason dropdown (4 options: seller_unresponsive, item_not_as_described, buyer_unresponsive, other); required text field, 200-char max with counter; optional evidence image upload (one image, 5 MB max, validated through the 4-layer pipeline per NFR-SEC-004). Footer: secondary Cancel + danger Submit Dispute. On submit: ticket `status='disputed'` AND `dispute_status='pending'`; report created; toast confirms.
- **Report modal:** `class="modal-dialog report-modal"`. Surface-raised fill, `var(--radius-lg)`, 24 px padding, `max-width: 600px`. Reason dropdown (5 options: scam, inappropriate, spam, wrong_category, other); required text field, 200-char max. Footer: secondary Cancel + primary Submit Report. On submit: report `status='pending'`; toast `Report submitted. Admin will review within 48 hours.`
- **Purchase confirmation modal:** `class="modal-dialog purchase-confirmation-modal"`. Surface-raised fill, `var(--radius-lg)`, 24 px padding, `max-width: 600px`. Body text `Confirm purchase? This reserves the item with a digital ticket (a reservation, not payment).` Footer: secondary Cancel + primary Confirm. Scrim click suppressed for 2 s. On confirm: ticket created with TK- + 22-char base62 code, listing `quantity_sold` increments, redirect to My Tickets with toast `Ticket created. Code: TK-...`
- **Admin re-auth dialog:** `class="modal-dialog admin-reauth-dialog"`. Error 2 px border signaling a destructive action; single password field. Footer: primary Confirm + secondary Cancel. Failure shows inline error; success closes and proceeds. Re-auth window 300 s sliding per AD-19; flow rate-limited at 5/min/IP.

## Container width + breakpoint behavior

- Main content `max-width: 1200px` centered; forms and modals 600 px; admin tables full-bleed with side padding; profile pages 800 px.
- Board view: 1 col <576 px, 2 cols 576-767, 3 cols 768-991, 4 cols ≥992 with 16 px gap.
- My Tickets and Sales: 1 col <768 px, 2 cols ≥768.
- Admin tables: full-width at all breakpoints with horizontal scroll on <768.

## Decorative depth (CAP-3)

- Corkboard (≥768 px): cork-base background with cork-grain overlay; paper cards (cork-card) `#FFF8E7`; deterministic ±2° rotation seeded by listing id; pushpin graphic alternating red/blue by listing id hash. All decorative elements `aria-hidden`.
- List-view toggle in header flips via `aria-pressed`; state persisted per session.
- <768 px auto-degrades to plain grid; cork texture and rotation not rendered; list-view toggle hidden in header.
