
## Deferred from: code review of spec-1-1-implement-design-token-system (2026-08-27)

- **carousel, nav-sidebar, btn-* disabled states, input/textarea, fab, category-tabs, star-rating-input have no replacement** — Multiple components from the old spine were dropped with no replacement prose spec. listing-card has image-aspect 4:3 but no carousel component. Disabled/loading button states are missing. No min-height for status badges. Documentation gap; not a code bug per se, but downstream stories will need to invent them.
  - Location: `DESIGN.md components: block (missing entries)`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Component block has no shadow tokens; toasts and cards render without shadows** — Old card-listing had base shadow + hover-shadow + transition; new listing-card has only a hover-shadow placeholder. Old toasts had shadow tokens; new toasts do not. Modals had center/full-screen shadow tokens; new modals do not. Components render with no shadow unless story 1.3+ reinvents them.
  - Location: `DESIGN.md components: (listing-card, toasts, modals)`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **DESIGN.md drops inverse-*, background-*, surface-tint, error-container, primary-light etc. with no deprecation note** — Tokens removed: inverse-surface, inverse-on-surface, inverse-primary, error-container, on-error-container, error-container-dark, on-error-container-dark, background, on-background, background-dark, on-background-dark, surface-tint, surface-tint-dark, primary-light, tertiary-light, secondary-light. No replacement or deprecation note. Consumers that still reference them silently lose the token.
  - Location: `DESIGN.md colors: (removed entries)`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Ticket-code block row layout is unspecified for narrow viewports** — Prose says reveal/mask toggle, copy button, and WhatsApp share button 'sit adjacent on the same row' but the ticket-code-block token only specifies the code surface. No row layout, no spacing token, no rule for overflow or narrow viewports.

DUPLICATE NOTE: Same finding was raised twice in the blind-hunter stream.
  - Location: `DESIGN.md ticket-code-block; Ticket-code block prose`
  - Source: blind-hunter+blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Search input 250ms debounce has no FULLTEXT spec** — DESIGN.md says 'Search input is debounced 250ms and used on Board (FULLTEXT search)' but the board section in EXPERIENCE.md is not in the diff. No spec for the FULLTEXT index, match ranking, or searchable fields. The token is defined; the behavior is not.
  - Location: `DESIGN.md search-input`
  - Source: blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Bulk action bar lists admin flows (promote/ban/suspend) not specified** — Bulk action bar lists 'ban, suspend, promote, approve, reject, remove, dismiss, delete, relist, export' and that destructive actions trigger admin re-auth dialog. None of the promote/ban/suspend flows are specified in DESIGN.md (no component, no flow, no audit-log spec).
  - Location: `DESIGN.md bulk-action-bar`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Audit log hash-chain integrity check has no token, no algorithm, no UX** — Report row and Audit log row components assume 'Hash chain integrity check runs on every page load; mismatch shows a red banner'. No token for the red banner, no spec for the integrity check algorithm, no spec for how the mismatch state interacts with the rest of the page.
  - Location: `DESIGN.md audit-log-row; Report row`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **'/' search shortcut has no spec for inputs, modifier keys, or theme storage key** — Pressing '/' focuses the board search from any surface. No spec for what happens if focus is already inside an input/textarea/contenteditable, no spec for Cmd/Ctrl+/, and no spec for the localStorage key that persists the dark/light data-theme preference.
  - Location: `DESIGN.md (keyboard section, theme persistence)`
  - Source: blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **check_no_raw_hex.sh scope is too narrow (only css/html)** — Script only scans *.css and *.html. PHP templates (*.php), JS/TS, JSX/Vue inline styles all bypass the check. A developer can introduce a raw hex in a .php or .js file with no signal.
  - Location: `scripts/check_no_raw_hex.sh (find command)`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **check_no_raw_hex.sh excludes _bmad-output where source DESIGN.md lives** — The source DESIGN.md spine lives under _bmad-output. The script excludes that directory, so if the planning copy diverges from the promoted project-root copy, the script will not notice. Either the script should also check that the two DESIGN.md files match, or the project should not maintain two copies.
  - Location: `scripts/check_no_raw_hex.sh (EXCLUDED_DIRS)`
  - Source: blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **composer.json has only test:tokens; no PSR-12, no PHPUnit, no JS test wiring** — AGENTS.md says phpcs --standard=PSR12 src/ is TODO: add to composer. test:tokens is the only test wiring and it only checks hex literals, not PSR-12, not PHP, not JS.
  - Location: `composer.json`
  - Source: blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **disputed status is overloaded across badge, overlay, error container** — Status-disputed is used as a badge (status-disputed), a report-row overlay (dispute-status-overlay), and an error message (formerly error-container). No spec for how the badge, overlay, and error message relate in dark mode where the deleted error-container-dark token no longer exists.
  - Location: `DESIGN.md status-disputed; components.dispute-badge`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Corkboard pin SVG / rotation has no spec** — listing-card-cork uses pin-{colors.pin-red} or pin-{colors.pin-blue} with ±2deg rotation. No spec for the pin SVG, the layering, or whether the pin is keyboard-focusable. The only a11y note (aria-hidden) is in the don't-list. The don't-list does not mention that the corkboard must degrade to a non-rotated grid for screen readers.
  - Location: `DESIGN.md listing-card-cork`
  - Source: blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Token self-test fixture has no actual test consumer** — CSS comment says the [data-token-self-test] element is 'Detected by visual diff or by story 1.2+ integration tests'. No visual-diff test, no integration test, no story 1.2+ scaffolding in the diff. The self-test will not be detected as failing even if a token drifts.
  - Location: `tickettrade.css lines 228-385 (data-token-self-test block)`
  - Source: blind-hunter, Severity: medium
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **avatar-picker: 12 illustrations have no path, no aria-label, no fallback** — avatar-picker is described as 'Grid of 12 predefined illustrations'. No token for the illustration filenames, no path under public/assets/avatars/, no spec for aria-label per option. The don't-list bans emoji but the picker uses illustrations, not text. No fallback label.
  - Location: `DESIGN.md avatar-picker`
  - Source: blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts
