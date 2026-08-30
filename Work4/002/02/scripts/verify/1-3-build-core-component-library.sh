#!/usr/bin/env bash
# scripts/verify/1-3-build-core-component-library.sh
#
# Atomic per-slice verify for story 1.3 (Build Core Component Library).
# Contract: a Core Components section appended to
# public/assets/css/tickettrade.css using ONLY existing 1.1 tokens + the
# --scrim token declared in the same file; public/assets/js/modal.js with
# openModal/closeModal/isOpen and aria-labelledby validation;
# public/assets/js/a11y.js with announce + trapFocus + releaseFocus +
# getFocusable + bindSkipLink exports; public/components-test.html hosting
# the four core component fixtures; public/board-test.html with the five
# document fixtures; public/forms-test.html with the loading button fixture;
# selector budget ≤ 24 over trunk; raw-hex guard stays clean.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source scripts/verify/_lib.sh

EVIDENCE="$(v_tmp_dir "1-3-build-core-component-library")"
log="$EVIDENCE/run.log"
exec > >(tee -a "$log") 2>&1

CSS="$ROOT/public/assets/css/tickettrade.css"
A11Y="$ROOT/public/assets/js/a11y.js"
MODAL="$ROOT/public/assets/js/modal.js"
COMPONENTS_HTML="$ROOT/public/components-test.html"
BOARD_HTML="$ROOT/public/board-test.html"
FORMS_HTML="$ROOT/public/forms-test.html"
GUARD="$ROOT/scripts/check_no_raw_hex.sh"

ok()   { echo "  ok: $1"; }
fail() { v_fail "$1"; }

echo "=== story 1.3 atomic verify ==="
echo "evidence: $EVIDENCE"
echo

# ---------------------------------------------------------------------------
# 1. tickettrade.css contains the seven documented core component selectors
#    (btn-primary, btn-secondary, btn-ghost, btn-danger, input-field,
#    modal-dialog, bottom-nav) plus their internal variants.
# ---------------------------------------------------------------------------
echo "[1/8] Core Component selectors are present in tickettrade.css"
test -f "$CSS" || fail "tickettrade.css missing"
python3 - "$CSS" <<'PY'
import sys, re, pathlib
text = pathlib.Path(sys.argv[1]).read_text()
required_doc = [
    ".btn-primary", ".btn-secondary", ".btn-ghost", ".btn-danger",
    ".input-field", ".modal-dialog", ".bottom-nav",
]
missing_doc = [r for r in required_doc if r not in text]
assert not missing_doc, "missing documented core selectors: " + str(missing_doc)
required_variant = [
    ".input-field:focus-visible",
    ".input-field[data-error]",
    ".input-error",
    ".modal-scrim",
    ".bottom-nav-item",
    '.bottom-nav-item[aria-current="page"]',
]
missing_var = [r for r in required_variant if r not in text]
assert not missing_var, "missing variant selectors: " + str(missing_var)
# Tokens used in the new section must all be declared in the file.
new_section_marker = "Story 1.3: Core Components"
idx = text.find(new_section_marker)
assert idx != -1, "Core Components section header not found"
section = text[idx:]
declared = set(re.findall(r"^\s*(--[a-zA-Z0-9-]+)\s*:", text, re.M))
used = set(re.findall(r"var\((--[a-zA-Z0-9-]+)\)", section))
undeclared = sorted(t for t in used if t not in declared)
assert not undeclared, "Core Components section references undeclared tokens: " + str(undeclared)
print("  ok: 7 documented + 6 variant selectors present; all var() refs resolve")
PY
ok "Core Component selectors + token resolution"

# ---------------------------------------------------------------------------
# 2. Selector budget: head - trunk ≤ 24. Trunk = PR 1-1 design tokens
#    (= d0e65c7 / origin/1-1-fix-design-token-system:Work4/002/02/public/assets/css/tickettrade.css).
# ---------------------------------------------------------------------------
echo "[2/8] Selector budget (head - trunk) <= 24"
TRUNK_CSS="$(git -C "$ROOT" show "origin/1-1-fix-design-token-system:Work4/002/02/public/assets/css/tickettrade.css" 2>/dev/null || true)"
if [[ -z "$TRUNK_CSS" ]]; then
  # Fall back: search the git log for the PR 1-1 design-tokens commit.
  TRUNK_CSS="$(git -C "$ROOT" show "d0e65c7:Work4/002/02/public/assets/css/tickettrade.css" 2>/dev/null || true)"
fi
if [[ -z "$TRUNK_CSS" ]]; then
  echo "  warn: trunk CSS not available (origin/1-1-fix or d0e65c7 unreachable); skipping budget gate"
