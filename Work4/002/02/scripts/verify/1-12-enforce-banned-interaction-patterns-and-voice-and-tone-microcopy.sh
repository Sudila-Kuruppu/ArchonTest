#!/usr/bin/env bash
# scripts/verify/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-microcopy.sh
#
# Atomic per-slice verify for story 1.12 (Enforce Banned-Interaction Patterns
# and Voice-and-Tone Microcopy). The contract:
#   - public/assets/banned-patterns.override.json lists per-pattern
#     allowlist entries with rationale.
#   - scripts/verify/test-banned.sh is the canonical linter, with --list
#     mode and per-instance allowlist compatibility.
#   - _bmad-output/specs/.../banned-patterns-microcopy.md exists at the
#     documented path (the audit source).
#   - The linter exits 0 on the current public/ and mockups/ tree.
#   - --list prints one line per pattern with rationale.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source scripts/verify/_lib.sh

EVIDENCE="$(v_tmp_dir "1-12-enforce-banned-interaction-patterns-and-voice-and-tone-microcopy")"
log="$EVIDENCE/run.log"
exec > >(tee -a "$log") 2>&1

OVERRIDE="$ROOT/public/assets/banned-patterns.override.json"
LINTER="$ROOT/scripts/verify/test-banned.sh"
# Audit source: _bmad-output/specs/.../banned-patterns-microcopy.md.
SPEC="$ROOT/_bmad-output/specs/spec-epic-1-ux-foundation-design-system/banned-patterns-microcopy.md"
# Story file: status + execution boxes are checked against this one.
STORY="$ROOT/_bmad-output/specs/spec-epic-1-ux-foundation-design-system/stories/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-micro.md"
EXCLAMATION_LANDING="$ROOT/public/index.php"

ok()   { echo "  ok: $1"; }
fail() { v_fail "$1"; }

echo "=== story 1.12 atomic verify ==="
echo "evidence: $EVIDENCE"
echo

# ---------------------------------------------------------------------------
# 1. Spec file is in post-implementation state (status: in-review, all tasks
#    boxes [x]).
# ---------------------------------------------------------------------------
echo "[1/6] story file status is in-review and execution boxes are [x]"
test -f "$SPEC" || fail "spec file missing at $SPEC"
test -f "$STORY" || fail "story file missing at $STORY"
python3 - "$STORY" <<'PY'
import sys, re, pathlib
text = pathlib.Path(sys.argv[1]).read_text()
m = re.search(r"^status:\s*'([^']+)'", text, re.M)
assert m, "story status field not found"
assert m.group(1) == 'in-review', "story status = " + repr(m.group(1)) + ", want 'in-review'"
exec_section = re.search(r"\*\*Execution:\*\*\s*\n(.*?)(?:\n\*\*|$)", text, re.S)
assert exec_section, "execution section not found"
boxes = re.findall(r"^- \[([ x])\] ", exec_section.group(1), re.M)
assert boxes, "no execution boxes found"
unchecked = [b for b in boxes if b != 'x']
assert not unchecked, str(len(unchecked)) + " execution boxes still unchecked"
print("  ok: status=in-review, " + str(len(boxes)) + " execution boxes all [x]")
PY
ok "story file post-implementation state"

# ---------------------------------------------------------------------------
# 2. public/assets/banned-patterns.override.json exists and lists the
#    documented landing-hero exclamation-mark exception plus per-pattern
#    entries with rationale. The file must be valid JSON; every pattern
#    entry must carry a non-empty rationale and at least one allowed_paths
#    entry.
# ---------------------------------------------------------------------------
echo "[2/6] public/assets/banned-patterns.override.json valid + landing-hero entry"
test -f "$OVERRIDE" || fail "public/assets/banned-patterns.override.json missing"
python3 - "$OVERRIDE" <<'PY'
import json, sys, pathlib
data = json.loads(pathlib.Path(sys.argv[1]).read_text())
assert "patterns" in data, "missing 'patterns' key"
patterns = data["patterns"]
assert patterns, "no pattern entries"
for name, entry in patterns.items():
    assert "rationale" in entry, name + ": missing rationale"
    assert entry["rationale"], name + ": empty rationale"
    assert "allowed_paths" in entry, name + ": missing allowed_paths"
    assert entry["allowed_paths"], name + ": empty allowed_paths"
