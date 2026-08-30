#!/usr/bin/env python3
"""test-banned.py -- the banned-pattern linter implementation.

Uses grep -P (PCRE2) for the actual scan (native speed) and applies the
override rules in Python (small overhead). The combined pattern is built
once per invocation.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ROOT = SCRIPT_DIR.parent.parent

# Pattern catalog. Each entry: (name, rationale, pcre-pattern).
# The combined-pattern shell-out drives the scan.
PATTERNS = [
    (
        "EMOJI_FUNCTIONAL",
        "Non-ASCII emoji in user-facing chrome. Trust signals read as honest only when the chrome does not carry decoration.",
        r"[🌀-🫿☀-➿]",
    ),
    (
        "EXCLAMATION_MARK",
        "Exclamation marks in functional copy. The landing-hero block is the documented exception; everywhere else (toasts, modals, empty states, error states, button text) they are banned.",
        r"!(?=[\s.,;)\]}>\'\"<]|$)",
    ),
    (
        "STREAK_COUNTER",
        "Streak counters (streak, day streak, login streak, hot streak, combo, multiplier xN) shown to the user. The PRD-stored 7-day and 30-day streak bonuses exist as anti-farming mechanics, not as visible counters.",
        r"(?i)\b(?:day\s+streak|login\s+streak|hot\s+streak)\b|\bstreak\b|\bcombo\b|\bmultiplier\s*x\d+\b|\bstreak\s*:",
    ),
    (
        "DAILY_BONUS",
        "Daily-login-bonus displays (daily bonus, daily reward, daily login bonus). Bonuses exist server-side; they are not a UI reward.",
        r"(?i)\b(?:daily\s+bonus|daily\s+reward|daily\s+login\s+bonus)\b",
    ),
    (
        "BOTTOM_NAV_BADGE",
        "Badge counts on the bottom nav. Five clean items is the rule; counts invite farming behavior.",
        r"(?is)bottom[-_]?nav[^>]*>[^<]*<\s*span[^>]*badge[^>]*>\s*\d+\s*<\s*/\s*span\s*>",
    ),
    (
        "PUSH_NOTIFICATION",
        "Push notification strings in user-facing templates. Campus-only; no notification channel exists. The in-page toast dismiss button aria-label is the one documented exception.",
        r"(?i)\b(?:notification|notif)\b|\bpush\s+(?:notification|notif|message|alert)\b|push[-_]notif|browser\s+push|web\s+push",
    ),
    (
        "INFINITE_SCROLL",
        "Infinite-scroll markers (infinite-scroll, infinite scroll, IntersectionObserver). Lists are paginated for accessibility and predictability.",
        r"(?i)\b(?:infinite\s*[-_]?\s*scroll|IntersectionObserver)\b",
    ),
    (
        "NESTED_MODAL",
        "Nested modal markers (modal-dialog inside another modal-dialog). One modal level maximum.",
        r"(?is)<\s*[^>]*modal[-_]?dialog[^>]*>.*<\s*[^>]*modal[-_]?dialog",
    ),
    (
        "REPUTATION_SCORE",
        "Algorithmic-reputation-score markers (reputation_score, trust_score, credibility) outside admin-only contexts. Trust signals are listed, not aggregated into a hidden number.",
        r"(?<![A-Za-z0-9])(?:reputation_score|trust_score|credibility)(?![A-Za-z0-9])",
    ),
    (
        "FILLER_PHRASE",
        "Encouragement filler phrases (You are doing great!, Way to go!, Keep it up!, Awesome!). Empty results / errors are factual, not celebratory.",
        r"(?:You(?:'| a)re doing great!|Way to go!|Keep it up!|Awesome!)",
    ),
    (
        "RANK_BADGE_POINTS",
        "Numeric points total on the rank badge. Tier name only; never 1,234 pts.",
        r"(?is)\b(?:rank|tier)[-_]?badge\b.{0,80}?\b(?:\d{1,3}(?:,\d{3})*|\d{4,})\s*(?:pts?|points?)",
    ),
    (
        "TIER_PERSONALITY",
        "Personality-descriptor tier names (Newbie, Pro, Master, Expert, Guru, Ninja, Legendary). Never allowed; spec ranks use Recruit (E), Rookie (D), Operative (C), Specialist (B), Elite (A), Legend (S).",
        r"(?i)\b(?:Newbie|Pro|Master|Expert|Guru|Ninja|Legendary)\b",
    ),
    (
        "TIER_WITHOUT_CODE",
        "Spec tier names used without their code (e.g. `Elite` instead of `Elite (A)`). First reference in user-facing copy must pair with the tier code.",
        r"\b(?:Elite|Recruit|Rookie|Operative|Specialist|Legend)\b(?!\s*\([EDCBAS]\))",
    ),
    (
        "NUMBER_WITHOUT_UNIT",
        "A bare number (N or N,NNN) presented without its unit (sales/listings/reviews/etc.). The product never shows a number without context.",
        r"(?i)(?:sold|bought|viewing|listing|review|item|rating|score)\s+\d{1,3}(?:,\d{3})*\b(?!\s*(?:sales|listings|reviews|points|views|items|ratings))",
    ),
    (
        "VERIFICATION_STATUS",
        "Verification status strings other than `Verified Student`. `NSBM Student`, `Official Account`, etc. are forbidden. The voice-and-tone spec locks `Verified Student` as the only allowed status.",
        r"(?i)\b(?:NSBM\s+Student|Official\s+Account|Verified\s+Buyer|Verified\s+Seller|Verified\s+User)\b",
    ),
]

# Compiled per-pattern regex for second-pass classification.
COMPILED = [(name, rationale, pat, re.compile(pat)) for name, rationale, pat in PATTERNS]

EXCLUDED_DIRS = {
    "node_modules", ".git", "_bmad-output", "_bmad", "vendor", "archive",
    ".agents", ".opencode", "verification_evidence", "docs",
}
EXTENSIONS = ("php", "html", "js", "md")


def parse_args(argv):
    list_only = False
    root = DEFAULT_ROOT
    args = list(argv[1:])
    while args:
        a = args.pop(0)
        if a == "--list":
            list_only = True
        elif a == "--root":
            root = Path(args.pop(0))
        elif a in ("--help", "-h"):
            print(__doc__)
            sys.exit(0)
        else:
            print(f"FAIL: unknown argument: {a}", file=sys.stderr)
            sys.exit(2)
    return list_only, root


def load_pattern_overrides(root):
    """Read public/assets/banned-patterns.override.json."""
    path = root / "public" / "assets" / "banned-patterns.override.json"
    if not path.is_file():
        return {}
    data = json.loads(path.read_text())
    result = {}
    for name, entry in data.get("patterns", {}).items():
        paths = entry.get("allowed_paths", [])
        result[name] = [
            (root / p).resolve() if not Path(p).is_absolute() else Path(p)
            for p in paths
        ]
    return result


def load_instance_overrides(root):
    """Read .banned-allowlist at the repo root."""
    path = root / ".banned-allowlist"
    if not path.is_file():
        return set()
    triples = set()
    for raw in path.read_text().splitlines():
        line = raw.rstrip("\r")
        if not line or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^(\S+):(\d+):\s+([A-Za-z0-9_]+)\s+#\s+(.+)$", line)
        if m:
            triples.add((m.group(1), int(m.group(2)), m.group(3)))
    return triples


def path_under(child, parent):
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


def is_allowlisted(rel_path, lineno, name, pattern_overrides, instance_overrides, root):
    if name in pattern_overrides:
        abs_match = (root / rel_path).resolve()
        for allowed in pattern_overrides[name]:
            if path_under(abs_match, allowed):
                return True
    triple = (rel_path, lineno, name)
    if triple in instance_overrides:
        return True
    return False


def classify(rel, lineno, line_text, ext, admin_dir, root):
    """Determine which patterns match this line. Return list of (name, snippet)."""
    matches = []
    for name, _, _, regex in COMPILED:
        # extension filter
        pattern_exts = {
            "EMOJI_FUNCTIONAL": ("php", "html", "js", "md"),
            "BOTTOM_NAV_BADGE": ("html",),
        }.get(name, ("php", "html", "js"))
        if ext not in pattern_exts:
            continue
        if name == "REPUTATION_SCORE" and (root / rel).resolve().is_relative_to(admin_dir):
            continue
        if regex.search(line_text):
            snippet = line_text.rstrip()
            if len(snippet) > 200:
                snippet = snippet[:197] + "..."
            matches.append((name, snippet))
    return matches


def scan_via_grep(root):
    """Shell out to grep -P for native-speed scan; classify via Python regex."""
    admin_dir = (root / "public" / "admin").resolve()
    combined = "|".join(pat for _, _, pat in PATTERNS)
    cmd = [
        "grep", "-rPn",
        "--include=*.php", "--include=*.html", "--include=*.js", "--include=*.md",
        combined, "public", "mockups",
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=root)
    except FileNotFoundError:
        # grep not available; fall back to pure-Python scan
        return _scan_python(root, admin_dir)
    matches = []
    for line in proc.stdout.splitlines():
        # Format: path:lineno:content
        m = re.match(r"^([^:]+):(\d+):(.*)$", line)
        if not m:
            continue
        rel, lineno_s, content = m.group(1), int(m.group(2)), m.group(3)
        ext = rel.rsplit(".", 1)[-1].lower()
        for name, snippet in classify(rel, lineno_s, content, ext, admin_dir, root):
            matches.append((rel, lineno_s, name, snippet))
    # Add multi-line matches separately (NESTED_MODAL, BOTTOM_NAV_BADGE).
    # Those need joined-line scanning; grep -P with (?s) DOTALL doesn't give us
    # multi-line match ranges cleanly, so do a focused second pass.
    multi_files = {root / "public", root / "mockups"}
    multiline_names = {"NESTED_MODAL", "BOTTOM_NAV_BADGE"}
    multi_patterns = [(n, r, c) for n, _, r, c in COMPILED if n in multiline_names]
    for base in [root / "public", root / "mockups"]:
        if not base.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
            for fn in filenames:
                ext = fn.rsplit(".", 1)[-1].lower() if "." in fn else ""
                if ext not in ("html", "js"):
                    continue
                full = Path(dirpath) / fn
                rel = str(full.relative_to(root))
                try:
                    text = full.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue
                for name, _, regex in [(n, r, c) for n, _, r, c in COMPILED if n in multiline_names]:
                    if ext not in ("html", "js"):
                        continue
                    joined = text
                    for m in regex.finditer(joined):
                        start = joined[: m.start()].count("\n") + 1
                        end = joined[: m.end()].count("\n") + 1
                        snippet = m.group(0)[:200].replace("\n", " | ")
                        matches.append((rel, start, name, snippet + f" (spans lines {start}-{end})"))
    return matches


def _scan_python(root, admin_dir):
    """Fallback: pure-Python scan if grep -P is unavailable."""
    matches = []
    for base in [root / "public", root / "mockups"]:
        if not base.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
            for fn in filenames:
                ext = fn.rsplit(".", 1)[-1].lower() if "." in fn else ""
                if ext not in EXTENSIONS:
                    continue
                full = Path(dirpath) / fn
                rel = str(full.relative_to(root))
                try:
                    text = full.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue
                lines = text.split("\n")
                for i, line_text in enumerate(lines, 1):
                    for name, snippet in classify(rel, i, line_text, ext, admin_dir, root):
                        matches.append((rel, i, name, snippet))
                # multi-line
                joined = text
                for name, _, _, regex in COMPILED:
                    if name not in ("NESTED_MODAL", "BOTTOM_NAV_BADGE"):
                        continue
                    for m in regex.finditer(joined):
                        start = joined[: m.start()].count("\n") + 1
                        end = joined[: m.end()].count("\n") + 1
                        snippet = m.group(0)[:200].replace("\n", " | ")
                        matches.append((rel, start, name, snippet + f" (spans lines {start}-{end})"))
    return matches


def main():
    list_only, root = parse_args(sys.argv)
    root = Path(root).resolve()

    if list_only:
        for name, rationale, _ in PATTERNS:
            print(f"{name} -- {rationale}")
        return 0

    pattern_overrides = load_pattern_overrides(root)
    instance_overrides = load_instance_overrides(root)

    raw_matches = scan_via_grep(root)
    violations = []
    applied = []
    for rel, lineno, name, snippet in raw_matches:
        if is_allowlisted(rel, lineno, name, pattern_overrides, instance_overrides, root):
            applied.append((rel, lineno, name, snippet))
        else:
            violations.append((rel, lineno, name, snippet))

    if not violations:
        print("OK: no banned patterns detected")
        if applied:
            print(f"      overrides applied ({len(applied)}):")
            for rel, lineno, name, snippet in applied:
                print(f"        {rel}:{lineno}: {name} -- {snippet}")
        return 0

    print(f"FAIL: {len(violations)} banned pattern violation(s) found:", file=sys.stderr)
    for rel, lineno, name, snippet in violations:
        print(f"  {rel}:{lineno}: {name} -- {snippet}", file=sys.stderr)
    print("", file=sys.stderr)
    print(f"      Per-pattern overrides: {root}/public/assets/banned-patterns.override.json", file=sys.stderr)
    print(f"      Per-instance overrides: {root}/.banned-allowlist", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