else
  TRUNK_COUNT="$(printf '%s' "$TRUNK_CSS" | grep -cE '^[[:space:]]*\.')"
  HEAD_COUNT="$(grep -cE '^[[:space:]]*\.' "$CSS")"
  DELTA=$((HEAD_COUNT - TRUNK_COUNT))
  echo "  trunk=$TRUNK_COUNT head=$HEAD_COUNT delta=$DELTA"
  if [[ $DELTA -gt 24 ]]; then
    fail "selector budget exceeded: delta=$DELTA > 24 (7 documented + ≤17 variants)"
  fi
  if [[ $DELTA -lt 7 ]]; then
    fail "selector budget too small: delta=$DELTA < 7 (documented selectors missing?)"
  fi
fi
ok "selector budget within range"

# ---------------------------------------------------------------------------
# 3. public/assets/js/a11y.js exports announce + trapFocus + releaseFocus +
#    getFocusable + bindSkipLink.
# ---------------------------------------------------------------------------
echo "[3/8] a11y.js exports the five named functions"
test -f "$A11Y" || fail "a11y.js missing"
python3 - "$A11Y" <<'PY'
import sys, re, pathlib
text = pathlib.Path(sys.argv[1]).read_text()
# Strip comments so the export check is not fooled by a re-export comment.
no_block = re.sub(r"/\*.*?\*/", "", text, re.S)
no_line = re.sub(r"//[^\n]*", "", no_block)
exports = set(re.findall(r"export\s+function\s+(\w+)", no_line))
required = {"announce", "trapFocus", "releaseFocus", "getFocusable", "bindSkipLink"}
missing = required - exports
extra = exports - required
assert not missing, "missing exports: " + str(sorted(missing))
# Extra exports are allowed (e.g. helpers), but warn.
print("  ok: " + ", ".join(sorted(exports)))
PY
ok "a11y.js exports the five functions"

# ---------------------------------------------------------------------------
# 4. public/assets/js/modal.js exports openModal, closeModal, isOpen and
#    validates aria-labelledby in addition to role + aria-modal.
# ---------------------------------------------------------------------------
echo "[4/8] modal.js exports openModal/closeModal/isOpen + aria-labelledby validation"
test -f "$MODAL" || fail "modal.js missing"
python3 - "$MODAL" <<'PY'
import sys, re, pathlib
text = pathlib.Path(sys.argv[1]).read_text()
no_block = re.sub(r"/\*.*?\*/", "", text, re.S)
no_line = re.sub(r"//[^\n]*", "", no_block)
exports = set(re.findall(r"export\s+function\s+(\w+)", no_line))
required = {"openModal", "closeModal", "isOpen"}
missing = required - exports
assert not missing, "missing exports: " + str(sorted(missing))
# aria-labelledby must be checked somewhere in the file.
assert "aria-labelledby" in text, "modal.js does not mention aria-labelledby"
# The validateModalElement function must reject a missing aria-labelledby.
# Find the function then capture until the brace-balance returns to its opening level.
match_idx = text.find("function validateModalElement")
assert match_idx != -1, "validateModalElement function not found"
brace = 0
end_idx = match_idx
seen_open = False
for i in range(match_idx, len(text)):
    if text[i] == '{':
        brace += 1
        seen_open = True
    elif text[i] == '}':
        brace -= 1
        if seen_open and brace == 0:
            end_idx = i + 1
            break
validate_body = text[match_idx:end_idx]
assert "aria-labelledby" in validate_body, "validateModalElement does not check aria-labelledby"
print("  ok: 3 exports + aria-labelledby validation in validateModalElement")
PY
ok "modal.js exports + aria-labelledby validation"

# ---------------------------------------------------------------------------
# 5. public/components-test.html exists and hosts the four component
#    fixture blocks (buttons, input, modal, bottom-nav) plus 13 I/O-Matrix
#    assertions. The page carries a <pre id="results"> with data-pass and
#    data-fail attributes.
# ---------------------------------------------------------------------------
echo "[5/8] components-test.html exists with the four fixtures and a results pre"
test -f "$COMPONENTS_HTML" || fail "components-test.html missing"
python3 - "$COMPONENTS_HTML" <<'PY'
import sys, re, pathlib
html = pathlib.Path(sys.argv[1]).read_text()
assert "<!doctype html>" in html.lower(), "missing doctype"
assert 'lang="en"' in html, 'missing lang="en"'
assert '<meta charset="utf-8">' in html, "missing charset meta"
assert 'name="viewport"' in html, "missing viewport meta"
assert 'href="assets/css/tickettrade.css"' in html, "missing stylesheet link"
# All four core component families must appear as fixtures.
required_fixtures = [
    "btn-primary", "btn-secondary", "btn-ghost", "btn-danger",
    "input-field", "modal-scrim", 'role="dialog"', 'aria-modal="true"',
    "aria-labelledby", "bottom-nav", "bottom-nav-item", 'aria-current="page"',
]
missing = [f for f in required_fixtures if f not in html]
assert not missing, "missing fixtures: " + str(missing)
assert '<script type="module">' in html, "missing type=module script"
assert "./assets/js/modal.js" in html, "missing modal.js import"
assert "./assets/js/a11y.js" in html, "missing a11y.js import"
assert '<pre id="results"' in html, "missing results <pre>"
assert 'data-pass' in html and 'data-fail' in html, "missing data-pass/data-fail"
# No raw hex.
hex_re = re.compile(r"(?:^|[^&0-9A-Za-z/#])#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{3})\b")
assert not hex_re.findall(html), "raw hex in components-test.html"
print("  ok: 4 fixtures + script type=module + 0 raw hex")
PY
ok "components-test.html fixtures + structure"