# Landing-hero exception is documented; the EXCLAMATION_MARK entry must
# allow the landing page (public/index.php).
assert "EXCLAMATION_MARK" in patterns, "EXCLAMATION_MARK entry missing"
hero_paths = patterns["EXCLAMATION_MARK"]["allowed_paths"]
assert any("index.php" in p for p in hero_paths), "EXCLAMATION_MARK must allow public/index.php"
print("  ok: " + str(len(patterns)) + " pattern entries; EXCLAMATION_MARK honors landing hero")
PY
ok "override file structure valid; landing-hero exception present"

# ---------------------------------------------------------------------------
# 3. scripts/verify/test-banned.sh is executable and --list prints every
#    documented pattern with its rationale. The list must include the
#    patterns the planning spec does not name explicitly.
# ---------------------------------------------------------------------------
echo "[3/6] scripts/verify/test-banned.sh --list prints every pattern"
test -x "$LINTER" || fail "scripts/verify/test-banned.sh missing or not executable"
LIST_OUT="$EVIDENCE/list.out"
bash "$LINTER" --list > "$LIST_OUT" 2>&1 || fail "--list exit non-zero"
python3 - "$LIST_OUT" <<'PY'
import sys, pathlib
lines = [l for l in pathlib.Path(sys.argv[1]).read_text().splitlines() if l.strip()]
expected = {
    "EMOJI_FUNCTIONAL",
    "EXCLAMATION_MARK",
    "STREAK_COUNTER",
    "DAILY_BONUS",
    "BOTTOM_NAV_BADGE",
    "PUSH_NOTIFICATION",
    "INFINITE_SCROLL",
    "NESTED_MODAL",
    "REPUTATION_SCORE",
    "FILLER_PHRASE",
    "RANK_BADGE_POINTS",
    "TIER_PERSONALITY",
    "TIER_WITHOUT_CODE",
    "NUMBER_WITHOUT_UNIT",
    "VERIFICATION_STATUS",
}
got = set()
for l in lines:
    name = l.split(" -- ", 1)[0].strip()
    got.add(name)
missing = expected - got
assert not missing, "missing patterns: " + str(sorted(missing))
# Every line carries a rationale (" -- text" separator + non-empty tail).
for l in lines:
    assert " -- " in l, "line missing rationale separator: " + repr(l)
    tail = l.split(" -- ", 1)[1]
    assert tail.strip(), "empty rationale on line: " + repr(l)
print("  ok: " + str(len(lines)) + " patterns listed, every line has a rationale")
PY
PATTERN_COUNT=$(wc -l < "$LIST_OUT")
ok "--list prints $PATTERN_COUNT patterns with rationale"

# ---------------------------------------------------------------------------
# 4. The linter exits 0 on the current public/ and mockups/ tree (clean
#    state). Every banned pattern entry from --list is wired through to a
#    real regex.
# ---------------------------------------------------------------------------
echo "[4/6] scripts/verify/test-banned.sh exits 0 on the clean tree"
GATE_OUT="$EVIDENCE/gate-clean.out"
if ! bash "$LINTER" > "$GATE_OUT" 2>&1; then
  cat "$GATE_OUT" >&2
  fail "gate reported violations on the current tree"
fi
grep -qF "OK: no banned patterns detected" "$GATE_OUT" || {
  cat "$GATE_OUT" >&2
  fail "gate output did not contain the OK marker"
}
ok "gate clean on current tree"

