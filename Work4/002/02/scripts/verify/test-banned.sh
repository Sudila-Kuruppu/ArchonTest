#!/usr/bin/env bash
# scripts/verify/test-banned.sh (rewrite)
#
# Pure-shell implementation: uses grep -P for the scan, jq + grep to apply
# per-pattern overrides from public/assets/banned-patterns.override.json, and
# the legacy .banned-allowlist for per-instance overrides. The python
# implementation is kept at scripts/verify/test-banned.py for environments
# without grep -P / jq.
#
# Wired: composer test:banned -> bash scripts/verify/test-banned.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------------------
# Argument parsing.
# ---------------------------------------------------------------------------
LIST_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --list) LIST_ONLY=1 ;;
    --help|-h)
      cat <<USAGE
Usage:
  bash scripts/verify/test-banned.sh            # run the gate (exit 1 on violation)
  bash scripts/verify/test-banned.sh --list     # print every pattern with rationale
  bash scripts/verify/test-banned.sh --help    # this help
USAGE
      exit 0 ;;
    *) echo "FAIL: unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Pattern catalog. Name<tab>rationale<tab>extensions<tab>pcre-pattern.
# Single source of truth for both --list and the gate.
# ---------------------------------------------------------------------------
PATTERNS_TSV="$(mktemp)"
MATCHES_TXT=""
OVERRIDE_PATHS_TXT=""
trap 'rm -f "$PATTERNS_TSV" "${MATCHES_TXT:-}" "${OVERRIDE_PATHS_TXT:-}"' EXIT

