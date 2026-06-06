---
name: idea-to-pr-validate
description: Use when dispatched by idea-to-pr orchestrator for Phase 4 validation
---

# Phase 4: VALIDATE — Full Validation Suite

## Instructions

1. Read `.archon-artifacts/plan.md` for validation commands
2. Run ALL validation checks
3. Write results to `.archon-artifacts/validation.md`

## Validation Checks

Run every check that applies:

```bash
# 1. Type-check
npx tsc --noEmit 2>&1

# 2. Lint
npx eslint . 2>&1 || true

# 3. Format
npx prettier --check . 2>&1 || true

# 4. Tests
npx vitest run 2>&1 || npx jest 2>&1 || npm test 2>&1 || echo "No test runner"

# 5. Build
npm run build 2>&1 || npx vite build 2>&1 || echo "No build command"
```

## Asking Questions

If a validation command fails in a way you don't understand:
1. Use the `question` tool to ask the user for guidance
2. Document the answer in `.archon-artifacts/validation.md`
3. Apply the fix and re-run

## Output

Write `.archon-artifacts/validation.md` with:

| Check | Status | Details |
|-------|--------|---------|
| Type-check | PASS/FAIL/N/A | Error summary if failed |
| Lint | PASS/FAIL/N/A | Error summary if failed |
| Format | PASS/FAIL/N/A | Error summary if failed |
| Tests | PASS/FAIL/N/A | Error summary if failed |
| Build | PASS/FAIL/N/A | Error summary if failed |

## Fix Protocol

If any check FAILED:
1. Fix the root cause
2. Re-run the check
3. Update validation.md with the new status
4. Repeat until PASS or N/A

## Constraints

- Do NOT add new features or change scope — validation only
- If fixing test failures, keep tests passing
- Do NOT commit or push anything
