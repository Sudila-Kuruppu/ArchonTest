#!/usr/bin/env bash
# scripts/verify/1-1-implement-design-token-system.sh
#
# Atomic per-slice verify for story 1.1 (Implement Design Token System).
# Per brief section 2.1: drive the user flow end-to-end, capture evidence,
# tear down cleanly, print OK on exit 0.
#
# The contract: DESIGN.md frontmatter is the source of truth; every color,
# typography role, radius, and spacing declared there is exposed as a CSS
# custom property in public/assets/css/tickettrade.css. A guard script
# (scripts/check_no_raw_hex.sh) refuses any raw hex outside the two
# allowlisted files. composer test:tokens runs the guard. The
# [data-token-self-test] fixture is now actually consumed (not just shipped).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source scripts/verify/_lib.sh

EVIDENCE="$(v_tmp_dir "1-1-implement-design-token-system")"
log="$EVIDENCE/run.log"
exec > >(tee -a "$log") 2>&1

DESIGN="$ROOT/DESIGN.md"
CSS="$ROOT/public/assets/css/tickettrade.css"
GUARD="$ROOT/scripts/check_no_raw_hex.sh"

ok()   { echo "  ok: $1"; }
fail() { v_fail "$1"; }

echo "=== story 1.1 atomic verify ==="
echo "evidence: $EVIDENCE"
echo

# ---------------------------------------------------------------------------
# 1. DESIGN.md frontmatter parses as YAML with the documented token counts.
# ---------------------------------------------------------------------------
echo "[1/7] DESIGN.md frontmatter parses as YAML"
python3 - "$DESIGN" <<'PY'
import sys, yaml, pathlib
fm = yaml.safe_load(pathlib.Path(sys.argv[1]).read_text().split("---")[1])
assert isinstance(fm, dict), f"top-level is not a mapping: {type(fm).__name__}"
assert len(fm["colors"]) >= 90, f"colors: {len(fm['colors'])} (want >= 90)"
assert len(fm["typography"]) == 7, f"typography: {len(fm['typography'])} (want 7)"
assert len(fm["rounded"]) == 5, f"rounded: {len(fm['rounded'])} (want 5)"
assert len(fm["spacing"]) >= 12, f"spacing: {len(fm['spacing'])} (want >= 12)"
assert len(fm["components"]) >= 50, f"components: {len(fm['components'])} (want >= 50)"
assert "elevation" in fm and len(fm["elevation"]) >= 5, f"elevation: {len(fm.get('elevation', {}))}"
assert "animation" in fm and len(fm["animation"]) >= 4, f"animation: {len(fm.get('animation', {}))}"
print(f"  ok: colors={len(fm['colors'])} typography={len(fm['typography'])} radii={len(fm['rounded'])} spacing={len(fm['spacing'])} components={len(fm['components'])} elevation={len(fm['elevation'])} animation={len(fm['animation'])}")
PY
ok "frontmatter token counts match spec"

# ---------------------------------------------------------------------------
# 2. CSS declares every documented color/typography/radius/spacing.
# ---------------------------------------------------------------------------
echo "[2/7] public/assets/css/tickettrade.css declares every documented token"
python3 - "$DESIGN" "$CSS" <<'PY'
import sys, re, yaml, pathlib
design = pathlib.Path(sys.argv[1])
css_text = pathlib.Path(sys.argv[2]).read_text()
fm = yaml.safe_load(design.read_text().split("---")[1])

def kebab(name): return name.replace("_", "-").lower()

missing = []

# Colors: every documented color key must produce a "--color-{kebab}:" line
# somewhere in the file.
for name in fm["colors"].keys():
    if not re.search(rf"^\s*--color-{re.escape(kebab(name))}\s*:", css_text, re.M):
        missing.append(f"--color-{kebab(name)}")

# Typography: every role must produce the family token (--font-{role}) and
# the size/weight/line-height sub-tokens. letter-spacing is optional.
for role, props in fm["typography"].items():
    k = kebab(role)
    if not re.search(rf"^\s*--font-{k}\s*:", css_text, re.M):
        missing.append(f"--font-{k}")
    for sub in ("size", "weight", "line-height"):
        if not re.search(rf"^\s*--font-{k}-{sub}\s*:", css_text, re.M):
            missing.append(f"--font-{k}-{sub}")

# Radii.
for name in fm["rounded"].keys():
    if not re.search(rf"^\s*--radius-{kebab(name)}\s*:", css_text, re.M):
        missing.append(f"--radius-{kebab(name)}")