cat > "$PATTERNS_TSV" <<'PATTERNS_EOF'
EMOJI_FUNCTIONAL	Non-ASCII emoji in user-facing chrome. Trust signals read as honest only when the chrome does not carry decoration.	php,html,js,md	[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]
EXCLAMATION_MARK	Exclamation marks in functional copy. The landing-hero block is the documented exception; everywhere else (toasts, modals, empty states, error states, button text) they are banned.	php,html,js	!(?=[\s.,;)\]}>\'\"<]|$)
STREAK_COUNTER	Streak counters (streak, day streak, login streak, hot streak, combo, multiplier xN) shown to the user. The PRD-stored 7-day and 30-day streak bonuses exist as anti-farming mechanics, not as visible counters.	php,html,js	(?i:\b(?:day\s+streak|login\s+streak|hot\s+streak)\b|\bstreak\b|\bcombo\b|\bmultiplier\s*x\d+\b|\bstreak\s*:)
DAILY_BONUS	Daily-login-bonus displays (daily bonus, daily reward, daily login bonus). Bonuses exist server-side; they are not a UI reward.	php,html,js	(?i:\b(?:daily\s+bonus|daily\s+reward|daily\s+login\s+bonus)\b)
BOTTOM_NAV_BADGE	Badge counts on the bottom nav. Five clean items is the rule; counts invite farming behavior.	html	(?is:bottom[-_]?nav[^>]*>[^<]*<\s*span[^>]*badge[^>]*>\s*\d+\s*<\s*/\s*span\s*>)
PUSH_NOTIFICATION	Push notification strings in user-facing templates. Campus-only; no notification channel exists. The in-page toast dismiss button aria-label is the one documented exception.	php,html,js	(?i:\b(?:notification|notif)\b|\bpush\s+(?:notification|notif|message|alert)\b|push[-_]notif|browser\s+push|web\s+push)
INFINITE_SCROLL	Infinite-scroll markers (infinite-scroll, infinite scroll, IntersectionObserver). Lists are paginated for accessibility and predictability.	js,html	(?i:\b(?:infinite\s*[-_]?\s*scroll|IntersectionObserver)\b)
NESTED_MODAL	Nested modal markers (modal-dialog inside another modal-dialog). One modal level maximum.	html,js	(?is:<\s*[^>]*modal[-_]?dialog[^>]*>.*<\s*[^>]*modal[-_]?dialog)
REPUTATION_SCORE	Algorithmic-reputation-score markers (reputation_score, trust_score, credibility) outside admin-only contexts. Trust signals are listed, not aggregated into a hidden number.	php,html,js	(?<![A-Za-z0-9])(?:reputation_score|trust_score|credibility)(?![A-Za-z0-9])
FILLER_PHRASE	Encouragement filler phrases (You are doing great!, Way to go!, Keep it up!, Awesome!). Empty results / errors are factual, not celebratory.	php,html,js	(?:You(?:\'| a)re doing great!|Way to go!|Keep it up!|Awesome!)
RANK_BADGE_POINTS	Numeric points total on the rank badge. Tier name only; never 1,234 pts.	php,html,js	(?is:\b(?:rank|tier)[-_]?badge\b.{0,80}?\b(?:\d{1,3}(?:,\d{3})*|\d{4,})\s*(?:pts?|points?))
TIER_PERSONALITY	Personality-descriptor tier names (Newbie, Pro, Master, Expert, Guru, Ninja, Legendary). Never allowed; spec ranks use Recruit (E), Rookie (D), Operative (C), Specialist (B), Elite (A), Legend (S).	php,html,js	(?i:\b(?:Newbie|Pro|Master|Expert|Guru|Ninja|Legendary)\b)
TIER_WITHOUT_CODE	Spec tier names used without their code (e.g. `Elite` instead of `Elite (A)`). First reference in user-facing copy must pair with the tier code.	php,html,js	\b(?:Elite|Recruit|Rookie|Operative|Specialist|Legend)\b(?!\s*\([EDCBAS]\))
NUMBER_WITHOUT_UNIT	A bare number (N or N,NNN) presented without its unit (sales/listings/reviews/etc.). The product never shows a number without context.	php,html,js	(?i:(?:sold|bought|viewing|listing|review|item|rating|score)\s+\d{1,3}(?:,\d{3})*\b(?!\s*(?:sales|listings|reviews|points|views|items|ratings)))
VERIFICATION_STATUS	Verification status strings other than `Verified Student`. `NSBM Student`, `Official Account`, etc. are forbidden. The voice-and-tone spec locks `Verified Student` as the only allowed status.	php,html,js	(?i:\b(?:NSBM\s+Student|Official\s+Account|Verified\s+Buyer|Verified\s+Seller|Verified\s+User)\b)
PATTERNS_EOF

# ---------------------------------------------------------------------------
# --list mode.
# ---------------------------------------------------------------------------
if [[ "$LIST_ONLY" -eq 1 ]]; then
  awk -F'\t' 'NF==4 && $1 !~ /^#/ { printf "%s -- %s\n", $1, $2 }' "$PATTERNS_TSV"
  exit 0
fi

# ---------------------------------------------------------------------------
# Build combined PCRE alternation for grep -P.
# ---------------------------------------------------------------------------
COMBINED="$(awk -F'\t' 'NF==4 && $1 !~ /^#/ { printf "%s|", $4 }' "$PATTERNS_TSV" | sed 's/|$//')"

# ---------------------------------------------------------------------------
# Override loader. Reads public/assets/banned-patterns.override.json via jq,
# emits one line per pattern+path:  <PATTERN_NAME><TAB><ABSOLUTE_PATH>
# These match any file under <ABSOLUTE_PATH>.
# ---------------------------------------------------------------------------
JSON_OVERRIDE="$ROOT/public/assets/banned-patterns.override.json"
OVERRIDE_PATHS_TXT="$(mktemp)"
if [[ -f "$JSON_OVERRIDE" ]]; then
  jq -r --arg root "$ROOT" '
    .patterns // {} | to_entries[] |
    .key as $pat | .value.allowed_paths[]? |
    sub("^/"; "") |
    if startswith($root + "/") then sub("^" + $root + "/"; "") else . end |
    [$pat, .] | @tsv
  ' "$JSON_OVERRIDE" > "$OVERRIDE_PATHS_TXT" 2>/dev/null || true
fi

# Per-instance allowlist from .banned-allowlist at the repo root.
LEGACY_ALLOWLIST="$ROOT/.banned-allowlist"
INSTANCE_OVERRIDES_FILE="$(mktemp)"
if [[ -f "$LEGACY_ALLOWLIST" ]]; then
  grep -E '^[^[:space:]]+:[0-9]+:[[:space:]]+[A-Za-z0-9_]+[[:space:]]+#' "$LEGACY_ALLOWLIST" > "$INSTANCE_OVERRIDES_FILE" || true
fi

# ---------------------------------------------------------------------------
# Phase 1: scan via grep -P (PCRE2). The output format is
#   <relative-path>:<lineno>:<content>
# Grep is configured to suppress output from _bmad-output and other excluded
# dirs via --exclude-dir flags.
# ---------------------------------------------------------------------------
MATCHES_TXT="$(mktemp)"

# Run grep -P; allow exit 1 (no matches).
set +e
grep -rPn \
  --include='*.php' --include='*.html' --include='*.js' --include='*.md' \
  --exclude-dir='_bmad-output' --exclude-dir='_bmad' --exclude-dir='vendor' \
  --exclude-dir='node_modules' --exclude-dir='archive' --exclude-dir='.git' \
  --exclude-dir='.agents' --exclude-dir='.opencode' \
  --exclude-dir='verification_evidence' --exclude-dir='docs' \
  --exclude-dir='admin' \
  "$COMBINED" public mockups > "$MATCHES_TXT" 2>/dev/null
GREP_RC=$?
set -e

if [[ "$GREP_RC" -gt 1 ]]; then
  echo "FAIL: grep -P exited $GREP_RC" >&2
  exit 2
fi

# ---------------------------------------------------------------------------
# Phase 2: classify each match against the per-pattern regex and apply
# overrides. We don't know which of the 15 patterns produced a given match,
# so we re-run each pattern's regex against the match line. The per-pattern
# extensions filter cuts this to a small set in practice.
# ---------------------------------------------------------------------------
APPLIED_LOG="$ROOT/.test-banned-applied.tmp"
: > "$APPLIED_LOG"

VIOLATIONS_LINES=()
while IFS=: read -r match_path match_lineno match_rest; do
  # Strip leading "./" if present
  match_path="${match_path#./}"
  # Filename might have a ":" — assume the first field is path, the second is
  # numeric (lineno), the rest is content.
  ext="${match_path##*.}"
  ext="${ext,,}"
  # Collect every pattern that matches the line so a single offender can
  # produce one violation per matching pattern (e.g. "You\'re doing great!"
  # matches both FILLER_PHRASE and EXCLAMATION_MARK).
  matched_names=()
  while IFS=$'\t' read -r pat_name pat_rationale pat_exts pat_regex; do
    [[ -z "$pat_name" ]] && continue
    case ",$pat_exts," in
      *,"$ext,"*) ;;
      *) continue ;;
    esac
    if printf '%s' "$match_rest" | grep -P -q -- "$pat_regex" 2>/dev/null; then
      matched_names+=("$pat_name")
    fi
  done < "$PATTERNS_TSV"
  if [[ ${#matched_names[@]} -eq 0 ]]; then
    VIOLATIONS_LINES+=("$match_path:$match_lineno: UNKNOWN -- $match_rest")
    continue
  fi
  # Emit one violation per matching pattern that is not overridden. If
  # all matches are overridden we log them as applied (so the gate
  # records the override honour on a per-pattern basis).
  any_appended=0
  for matched_name in "${matched_names[@]}"; do
    skip=0
    while IFS=$'\t' read -r ov_pat ov_path; do
      [[ -z "$ov_pat" ]] && continue
      if [[ "$ov_pat" == "$matched_name" ]]; then
        case "$match_path" in
          "$ov_path"/*|"$ov_path")
            skip=1
            break ;;
        esac
      fi
    done < "$OVERRIDE_PATHS_TXT"
    if [[ $skip -eq 1 ]]; then
      echo "$match_path:$match_lineno: $matched_name -- $match_rest" >> "$APPLIED_LOG"
      continue
    fi
    if [[ -s "$INSTANCE_OVERRIDES_FILE" ]]; then
      if grep -qF "$match_path:$match_lineno: $matched_name" "$INSTANCE_OVERRIDES_FILE"; then
        echo "$match_path:$match_lineno: $matched_name -- $match_rest" >> "$APPLIED_LOG"
        continue
      fi
    fi
    VIOLATIONS_LINES+=("$match_path:$match_lineno: $matched_name -- $match_rest")
    any_appended=1
  done
  [[ $any_appended -eq 0 ]] && true  # all matched patterns were overridden; nothing to add
done < "$MATCHES_TXT"

# ---------------------------------------------------------------------------
# Phase 3: emit results.
# ---------------------------------------------------------------------------
if [[ ${#VIOLATIONS_LINES[@]} -eq 0 ]]; then
  echo "OK: no banned patterns detected"
  applied_count=$(wc -l < "$APPLIED_LOG" 2>/dev/null || echo 0)
  if [[ "$applied_count" -gt 0 ]]; then
    echo "      overrides applied ($applied_count):"
    cat "$APPLIED_LOG"
  fi
  rm -f "$APPLIED_LOG"
  exit 0
fi

echo "FAIL: ${#VIOLATIONS_LINES[@]} banned pattern violation(s) found:" >&2
for v in "${VIOLATIONS_LINES[@]}"; do
  echo "  $v" >&2
done
echo >&2
echo "      Per-pattern overrides: $JSON_OVERRIDE" >&2
echo "      Per-instance overrides: $LEGACY_ALLOWLIST" >&2
exit 1
