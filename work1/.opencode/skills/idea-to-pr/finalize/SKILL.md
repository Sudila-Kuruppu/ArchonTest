---
name: idea-to-pr-finalize
description: Use when dispatched by idea-to-pr orchestrator for Phase 5 finalization
---

# Phase 5: FINALIZE — Commit & Pull Request

## Prerequisites

Check `.archon-artifacts/validation.md` — Phase 4 validation MUST have PASSED.

If validation FAILED: STOP. Do NOT commit. Report the failure.

## Instructions

Execute in order:

### 1. Stage changes

```bash
git add -A
```

### 2. Review what's being committed

```bash
git diff --cached --stat
```

Verify only intended files are staged. If unintended files are present, unstage them.

### 3. Commit

Read `.archon-artifacts/plan.md` for the feature name.

```bash
git commit -m "feat: {feature name from plan}"
```

### 4. Push

```bash
git push -u origin HEAD 2>&1
```

### 5. Create Pull Request

```bash
gh pr view HEAD --json url 2>/dev/null || gh pr create \
  --title "{feature name}" \
  --body "## Summary\n## Changes\n## Test Plan"
```

## Asking Questions

If something goes wrong (e.g., push rejected, merge conflict, auth issue):
1. Use the `question` tool to ask the user
2. Document the answer in `.archon-artifacts/summary.md`
3. Retry or report the issue

## Output

Write `.archon-artifacts/summary.md` with:
- Feature name
- Branch name
- Commit hash
- PR URL (or "manual PR needed" if `gh` unavailable)
- Any warnings or notes

## Constraints

- Do NOT commit if Phase 4 validation failed
- Do NOT force push
- Do NOT skip the PR creation step