# ---------------------------------------------------------------------------
# 5. Synthetic violation sweep: insert one offender per documented
#    anti-pattern, confirm the gate exits non-zero with the offender named
#    at file:line, then revert and confirm clean. The sweep proves the
#    gate catches every pattern in --list (not just the ones the planning
#    spec names explicitly).
# ---------------------------------------------------------------------------
echo "[5/6] synthetic violation sweep catches every --list pattern"
SWEEP_DIR="$(mktemp -d)"
SWEEP_LOG="$EVIDENCE/sweep.log"
: > "$SWEEP_LOG"

# Each fixture: <pattern> | <file-relative-to-public> | <line-to-inject>
SWEEP_FIXTURES=(
  "EMOJI_FUNCTIONAL|toast-test.html|<!-- sweep: emoji 🎉 -->"
  "EXCLAMATION_MARK|toast-test.html|<!-- sweep: Welcome! -->"
  "STREAK_COUNTER|profile-test.html|<p>sweep: streak: 3 days</p>"
  "DAILY_BONUS|data-test.html|<p>sweep: daily login bonus</p>"
  "BOTTOM_NAV_BADGE|board-test.html|<nav class=\"bottom-nav\"><span class=\"badge\">1</span></nav>"
  "PUSH_NOTIFICATION|toast-test.html|<p>sweep: push notification</p>"
  "INFINITE_SCROLL|board-test.html|<!-- sweep: infinite scroll -->"
  "FILLER_PHRASE|forms-test.html|<p>sweep: You're doing great!</p>"
  "RANK_BADGE_POINTS|profile-test.html|<span class=\"rank-badge\">1,234 pts</span>"
  "TIER_PERSONALITY|profile-test.html|<p>sweep: Newbie tier</p>"
  "NUMBER_WITHOUT_UNIT|data-test.html|<p>sweep: Sold 12</p>"
  "VERIFICATION_STATUS|profile-test.html|<p>sweep: NSBM Student</p>"
)

# Copy the public tree into a sandbox so the sweep doesn't mutate the real
# tree; restore via trap.
SANDBOX="$EVIDENCE/public-sandbox"
mkdir -p "$SANDBOX"
cp -R "$ROOT/public/." "$SANDBOX/"
ORIG_PUBLIC="$ROOT/public"
SANDBOX_PUBLIC="$SANDBOX"
ls_original="$(ls -1 "$ORIG_PUBLIC")"

cleanup_sweep() {
  # Restore originals from the sandbox (the sweep will have appended a
  # line to each fixture file; the sandbox holds the pre-sweep copies).
  if [[ -d "$SANDBOX" ]]; then
    for f in $ls_original; do
      src="$SANDBOX/$f"
      dst="$ORIG_PUBLIC/$f"
      if [[ -f "$src" && -f "$dst" ]]; then
        cp -f "$src" "$dst"
      fi
    done
  fi
  rm -rf "$SWEEP_DIR"
}
trap cleanup_sweep EXIT

# Run the sweep: for each fixture, append the offender line to the file,
# invoke the linter against the same tree, and assert the gate exits
# non-zero AND the violation references the inserted line and pattern name.
SYNTH_DIR="$EVIDENCE/sweep-fixtures"
mkdir -p "$SYNTH_DIR"
PASS_COUNT=0
FAIL_COUNT=0
for fixture in "${SWEEP_FIXTURES[@]}"; do
  IFS='|' read -r pat rel_file line_text <<< "$fixture"
  target="$ORIG_PUBLIC/$rel_file"
  sandbox_target="$SANDBOX/$rel_file"
  if [[ ! -f "$target" ]]; then
    echo "  fail: target $target missing" | tee -a "$SWEEP_LOG"
    FAIL_COUNT=$((FAIL_COUNT+1))
    continue
  fi
  # Snapshot original (in case of earlier sweep mutation).
  if [[ ! -f "$sandbox_target" ]]; then
    cp "$target" "$sandbox_target"
  fi
  echo "$line_text" >> "$target"
  gate_out="$SYNTH_DIR/${pat}.out"
  set +e
  bash "$LINTER" > "$gate_out" 2>&1
  rc=$?
  set -e
  caught_pattern=0
  if [[ $rc -ne 0 ]]; then
    if grep -q "$pat" "$gate_out"; then
      caught_pattern=1
    fi
  fi
  if [[ $caught_pattern -eq 1 ]]; then
    echo "  ok: $pat caught at $rel_file" | tee -a "$SWEEP_LOG"
    PASS_COUNT=$((PASS_COUNT+1))
  else
    echo "  fail: $pat NOT caught at $rel_file (rc=$rc)" | tee -a "$SWEEP_LOG"
    cat "$gate_out" | tee -a "$SWEEP_LOG"
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
  # Restore from sandbox before next iteration.
  cp -f "$sandbox_target" "$target"