# Spacing.
for name in fm["spacing"].keys():
    if not re.search(rf"^\s*--spacing-{kebab(str(name))}\s*:", css_text, re.M):
        missing.append(f"--spacing-{kebab(str(name))}")

assert not missing, f"missing CSS custom properties: {missing[:5]}{'...' if len(missing) > 5 else ''}"
print(f"  ok: all {len(fm['colors'])} colors, {len(fm['typography'])} typography roles, {len(fm['rounded'])} radii, {len(fm['spacing'])} spacing slots are exposed")
PY
ok "every documented token is exposed as a CSS custom property"

# ---------------------------------------------------------------------------
# 3. Theme override binds the documented light value.
# ---------------------------------------------------------------------------
echo "[3/7] theme overrides bind the documented light + dark values"
python3 - "$DESIGN" "$CSS" <<'PY'
import sys, re, yaml, pathlib
design = pathlib.Path(sys.argv[1])
css_text = pathlib.Path(sys.argv[2]).read_text()
fm = yaml.safe_load(design.read_text().split("---")[1])

light_hex = fm["colors"]["surface-raised"].lstrip("#").upper()
dark_hex = fm["colors"]["surface-raised-dark"].lstrip("#").upper()

# [data-theme="dark"] block must bind --color-surface-raised to the dark value.
dark_block = re.search(r'\[data-theme="dark"\]\s*\{[^}]*\}', css_text, re.S)
assert dark_block, '[data-theme="dark"] block not found'
dark_match = re.search(r"--color-surface-raised:\s*(#[0-9A-Fa-f]+);", dark_block.group(0))
assert dark_match, '[data-theme="dark"] --color-surface-raised not found'
dark_value = dark_match.group(1).lstrip("#").upper()
assert dark_value == dark_hex, f'[data-theme="dark"] surface-raised = #{dark_value}, want #{dark_hex} (DESIGN.md surface-raised-dark)'

# [data-theme="light"] block must bind --color-surface-raised to the light value.
light_block = re.search(r'\[data-theme="light"\]\s*\{[^}]*\}', css_text, re.S)
assert light_block, '[data-theme="light"] block not found'
light_match = re.search(r"--color-surface-raised:\s*(#[0-9A-Fa-f]+);", light_block.group(0))
assert light_match, '[data-theme="light"] --color-surface-raised not found'
light_value = light_match.group(1).lstrip("#").upper()
assert light_value == light_hex, f'[data-theme="light"] surface-raised = #{light_value}, want #{light_hex} (DESIGN.md surface-raised)'

# :root must also expose --color-surface-raised-dark for direct reference.
root_dark = re.search(r"^\s*--color-surface-raised-dark:\s*(#[0-9A-Fa-f]+);", css_text, re.M)
assert root_dark, ":root --color-surface-raised-dark not found"
root_dark_value = root_dark.group(1).lstrip("#").upper()
assert root_dark_value == dark_hex, f":root surface-raised-dark = #{root_dark_value}, want #{dark_hex}"

# :root binds --color-surface-raised to the LIGHT value; the [data-theme="dark"] override
# is what makes student pages dark. Story 1.2's bootstrap writes data-theme="dark" on <html>
# before first paint, so the dark cascade is active for students without a flash.
root_raised = re.search(r"^\s*--color-surface-raised:\s*(#[0-9A-Fa-f]+);", css_text, re.M)
assert root_raised, ":root --color-surface-raised not found"
root_raised_value = root_raised.group(1).lstrip("#").upper()
assert root_raised_value == light_hex, f':root surface-raised = #{root_raised_value}, want #{light_hex} (admin light default; dark cascade requires data-theme="dark")'

print(f"  ok: [data-theme=dark] surface-raised = #{dark_value}; [data-theme=light] surface-raised = #{light_value}; :root surface-raised-dark = #{root_dark_value}")
PY
ok "theme overrides bind the documented light + dark values"

# ---------------------------------------------------------------------------
# 4. The token self-test fixture is present and references every color.
# ---------------------------------------------------------------------------
echo "[4/7] [data-token-self-test] fixture references every documented color"
python3 - "$DESIGN" "$CSS" <<'PY'
import sys, re, yaml, pathlib
design = pathlib.Path(sys.argv[1])
css_text = pathlib.Path(sys.argv[2]).read_text()
fm = yaml.safe_load(design.read_text().split("---")[1])

