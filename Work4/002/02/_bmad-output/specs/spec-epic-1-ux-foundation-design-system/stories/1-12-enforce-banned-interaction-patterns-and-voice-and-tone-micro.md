---
title: 'Story 1.12: Enforce Banned-Interaction Patterns and Voice-and-Tone Microcopy'
type: 'feature'
created: '2026-08-30'
status: 'draft'
baseline_commit: '939dba0d295df58307a691a90edc336b4de283ab'
review_loop_iteration: 0
capability: 'CAP-6'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md'
  - '_bmad-output/specs/spec-epic-1-ux-foundation-design-system/banned-patterns-microcopy.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The voice-and-tone rules and the locked anti-patterns (no emoji in functional copy, no streak counters, no daily-login displays, no badge counts on bottom nav, no push notifications, no infinite scroll, no nested modals, no algorithmic reputation scores, no encouragement filler, no numeric points totals on rank badges) are documented but not enforced at CI time. Without a linter, every later story is free to slip these patterns in.

**Approach:** Add `scripts/check_banned_patterns.sh` that greps the codebase for the documented anti-patterns and exits non-zero on any violation. Wire it as `composer test:banned`. Add a per-pattern override mechanism: a `.banned-allowlist` file at the repo root lets a developer explicitly document a violation with a one-line justification; the linter permits allowlisted matches and fails everything else. Add `scripts/verify/1-12-...sh` as the per-slice verify.

## Boundaries & Constraints