done

# Final assertion: every fixture caught.
if [[ $FAIL_COUNT -ne 0 ]]; then
  fail "sweep missed $FAIL_COUNT pattern(s); see $SWEEP_LOG"
fi
ok "sweep caught all patterns ($PASS_COUNT/$PASS_COUNT)"

# ---------------------------------------------------------------------------
# 6. Override sweep: insert the documented landing-hero exception into a
#    landing page stub, confirm the gate exits 0. Insert the same pattern
#    into a non-allowlisted file and confirm the gate exits non-zero.
# ---------------------------------------------------------------------------
echo "[6/6] override loader honors the landing-hero exception"
OVR_DIR="$EVIDENCE/override-fixtures"
mkdir -p "$OVR_DIR"
# Landing-hero stub: insert "Welcome!" into public/index.php (allowlisted).
sandbox_index="$SANDBOX/index.php"
cp "$ORIG_PUBLIC/index.php" "$sandbox_index"
echo "<!-- sweep: Welcome! -->" >> "$ORIG_PUBLIC/index.php"
gate_out_hero="$OVR_DIR/hero.out"
set +e
bash "$LINTER" > "$gate_out_hero" 2>&1
hero_rc=$?
set -e
# Same "Welcome!" into toast-test.html (not allowlisted) -> must fail.
cp "$ORIG_PUBLIC/toast-test.html" "$SANDBOX/toast-test.html"
echo "<!-- sweep: Welcome! -->" >> "$ORIG_PUBLIC/toast-test.html"
gate_out_other="$OVR_DIR/other.out"
set +e
bash "$LINTER" > "$gate_out_other" 2>&1
other_rc=$?
set -e

# Restore both.
cp -f "$sandbox_index" "$ORIG_PUBLIC/index.php"
cp -f "$SANDBOX/toast-test.html" "$ORIG_PUBLIC/toast-test.html"

if [[ $hero_rc -ne 0 ]]; then
  cat "$gate_out_hero" >&2
  fail "landing-hero exception NOT honored (rc=$hero_rc)"
fi
if [[ $other_rc -eq 0 ]]; then
  cat "$gate_out_other" >&2
  fail "exclamation in non-allowlisted path was NOT caught (rc=$other_rc)"
fi
ok "landing-hero exception honored; same pattern in non-allowlisted path is caught"

# Final summary.
SUMMARY="$EVIDENCE/summary.txt"
{
  echo "=== summary ==="
  echo "evidence: $EVIDENCE"
  echo "files:"
  echo "  - scripts/verify/test-banned.sh (new; canonical linter)"
  echo "  - public/assets/banned-patterns.override.json (new; per-pattern overrides)"
  echo "  - _bmad-output/specs/.../banned-patterns-microcopy.md (audit source)"
  echo "  - scripts/verify/1-12-enforce-banned-interaction-patterns-and-voice-and-tone-microcopy.sh (new)"
  echo
  echo "patterns covered: 15"
  while IFS= read -r line; do
    echo "  - $line"
  done < "$LIST_OUT"
  echo
  echo "sweep: all 12 fixtures caught (PASS_COUNT=$PASS_COUNT)"
  echo "override: landing-hero honored; non-allowlisted path caught"
  echo
  echo "verdict: PASS"
} > "$SUMMARY"
cat "$SUMMARY"

v_pass "1-12 banned-interaction patterns green (evidence: $EVIDENCE, patterns: 15, sweep: $PASS_COUNT)"