- **Bottom nav: 5-item count, icon-vs-label collapse, safe-area offset are not in the frontmatter** — Prose specifies 5 items, xs viewport icon-only collapse, iOS notch / Android gesture bar safe area. The component token only declares border-top and height (64px). The rest lives only in prose.
  - Location: `DESIGN.md bottom-nav (frontmatter vs prose)`
  - Source: blind-hunter, Severity: low
  - Reason for defer: downstream concern; will be re-raised when its owning story starts

## Deferred from: step-04 review r2 of spec-1-2-implement-light-dark-theme-with-localstorage-persistence (2026-08-27)

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-implement-light-dark-theme-with-localstorage-persistence.md`
  summary: Cross-tab sync via the `storage` event
  evidence: `theme.js` does not register `window.addEventListener('storage', ...)`. Two tabs viewing the same domain can show different `aria-checked` states after one tab calls `set()`. A real-world hot-swap of `matchMedia` would also miss the captured `mq` reference.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-implement-light-dark-theme-with-localstorage-persistence.md`
  summary: Production pages (`index.php`, `admin/index.php`) do not yet wire the new JS modules or set `data-default-theme`
  evidence: The story ships modules and a test page, but no production entry point imports them yet. That wiring belongs to epic 2 (auth + front controller).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-implement-light-dark-theme-with-localstorage-persistence.md`
  summary: No JavaScript unit-test framework or CI runner for `theme-test.html`
  evidence: `composer.json` exposes only `test:tokens` (the raw-hex linter). The 11 assertions in `theme-test.html` are run manually via `php -S` + headless Chromium. The `data-pass`/`data-fail` attributes are plumbed for CI but no consumer exists yet. Belongs to epic 9 test infrastructure.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-implement-light-dark-theme-with-localstorage-persistence.md`
  summary: Hardcoded tap-target (44px) and transition (120ms) values; no `--tap-target-min` or `--duration-fast` token
  evidence: Story 1.1's token spine does not declare a tap-target or duration scale. Adding them is a design-token change that should be coordinated with story 1.10 (a11y floor) and 1.3 (core components), not done in isolation here.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-implement-light-dark-theme-with-localstorage-persistence.md`
  summary: `aria-live` region is theme-specific (`id="theme-announcer"`); no shared announcement surface for toasts/errors
  evidence: Story 1.6 (toast system) and any future async-action feedback surface will need their own aria-live regions or a shared one. The naming should be coordinated with 1.6 to avoid two parallel live regions that double-announce.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-implement-light-dark-theme-with-localstorage-persistence.md`
  summary: Inline bootstrap silently writes `system` to localStorage on first visit when no `data-default-theme` is supplied; behavior is correct but undocumented in user-facing copy
  evidence: The fallback chain writes `'system'` so subsequent reads are deterministic. A user whose OS preference later changes will follow the new preference without ever making an explicit choice. Worth a one-line note in the spec Code Map and the eventual `/settings` page microcopy.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-implement-light-dark-theme-with-localstorage-persistence.md`
  summary: No CHANGELOG entry or migration note for the three new files and the `data-default-theme` requirement
  evidence: Team coordination via PRs would benefit from a CHANGELOG line describing the new public API surface and the contract on `<html>`. To be done when the team PR template is set up (epic 9).