**Always.** Audit source is `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/banned-patterns-microcopy.md`. The linter greps `*.php`, `*.html`, `*.js`, `*.md` under the repo, excluding `_bmad-output/`, `vendor/`, `node_modules/`, `archive/`, `.git/`, `.agents/`, `.opencode/`, `verification_evidence/`, and `docs/`. The linter fails any PR introducing any documented anti-pattern without an explicit `.banned-allowlist` override. The override file format is `path:lineno: pattern-name # justification`; the linter logs each override but does not require re-justification. The voice-and-tone microcopy rules are the audit checklist when the linter is silent (no automated check for `N disputes on record` vs `N complaints` — that's a code-review concern). Tier names must pair with codes on first reference: `Recruit (E)`, `Rookie (D)`, `Operative (C)`, `Specialist (B)`, `Elite (A)`, `Legend (S)`. Subsequent references may use either form. Purchase confirmation body always includes `a reservation, not payment`. Disputes use `N disputes on record` (never `complaints` or `issues`).

**Ask First.** Adding a new banned pattern: HALT and ask. Removing an existing banned pattern: HALT and ask.

**Never.** No raw hex outside the 1.1 allowlist (this is a separate concern, owned by 1.1). No emoji in functional copy (every non-ASCII emoji in `.php`/`.html`/`.js` fails the linter unless allowlisted; `/docs/` and `/mockups/` are exempt). No encouragement filler phrases (`You're doing great!`, `Way to go!`, `Keep it up!`, `Awesome!`, `🎉`). No numeric points total on the rank badge. No streak/combo language (`streak`, `day streak`, `login streak`, `combo`, `multiplier x2`, `hot streak`). No infinite scroll markers (`infinite-scroll`, `IntersectionObserver` in board/lists). No nested modal markers (`modal-dialog` inside another `modal-dialog`). No algorithmic reputation score markers (`reputation_score`, `trust_score`, `credibility` outside admin-only contexts). No push notification strings (`notification`, `notif`, `push` in any user-facing template).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| BANNED_EMOJI_FAIL | `*.php` or `*.html` contains `🎉` | linter fails; names file:lineno and the matched emoji | N/A |
| BANNED_EMOJI_PASS | no emoji in functional copy | linter passes | N/A |
| BANNED_EMOJI_DOCS_EXEMPT | `docs/foo.md` contains `🎉` | linter passes (`/docs/` is exempt) | N/A |
| BANNED_STREAK_FAIL | a `.js` file contains `day streak` | linter fails; names file:lineno | N/A |
| BANNED_DAILY_BONUS_FAIL | a `.php` file contains `daily bonus` | linter fails | N/A |
| BANNED_BOTTOM_NAV_BADGE_FAIL | a `.html` file contains a numeric badge on a bottom nav item | linter fails | N/A |
| BANNED_PUSH_FAIL | a `.php` file contains `notif` in a user-facing template | linter fails | N/A |
| BANNED_INFINITE_SCROLL_FAIL | a `.js` file uses `IntersectionObserver` | linter fails | N/A |
| BANNED_NESTED_MODAL_FAIL | `modal-dialog` inside another `modal-dialog` | linter fails | N/A |
| BANNED_REPUTATION_FAIL | `reputation_score` in a non-admin file | linter fails | N/A |
| BANNED_FILLER_FAIL | a `.js` file contains `You're doing great!` | linter fails | N/A |
| BANNED_ALLOWLIST_OVERRIDE | a `.banned-allowlist` line matches a violation | linter permits the match; logs the override | unjustified lines still fail |
| BANNED_ALLOWLIST_INVALID | `.banned-allowlist` line is malformed | linter fails with a clear message about the malformed line | N/A |
| BANNED_TIER_FIRST_REF | a `.php` template uses `Operative` (without `(C)`) on first reference | code-review concern; linter does not catch (it's a checklist item) | N/A |
| BANNED_DISPUTE_COPY | a `.php` template uses `N complaints` instead of `N disputes on record` | code-review concern | N/A |
| BANNED_SUMMARY | linter completes | prints `OK: no banned patterns detected`; overrides logged to the evidence dir; exit 0 | any fail → exit non-zero |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic context; the Locked anti-patterns section.
- `_bmad-output/planning-artifacts/ux-designs/ux-02-2026-08-27/DESIGN.md` -- component tokens.
- `_bmad-output/specs/spec-epic-1-ux-foundation-design-system/banned-patterns-microcopy.md` -- companion distillation; the audit source for patterns + voice rules.
- `scripts/check_banned_patterns.sh` (new, executable, `set -euo pipefail`) -- the linter. Greps `*.php`, `*.html`, `*.js`, `*.md` under the repo. Excludes `_bmad-output/`, `vendor/`, `node_modules/`, `archive/`, `.git/`, `.agents/`, `.opencode/`, `verification_evidence/`, `docs/`. Reads `.banned-allowlist` for explicit overrides.
- `.banned-allowlist` (new) -- the override file at the repo root. Format: `path:lineno: pattern-name # justification`.
- `composer.json` -- add `"test:banned": "bash scripts/check_banned_patterns.sh"`.
- `scripts/verify/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-micro.sh` (new) -- per-slice verify.

## Tasks & Acceptance

**Execution:**
- [ ] `scripts/check_banned_patterns.sh` (new, executable, `set -euo pipefail`) -- grep-based linter. Excludes the documented dirs. Reads `.banned-allowlist`. Exits 0 if no violation; exit 1 with file:lineno + matched pattern otherwise. Captures overrides log.
- [ ] `.banned-allowlist` (new) -- empty file at the repo root (no overrides at landing; populated as needed).
- [ ] `composer.json` -- add `"test:banned": "bash scripts/check_banned_patterns.sh"`.
- [ ] `scripts/verify/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-micro.sh` (new) -- per-slice verify.

**Acceptance Criteria:**
- Given `composer test:banned` runs on a clean tree, when the linter completes, then exit 0; `OK: no banned patterns detected`.
- Given a `.php` file contains `🎉`, when the linter runs, then it fails with `file:lineno: matched emoji '🎉' in pattern 'EMOJI_FUNCTIONAL'`.
- Given a `.banned-allowlist` line documents the violation with a justification, when the linter runs, then the match is permitted and logged to the evidence dir.
- Given a `.banned-allowlist` line is malformed, when the linter runs, then it fails with a clear message about the malformed line.
- Given a developer adds a new emoji in `docs/foo.md`, when the linter runs, then it passes (docs is exempt).

## Spec Change Log

<!-- Empty until the first review-loop loopback. -->

## Verification

**Commands:**
- `bash scripts/check_no_raw_hex.sh` -- expected: exit 0 (1.1 contract preserved)
- `bash scripts/check_banned_patterns.sh` -- expected: exit 0
- `bash scripts/verify/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-micro.sh` -- expected: exit 0
- `composer test:banned` -- expected: exit 0