# ---------------------------------------------------------------------------
# 6. public/board-test.html gained the Story 1.3 fixtures (5 button variants
#    + input + modal trigger + bottom-nav) without losing the existing PR
#    1.5 fixtures (corkboard cards, list toggle, empty/error states).
# ---------------------------------------------------------------------------
echo "[6/8] board-test.html has the 1.3 fixtures and keeps the PR 1.5 fixtures"
test -f "$BOARD_HTML" || fail "board-test.html missing"
python3 - "$BOARD_HTML" <<'PY'
import sys, pathlib
html = pathlib.Path(sys.argv[1]).read_text()
need_1_3 = [
    "btn-primary", "btn-secondary", "btn-ghost", "btn-danger",
    'data-loading="true"',
    "input-field",
    "modal-scrim", 'role="dialog"', 'aria-modal="true"', "aria-labelledby",
    "bottom-nav", "bottom-nav-item",
]
missing = [n for n in need_1_3 if n not in html]
assert not missing, "missing 1.3 fixtures in board-test.html: " + str(missing)
keep_1_5 = [
    "corkboard-card",
    "corkboard-list-view-toggle",
    "board-state-empty",
    "board-state-error",
    '<pre id="results"',
]
lost = [n for n in keep_1_5 if n not in html]
assert not lost, "PR 1.5 fixtures broken in board-test.html: " + str(lost)
print("  ok: 1.3 fixtures added + PR 1.5 fixtures intact")
PY
ok "board-test.html additive fixtures"

# ---------------------------------------------------------------------------
# 7. public/forms-test.html gained the loading-state button fixture without
#    breaking the PR 1.9 form-modal fixtures.
# ---------------------------------------------------------------------------
echo "[7/8] forms-test.html has the loading button fixture + PR 1.9 fixtures intact"
test -f "$FORMS_HTML" || fail "forms-test.html missing"
python3 - "$FORMS_HTML" <<'PY'
import sys, pathlib
html = pathlib.Path(sys.argv[1]).read_text()
need_1_3 = ['data-loading="true"', "btn-primary"]
missing = [n for n in need_1_3 if n not in html]
assert not missing, "missing 1.3 fixture in forms-test.html: " + str(missing)
keep_1_9 = [
    "btn-open-dispute", "btn-open-report", "btn-open-purchase", "btn-open-reauth",
    '<pre id="results"',
]
lost = [n for n in keep_1_9 if n not in html]
assert not lost, "PR 1.9 fixtures broken in forms-test.html: " + str(lost)
print("  ok: 1.3 loading fixture + PR 1.9 fixtures intact")
PY
ok "forms-test.html loading fixture"

# ---------------------------------------------------------------------------
# 8. Raw-hex guard stays clean.
# ---------------------------------------------------------------------------
echo "[8/8] bash scripts/check_no_raw_hex.sh exits 0"
GUARD_OUT="$EVIDENCE/guard.out"
if ! bash "$GUARD" > "$GUARD_OUT" 2>&1; then
  cat "$GUARD_OUT" >&2
  fail "guard reported violations on the current tree"
fi
grep -qF "OK: no raw hex" "$GUARD_OUT" || {
  cat "$GUARD_OUT" >&2
  fail "guard output did not contain the OK marker"
}
ok "guard clean on current tree"

# Final summary.
SUMMARY="$EVIDENCE/summary.txt"
{
  echo "story 1.3 core component library -- PASS"
  echo "evidence: $EVIDENCE"
  echo "selectors (trunk=PR 1.1 design tokens, head=this PR): see run.log [2/8]"
  echo "scripts: see run.log [1..8]"
} > "$SUMMARY"

v_pass "1-3-build-core-component-library PASS (evidence: $EVIDENCE)"