## Deferred from: step-04 review of spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav (2026-08-28)

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: Test runner hard-codes RGB literals (primary, error, disabled surface) for token-value assertions; not pinned to a shared fixture.
  evidence: components-test.html BUTTON_VARIANTS, BUTTON_LOADING assertions use `rgb(27, 94, 32)`, `rgb(198, 40, 40)`, `[56, 56, 56]`, `[224, 224, 224]` directly. A future token tweak silently invalidates the suite.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `a11y.js` `bindSkipLink` is exported with JSDoc but is not exercised by any assertion in this story's test runner.
  evidence: a11y.js exports bindSkipLink; components-test.html does not call it; modal.js does not import it. Behavior (history pushState, focus + scroll, default-href preservation) ships unverified by the story that introduces it.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `FOCUSABLE_SELECTOR` does not exclude `[aria-disabled='true']` controls.
  evidence: a11y.js FOCUSABLE_SELECTOR uses `:not([disabled])` only. aria-disabled controls remain in the focusable list and the focus trap can land on them.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `a11y.js` `isVisible` walks parentNode; an open ShadowRoot in the chain causes the loop to never reach `document.documentElement`.
  evidence: a11y.js isVisible function does not check for ShadowRoot boundaries. Web Components later in the project will trigger this.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `a11y.js` `isVisible` does not check `visibility: collapse`; collapsed elements (colgroup, column, row) remain in the focusable list.
  evidence: a11y.js isVisible function checks only `display: none` and ancestor chain. `visibility: collapse` is not handled.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `a11y.js` `announce` with `politeness: 'assertive'` has a race: two calls in the same task before the 0ms setTimeout fires; the first call's setTimeout reverts aria-live before the second message is read.
  evidence: a11y.js announce function uses a module-level politeness flag and a single 0ms setTimeout. Two rapid assertive announcements overwrite each other.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `a11y.js` `bindSkipLink` adds a history entry on each click; back button requires many presses.
  evidence: a11y.js bindSkipLink uses default anchor behavior; no replaceState when location.hash already matches.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `modal.js` `openModal` idempotent re-open with a different `options.trigger` does not update the entry's stored trigger; close restores focus to the first trigger, not the new one.
  evidence: modal.js openModal returns `true` early on `isOpen(rootEl)` without updating the entry's trigger field.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `modal.js` `openModal` with no `options.trigger` and `document.activeElement === body`: close focuses body, no useful focus context.
  evidence: modal.js openModal stores `document.activeElement` as the trigger fallback when `options.trigger` is omitted; if activeElement is body, the user is left with no focus context after close.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `modal.js` `openModal` does not require `aria-labelledby` or `aria-label`; a malformed root can ship a dialog with no accessible name.
  evidence: modal.js openModal validates only `role` and `aria-modal`. A dialog without a name will be announced as an empty dialog by screen readers.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `modal.js` `openModal` / `closeModal` do not call `announce` on the shared live region; screen reader users get no audible cue that the dialog opened or closed.
  evidence: modal.js does not import `announce` from a11y.js (Code Map was also fixed: the import statement is `{ trapFocus, releaseFocus }` only).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: Dialog opens without inverting siblings for assistive tech; screen reader users can still read background content while the dialog is open.
  evidence: modal.js openModal does not set `aria-hidden` on body siblings or apply `inert` to the rest of the page.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: Disabled buttons use `pointer-events: none` alongside native `:disabled`; pointer-events: none can suppress the focus ring on some platforms.
  evidence: tickettrade.css `.btn-primary:disabled, .btn-secondary:disabled, .btn-ghost:disabled, .btn-danger:disabled` apply `pointer-events: none`. The native `:disabled` attribute already suppresses click activation in browsers.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: Browser-side behavior (modal.js, a11y.js, CSS recipes) is shippable without CI failure because the only `test:components` script is an echo placeholder.
  evidence: composer.json `test:components` value is `echo 'manual: ...'`; it never runs the 16 assertions. Spec acknowledges this is deferred to epic 9 but no temporary guard (e.g. `node --test` smoke) was added in the meantime.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-build-core-component-library-buttons-inputs-modals-bottom-nav.md`
  summary: `announce` and `bindSkipLink` exported from a11y.js have no caller imports in this story; "dead code" that future refactors can silently break without test coverage.
  evidence: a11y.js exports `announce` and `bindSkipLink`; modal.js imports only `trapFocus, releaseFocus`; the test page calls `announce` indirectly but never `bindSkipLink`. Both are public-API surfaces that ship untested.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-1-implement-design-token-system.md`
  summary: SELF_TEST I/O Matrix row claims `getComputedStyle` runtime resolution for every `--self-test-*` property, but the verify [4/7] step only does substring matching. A real getComputedStyle assertion requires a JS engine (node + JSDOM) that the verify harness does not yet have.
  evidence: I/O Matrix row SELF_TEST says "every `var(--token)` resolves to a non-empty value" via getComputedStyle; scripts/verify/1-1-implement-design-token-system.sh [4/7] checks for the substring `var(--color-{kebab(name)})` in the fixture text only.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: Browser support matrix is not defined; downstream specs cite modern features (prefers-color-scheme, :focus-visible, container queries) without a documented target.
  evidence: Master spec Constraints mention Inter font-loading, prefers-reduced-motion, prefers-color-scheme, :focus-visible but no supported-browsers list.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: No i18n / l10n plan exists; product targets NSBM in Sri Lanka with Sinhala/Tamil national languages.
  evidence: All copy examples are English-only; no RTL consideration; no string externalization.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: No global asset budget (CSS / JS / font payload / LCP / TBT). CAP-3 caps cork texture at ≤100 KB but no per-route budget.
  evidence: tickettrade.css is 17.7 KB today; no documented upper bound. JS modules under public/assets/js/ not yet shipped.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: No caching/fingerprinting strategy for tickettrade.css.
  evidence: Single production stylesheet shipped without hash, cache-busting, or CDN guidance.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: No rollback or deprecation playbook (token rename, component rename, banned-pattern tightening).
  evidence: 1-1 introduces tokens; later epics may rename. No shim/alias protocol documented.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: No feature-flag / kill-switch plan.
  evidence: SPEC implies Epic 1 changes ship at deploy time; no partial-rollout mechanism described.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: Status ENUM mismatch: token-reference.md defines `status-sold` and `status-removed` fills but PRD ticket.status ENUM is ('active','redeemed','expired','disputed') and listing.status ENUM is ('pending','active','rejected').
  evidence: PRD FR-LST-002 / FR-TKT-002 ENUMs do not list sold/removed; tokens imply these states.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: `composer test:banned` is grep-based; cannot catch emoji in encoded form, composite emojis, dynamically built strings, or i18n'd copy.
  evidence: 1.12 spec acknowledges grep; AST / lint supplementation deferred.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-11-...md`
  summary: Mockup governance undefined (review process, ownership when design evolves, diff-testing in CI).
  evidence: 1.11 ships three mockups as canonical visual references but no governance doc.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-7-...md`
  summary: audit-log row UI ships in Epic 1 but hash-chain integrity check lands in Epic 8.
  evidence: Master Constraint says "Audit-log row is a display primitive only"; staging for the row before Epic 8 needs a banner or hidden state.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-6-...md`
  summary: velocity-flag badge ships in Epic 1 but threshold depends on Points Service (Epic 6+) data.
  evidence: Master §Assumptions says "velocity detection logic lands with Epic 6 Points"; 1.6 must render empty/hidden state when velocity source is unavailable.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-7-...md`
  summary: search debounce 250 ms race conditions (stale responses clobbering newer ones) is a runtime concern owned by Epic 3.
  evidence: 1.7 chrome; the request token + response discard is Epic 3's search-service contract.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-9-...md`
  summary: TK- prefix invariant violated on pre-existing/migrated ticket codes.
  evidence: PRD envisions greenfield; migration strategy is Epic 9 (migrations runner) concern.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-9-...md`
  summary: Dispute modal reasons (4) and Report modal reasons (5) cite no PRD FR-id; future drift between spec and PRD is unguarded.
  evidence: 1.9 I/O Matrix lists reason taxonomies inline; no cross-reference to PRD FR-LST-013 / FR-RPT-001.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: AD-19 (admin re-auth) not defined locally; cross-reference to architecture spine needed.
  evidence: 1.9 cites AD-19 but ARCHITECTURE-SPINE.md lives at planning-artifacts/architecture/architecture-02-2026-08-27/ARCHITECTURE-SPINE.md and is not in the spec context list.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-3-...md`
  summary: Tasks marked `[x]` in the 1-1 spec is a verification record of existing files, not a forward-looking execution plan.
  evidence: stories/1-1-...md Tasks & Acceptance shows all boxes checked because the implementation already exists on disk; future stories use `[ ]` for execution tracking.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: No review-loop-iteration trigger documented; master and story frontmatter both set `review_loop_iteration: 0` without definition.
  evidence: workflow step-04 increments before each review loopback but the trigger (re-derived after bad_spec, etc.) is implicit in step-04 prose.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: `baseline_commit` semantics not documented; when does it advance (per-story, per-epic, after review)?
  evidence: Master and 1-1 share the same baseline_commit (939dba0d295df58307a691a90edc336b4de283ab) even after 1-1 verification.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: Cross-Epic Convention template uses literal `{{epic-n}}` and `{{slug}}`; the convention is aspirational rather than a worked example.
  evidence: Master spec Cross-Epic Convention section says "_bmad-output/specs/spec-{{epic-n}}-{{slug}}/SPEC.md"; this Epic 1 spec lives at `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md` per the user's "keep spec here" decision.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-1-...md`
  summary: Code Map contains hard-coded byte sizes (17.7 KB / 392 lines / 10.7 KB) that will go stale.
  evidence: tickettrade.css grew from 17.7 KB to 17.7 KB today; verify script is 11.9 KB after this review's URL_FRAGMENT_OK + :root assertion additions.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/SPEC.md`
  summary: Master spec `companions:` frontmatter lists 4 files but `context:` only 3 (epic-1-context.md, DESIGN.md, EXPERIENCE.md). Companions are not listed in `context:` so reviewers must discover them.
  evidence: SPEC.md frontmatter companions: token-reference.md, accessibility-floor.md, banned-patterns-microcopy.md, empty-error-state-library.md vs context: epic-1-context.md, DESIGN.md, EXPERIENCE.md.

- source_spec: `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-1-...md`
  summary: Archive reference in Code Map is `archive/implementation-artifacts/spec-1-1...1-4-*.md` (4 paths) but the rewrite spans 13 stories; trim to the actually-archived 4 stories or document the gap.
  evidence: archive/implementation-artifacts/ contains spec-1-1, spec-1-2, spec-1-3, spec-1-4 (4 files). The "1-1...1-4" glob is correct but the rewrite references 13 stories, so reviewers may expect 1-5..1-13 archives that do not exist.

