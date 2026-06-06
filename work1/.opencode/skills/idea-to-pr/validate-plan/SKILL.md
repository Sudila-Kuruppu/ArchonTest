---
name: idea-to-pr-validate-plan
description: Use when dispatched by idea-to-pr orchestrator for Phase 2 plan validation
---

# Phase 2: VALIDATE PLAN — Plan Readiness Check

## Instructions

1. Read `.archon-artifacts/plan.md`
2. Verify every reference in the plan is correct
3. Write verification report to `.archon-artifacts/verification.md`

## Verification Checklist

For every file mentioned in the plan:

- [ ] Every pattern/reference file exists on disk at the specified path
- [ ] Every `CREATE` target does NOT exist yet (would not overwrite)
- [ ] Every `UPDATE` target already exists (would not create a new file)
- [ ] Every `<VALIDATE>` command in the plan can dry-run without error

## Output

Write `.archon-artifacts/verification.md` with:

- Each check and its PASS/FAIL status
- Files that passed verification
- Files that failed (with details on what's wrong)
- If everything passes: state **CONFIRMED**
- If issues found: fix the plan file directly, then confirm

## Asking Questions

If you find an issue you cannot resolve (e.g., ambiguous file path, contradictory instructions):
1. Use the `question` tool to ask the user
2. Document their answer in `.archon-artifacts/verification.md`
3. Apply the fix to `.archon-artifacts/plan.md`

## Constraints

- Do NOT implement anything — verification only
- If you fix the plan, explain what changed and why
