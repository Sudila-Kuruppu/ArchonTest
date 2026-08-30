---
title: 'Story 1.7: Build Tab, Search, Bulk-Action, Analytics, Report, and Audit-Log Row Components'
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

**Problem:** Stories in epics 3, 4, 7, 8 render data surfaces with rows (listings queue, tickets, reports queue, audit log), tabs (filter by status), search inputs (full-text on listings), bulk-action bars (admin actions on multiple rows), analytics cards (KPI tiles), and report rows. Each is a distinct component with its own anatomy, focus behavior, and ARIA semantics, but no token-driven recipe exists for any of them in the current codebase.

**Approach:** Append a 'Data Surface' section to `public/assets/css/tickettrade.css` after 1.6. Six component recipes: tab strip, search input, bulk-action bar, analytics card, report row, audit-log row. No new JS module required — these are stateless CSS primitives that compose with the 1.3 modal/button/toast modules. Ship `public/data-test.html` with 14 I/O-Matrix assertions.

## Boundaries & Constraints

**Always.** Tabs: `role="tablist"`, each tab `role="tab"`, `aria-selected="true"` on the active, `aria-controls` linking to a tabpanel; Arrow keys cycle tabs; `aria-current="page"` not used here (it's tabs, not nav). Search input: `<input type="search">` with `role="searchbox"`, `autocomplete="off"`, clear-button on the right when value is non-empty, `aria-label` "Search listings" etc. Bulk-action bar: fixed bar at top of list when ≥1 row selected; shows count + actions; `role="region"` `aria-label="Bulk actions"`. Analytics card: 4 KPI tiles (`KPI counter` component is 1.8's, but the card chrome is here); `role="group"` with `aria-label`; the value uses `display-lg` typography. Report row: dense list item with status badge (1.4) + evidence summary + action menu (`role="menubar"`); the action menu uses the 1.3 button primitives. Audit-log row: dense, monospace timestamp + actor + action + target (read-only display primitive; hash-chain integrity is Epic 8's). Every row is keyboard-reachable and reflows to 320px (data tables scroll inside their container with sticky first column).

**Ask First.** Adding a new bulk action (e.g. `warn`): HALT and ask (admin destructive actions are out of Epic 1 chrome). Adding a new tab style (e.g. vertical): out of scope.

**Never.** No raw hex outside the 1.1 allowlist. No infinite-scroll markers on the lists. No emoji. No encouragement filler. No nested modal markers (the action menu is a popover, not a modal).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| TABS_ARROW_NAV | focus on tab 1, press ArrowRight | focus moves to tab 2; `aria-selected="true"` follows focus | N/A |
| TABS_HOME_END | focus on tab 3, press Home | focus moves to tab 1; End → tab N | N/A |
| SEARCH_CLEAR | `<input type="search">` with non-empty value | clear button visible on the right; click clears the value | N/A |
| SEARCH_REFLOW | `<input type="search">` at 320px | full-width; clear button stays accessible | N/A |
| BULK_BAR_APPEARS | ≥1 row selected | bulk-action bar slides in (transform disabled under reduced motion); shows `N selected` + actions | N/A |
| BULK_BAR_EMPTY | 0 rows selected | bulk-action bar hidden | N/A |
| ANALYTICS_CARD | `<div class="analytics-card">` | `role="group"`; `aria-label` from `aria-labelledby`; value uses `display-lg`; trend uses `success`/`error` semantic token | N/A |
| REPORT_ROW | `<li class="report-row">` with status badge + evidence + action menu | keyboard-reachable; action menu opens on click/Enter; `aria-haspopup="menu"` | N/A |
| AUDIT_LOG_ROW | `<li class="audit-log-row">` | monospace timestamp + actor + action + target; read-only; no hover lift | N/A |
| DATA_TABLE_320 | data table at 320px | scrolls inside container; sticky first column | N/A |
| TAB_AUTOFOCUS | tab strip receives focus | no autofocus; focus enters on Tab from the previous focusable element | N/A |
| BULK_BAR_KEYBOARD | focus on bulk bar | Tab cycles through actions in order; ESC closes the action menu popovers | N/A |
| REPORT_ROW_STATUS | report row with status=disputed | status badge `Disputed` (from 1.4) visible at the start of the row | N/A |
| DATA_SELF_TEST | hidden `[data-data-self-test]` fixture | every token used resolves to a non-empty value | unresolved halts verify |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the Cross-Story Dependencies section is the contract (1.7 supplies primitives for 1.8, 1.11, 1.13, and every later epic's data surfaces).
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- component tokens for tabs, search, bulk-action, analytics, report-row, audit-log-row.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/token-reference.md` -- companion distillation.
- `public/assets/css/tickettrade.css` -- existing. Append 'Data Surface' section. Recipes: `.tabs` + `.tab` + `.tab[aria-selected="true"]` + `.tabpanel`; `.search-input` + `.search-input-clear`; `.bulk-action-bar` + `.bulk-action-bar-action`; `.analytics-card` + `.analytics-card-value` + `.analytics-card-trend-{up|down|flat}`; `.report-row` + `.report-row-status` + `.report-row-actions`; `.audit-log-row` + `.audit-log-timestamp` + `.audit-log-actor` + `.audit-log-action` + `.audit-log-target`.
- `public/data-test.html` (new) -- 14 assertions.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/css/tickettrade.css` -- append 'Data Surface' section. Recipes using ONLY existing tokens + `--shadow-1` (from 1.3) for the bulk-action bar. Tabs use `--radius-full` for the active pill. Audit-log row uses `ui-monospace` for the timestamp.
- [ ] `public/data-test.html` -- 14 assertions for I/O Matrix. One example of each component, hidden `[data-data-self-test]` fixture, `<pre id="results">` log.
- [ ] `composer.json` -- add `"test:data"` echo placeholder.
- [ ] `scripts/verify/1-7-build-tab-search-bulk-action-analytics-report-and-audit-log.sh` -- atomic per-slice verify.

**Acceptance Criteria:**
- Given a developer renders `<div role="tablist">` with 3 tabs and `aria-selected="true"` on the second, when the user presses ArrowRight on tab 1, then focus moves to tab 2 and `aria-selected="true"` follows focus; Home/End cycle to first/last.
- Given a developer renders `<input type="search">`, when the value is non-empty, then a clear button appears; clicking it clears the value.
- Given a developer renders a list where ≥1 row is selected, when the selection state updates, then the bulk-action bar appears with `N selected` + actions; with 0 selected, it is hidden.
- Given a developer renders `<div class="analytics-card">`, when the page renders, then the card uses `role="group"` with `aria-labelledby`, the value uses `display-lg` typography, and the trend uses `success`/`error` semantic tokens.
- Given a developer renders `<li class="report-row">` with status=disputed, when the page renders, then the row shows the `Disputed` status badge from 1.4 + evidence summary + action menu (`aria-haspopup="menu"`).
- Given a developer renders `<li class="audit-log-row">`, when the page renders, then the row is monospace, read-only, with no hover lift.
- Given a data table at 320px, when the page renders, then the table scrolls inside its container with a sticky first column.

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0
- `bash scripts/verify/1-7-build-tab-search-bulk-action-analytics-report-and-audit-log.sh` -- expected: exit 0
- `composer test:data` -- expected: exit 0 (placeholder echo)