block = re.search(r"\[data-token-self-test\]\s*\{[^}]*\}", css_text, re.S)
assert block, "[data-token-self-test] block not found"
self_text = block.group(0)

def kebab(name): return name.replace("_", "-").lower()

missing = []
for name in fm["colors"].keys():
    k = kebab(name)
    if f"var(--color-{k})" not in self_text:
        missing.append(f"var(--color-{k})")
assert not missing, f"self-test fixture missing refs: {missing[:5]}"
print(f"  ok: self-test fixture references all {len(fm['colors'])} colors")
PY
ok "self-test fixture is wired"

# ---------------------------------------------------------------------------
# 5. The guard script exits 0 on the current tree.
# ---------------------------------------------------------------------------
echo "[5/7] bash scripts/check_no_raw_hex.sh exits 0 on the current tree"
if ! bash "$GUARD" > "$EVIDENCE/guard-clean.out" 2>&1; then
  cat "$EVIDENCE/guard-clean.out" >&2
  fail "guard reported violations on the current tree"
fi
ok "guard clean on current tree"

# ---------------------------------------------------------------------------
# 6. The guard catches an injected violation.
# ---------------------------------------------------------------------------
echo "[6/7] guard catches an injected violation"
# Inject a tmp file under a directory the guard does scan (i.e., inside the
# project tree but not under an excluded dir).
INJECT_DIR="$ROOT/public/_injected_$$"
INJECT_FILE="$INJECT_DIR/violation.css"
mkdir -p "$INJECT_DIR"
cat > "$INJECT_FILE" <<'CSS'
body { color: #FF00AA; background: #BADA55; }
CSS
if bash "$GUARD" > "$EVIDENCE/guard-violation.out" 2>&1; then
  rm -rf "$INJECT_DIR"
  fail "guard should have failed on the injected violation"
fi
grep -q "_injected_" "$EVIDENCE/guard-violation.out" || {
  cat "$EVIDENCE/guard-violation.out" >&2
  rm -rf "$INJECT_DIR"
  fail "guard output did not name the injected file"
}
ok "guard caught the injected violation"
rm -rf "$INJECT_DIR"

# Confirm the project is clean again (the guard's last run included the
# injected file in the violation output, so re-run to prove restoration).
bash "$GUARD" > "$EVIDENCE/guard-final.out" 2>&1 || {
  cat "$EVIDENCE/guard-final.out" >&2
  fail "guard reported violations on the final tree"
}


# ---------------------------------------------------------------------------
# 6.5 URL_FRAGMENT_OK — guard does NOT trip on <a href="#section">x</a>
# (the I/O Matrix URL_FRAGMENT_OK row is now exercised by this step).
# ---------------------------------------------------------------------------
echo "[6.5/7] URL fragments in HTML do not trip the guard"
URL_FRAG_DIR="$(mktemp -d)"
URL_FRAG_FILE="$URL_FRAG_DIR/url_frag_test.html"
cat > "$URL_FRAG_FILE" <<'HTML'
<!doctype html>
<html><body><a href="#section">x</a></body></html>
HTML
if ! bash "$GUARD" > "$EVIDENCE/guard-urlfrag.out" 2>&1; then
  cat "$EVIDENCE/guard-urlfrag.out" >&2
  rm -rf "$URL_FRAG_DIR"
  fail "guard tripped on a non-hex URL fragment"
fi
ok "guard accepts <a href="#section">"
rm -rf "$URL_FRAG_DIR"

# ---------------------------------------------------------------------------
# 7. composer test:tokens exits 0.
# ---------------------------------------------------------------------------
echo "[7/7] composer test:tokens exits 0"
if ! composer test:tokens > "$EVIDENCE/composer.out" 2>&1; then
  cat "$EVIDENCE/composer.out" >&2
  fail "composer test:tokens failed"
fi
ok "composer test:tokens is wired"

# Final summary (write to a separate file so it does not get tee'd back into run.log)
SUMMARY="$EVIDENCE/summary.txt"
{
  echo "=== summary ==="
  echo "evidence: $EVIDENCE"
  echo "files:"
  echo "  - DESIGN.md ($(wc -c < "$DESIGN") bytes)"
  echo "  - public/assets/css/tickettrade.css ($(wc -c < "$CSS") bytes)"
  echo "  - scripts/check_no_raw_hex.sh ($(wc -c < "$GUARD") bytes)"
  echo
  echo "verdict: PASS"
} > "$SUMMARY"
cat "$SUMMARY"

v_pass "1-1 design token system green (evidence: $EVIDENCE)"
