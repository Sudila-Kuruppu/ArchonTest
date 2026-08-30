# Banned Patterns & Voice/Tone Microcopy

Companion to SPEC-epic-1-ux-foundation-design-system, supporting **CAP-6**. The implementation contract for this capability is the `composer test:banned` linter; the rule list below is what the linter greps for. Voice and tone are the audit checklist when the linter is silent.

## Banned patterns (linter grep targets)

The linter fails any PR introducing any of these without an explicit override. Each pattern is a code-level or copy-level signal that the chrome has drifted from the spec.

| Pattern | Why banned |
|---|---|
| Emoji in functional UI copy (any non-ASCII emoji in `.php`, `.html`, `.js`, or `.md` except `/docs/` and `/mockups/`) | Trust signals read as honest only when the chrome doesn't carry decoration. |
| Streak counters — strings like `streak`, `day streak`, `login streak` shown to the user | The PRD-stored 7-day and 30-day streak bonuses exist as anti-farming mechanics, not as visible counters. |
| Daily-login-bonus displays — strings like `daily bonus`, `daily reward`, `+X today` on login surfaces | Same reason. Bonuses exist server-side; they are not a UI reward. |
| Badge counts on the bottom nav (numeric overlays on bottom-nav items) | Five clean items is the rule; counts invite farming behavior. |
| Push notification strings — `notification`, `notif`, `push` in any user-facing template | Campus-only, no notification channel exists. |
| Infinite scroll markers — strings or classes like `infinite-scroll`, `IntersectionObserver` in board / lists | Lists are paginated for accessibility and predictability. |
| Nested modal markers — `modal-dialog` inside another `modal-dialog` | One modal level maximum per the constraint. |
| Algorithmic-reputation-score markers — `reputation_score`, `trust_score`, `credibility` outside admin-only contexts | Trust signals are listed (verified, rank, rating + count, dispute count), not aggregated into a hidden number. |
| Encouragement filler phrases — `You're doing great!`, `Way to go!`, `Keep it up!`, `Awesome!`, `🎉` | Empty results / errors are factual, not celebratory. |
| Numeric points total on the rank badge | Tier name only; never `1,234 pts`. |
| Streak / combo language — `combo`, `multiplier x2`, `hot streak` | Same reason as streak counters. |

## Voice-and-tone microcopy rules

- **Toast messages** read like `Ticket created. Code: TK-...`, not `🎉 Your purchase is complete!`. Short complete sentences with a period at the end.
- **No exclamation marks in functional copy** — the landing hero is excepted; everywhere else (toasts, modals, empty states, error states, button text), exclamation marks are banned.
- **Tier names pair with tier codes on first reference**: `Recruit (E)`, `Rookie (D)`, `Operative (C)`, `Specialist (B)`, `Elite (A)`, `Legend (S)`. Subsequent references may use either form, but first reference is locked.
- **Dispute counts use `N disputes on record`** — never `N complaints` or `N issues`. The factual framing is the brand.
- **Purchase confirmation body always includes `a reservation, not payment`** — never `pay now` or `complete your purchase`. The simulation-only nature of the transaction is never obscured.
- **Rank tier names are tier names**, not personality descriptors. `Recruit`, `Rookie`, `Operative`, `Specialist`, `Elite`, `Legend` — not `Newbie`, `Pro`, `Master`.
- **Numbers carry units.** `Sold 12` without the unit is forbidden; always `12 sales`, `12 listings`, `12 reviews`. The product never shows a number without context.
- **Trust signals are listed together** so the reader can weigh them: `Verified`, `Rank`, `Rating + count`, `Dispute count`. Never as a single aggregated score.
- **"Verified Student" is the only allowed verification status language.** Not `NSBM Student`, not `Official Account`, not `✓ Student`.

## Linter implementation contract

- **`composer test:banned`** runs a grep suite over `src/`, `public/`, `mockups/`, and `docs/` (excluding `docs/OKF_BUNDLE.md` and the `_bmad-output/` planning tree).
- Any match fails the check with a `file:line` reference.
- An explicit override file (`.banned-overrides.json`) lists approved exceptions with a reason; the override is reviewed on every PR.
- The linter is wired in Story 1.12; the rule list above is the source of truth for what it greps.

## Adoption by later epics

Every later epic that writes user-facing copy inherits this contract. CAP-6 is the contract; an epic that ships banned copy doesn't ship. Story 1.12 enforces the linter against Epic 1's static assets; the same linter is re-run in epics 2-8 against their feature-specific copy.
