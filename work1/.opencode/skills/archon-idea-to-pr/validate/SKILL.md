---
name: archon-idea-to-pr-validate
description: |
  Use when: Running the validate phase of archon-idea-to-pr.
  Run full validation suite - type-check, lint, tests, build
  Command from: archon-validate
  NOT for: Standalone use outside archon-idea-to-pr workflow.
argument-hint: (no arguments - reads from workflow artifacts)
---

# Sub-skill: validate

**Core principle:** Follow the instructions below phase by phase. Write all outputs to `.archon-artifacts/`. Complete each phase before moving to the next.

## EXECUTION PROTOCOLS

### SUBAGENT PROTOCOL

When you see `<SUBAGENT>` followed by `<PROMPT>`, execute them as a Task tool call.
**Do NOT execute the prompt yourself.** Always delegate via Task tool.

### VALIDATE PROTOCOL

Run every command in `<VALIDATE>` bash blocks. If any fail, fix before proceeding.

---

## Setup

<SUBAGENT>
description: archon-idea-to-pr-validate: Setup
subagent_type: general
</SUBAGENT>
<PROMPT>
# Validate Implementation

**Workflow ID**: $WORKFLOW_ID

---

## Your Mission

Run the complete validation suite and fix any failures.

This is a focused step: run checks, fix issues, repeat until green.

---

Write results to `.archon-artifacts/`.
</PROMPT>

### SETUP_CHECKPOINT
- [ ] Setup completed successfully

<VALIDATE>
```bash
echo "PASS"
```
</VALIDATE>

---

## ## Phase 1: LOAD - Get Validation Commands

<SUBAGENT>
description: archon-idea-to-pr-validate: ## Phase 1: LOAD - Get Validation Commands
subagent_type: general
</SUBAGENT>
<PROMPT>
### 1.1 Load Plan Context

```bash
cat .archon-artifacts/plan-context.md
```

Extract the "Validation Commands" section.

### 1.2 Identify Package Manager

```bash
test -f bun.lockb && echo "bun" || \
test -f pnpm-lock.yaml && echo "pnpm" || \
test -f yarn.lock && echo "yarn" || \
test -f package-lock.json && echo "npm" || \
echo "unknown"
```

### 1.3 Determine Available Commands

Check `package.json` for available scripts:

```bash
cat package.json | grep -A 20 '"scripts"'
```

**PHASE_1_CHECKPOINT:**

- [ ] Validation commands identified
- [ ] Package manager known

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### ##_PHASE_1_LOAD___GET_VALIDATION_COMMANDS_CHECKPOINT
- - [ ] Validation commands identified
- - [ ] Package manager known
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## ## Phase 2: VALIDATE - Run All Checks

<SUBAGENT>
description: archon-idea-to-pr-validate: ## Phase 2: VALIDATE - Run All Checks
subagent_type: general
</SUBAGENT>
<PROMPT>
Run each check in order. Fix any failures before proceeding.

### 2.1 Type Check

```bash
{runner} run type-check
```

**If fails:**
1. Read error output
2. Fix the type issues
3. Re-run until passing

**Record result**: ✅ Pass / ❌ Fail (fixed)

### 2.2 Lint Check

```bash
{runner} run lint
```

**If fails:**

1. Try auto-fix first:
   ```bash
   {runner} run lint:fix
   ```

2. Re-run lint check

3. If still failing, manually fix remaining issues

**Record result**: ✅ Pass / ❌ Fail (fixed)

### 2.3 Format Check

```bash
{runner} run format:check
```

**If fails:**

1. Auto-fix:
   ```bash
   {runner} run format
   ```

2. Verify fixed:
   ```bash
   {runner} run format:check
   ```

**Record result**: ✅ Pass / ❌ Fail (fixed)

### 2.4 Test Suite

```bash
{runner} test
```

**If fails:**

1. Identify which test(s) failed
2. Determine: implementation bug or test bug?
3. Fix the root cause
4. Re-run tests

**Record result**: ✅ Pass ({N} tests) / ❌ Fail (fixed)

### 2.5 Build Check

```bash
{runner} run build
```

**If fails:**

1. Usually a type or import issue
2. Fix and re-run

**Record result**: ✅ Pass / ❌ Fail (fixed)

**PHASE_2_CHECKPOINT:**

- [ ] Type check passes
- [ ] Lint passes
- [ ] Format passes
- [ ] Tests pass
- [ ] Build passes

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### ##_PHASE_2_VALIDATE___RUN_ALL_CHECKS_CHECKPOINT
- - [ ] Type check passes
- - [ ] Lint passes
- - [ ] Format passes
- - [ ] Tests pass
- - [ ] Build passes
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## ## Phase 3: ARTIFACT - Write Validation Results

<SUBAGENT>
description: archon-idea-to-pr-validate: ## Phase 3: ARTIFACT - Write Validation Results
subagent_type: general
</SUBAGENT>
<PROMPT>
### 3.1 Write Validation Artifact

Write to `.archon-artifacts/validation.md`:

```markdown
# Validation Results

**Generated**: {YYYY-MM-DD HH:MM}
**Workflow ID**: $WORKFLOW_ID
**Status**: {ALL_PASS | FIXED | BLOCKED}

---

## Summary

| Check | Result | Details |
|-------|--------|---------|
| Type check | ✅ | No errors |
| Lint | ✅ | 0 errors, {N} warnings |
| Format | ✅ | All files formatted |
| Tests | ✅ | {N} passed, 0 failed |
| Build | ✅ | Compiled successfully |

---

## Type Check

**Command**: `{runner} run type-check`
**Result**: ✅ Pass

{If issues were fixed:}
### Issues Fixed

- `src/file.ts:42` - Added missing return type
- `src/other.ts:15` - Fixed generic constraint

---

## Lint

**Command**: `{runner} run lint`
**Result**: ✅ Pass

{If issues were fixed:}
### Issues Fixed

- {N} auto-fixed by `lint:fix`
- {M} manually fixed

### Remaining Warnings

{List any warnings that weren't fixed, with justification}

---

## Format

**Command**: `{runner} run format:check`
**Result**: ✅ Pass

{If files were formatted:}
### Files Formatted

- `src/file.ts`
- `src/other.ts`

---

## Tests

**Command**: `{runner} test`
**Result**: ✅ Pass

| Metric | Count |
|--------|-------|
| Total tests | {N} |
| Passed | {N} |
| Failed | 0 |
| Skipped | {M} |

{If tests were fixed:}
### Tests Fixed

- `src/x.test.ts` - Fixed assertion to match new behavior

---

## Build

**Command**: `{runner} run build`
**Result**: ✅ Pass

Build output: `dist/` (or as configured)

---

## Files Modified During Validation

{If any files were changed to fix issues:}

| File | Changes |
|------|---------|
| `src/file.ts` | Fixed type error |
| `src/other.ts` | Lint auto-fix |

---

## Next Step

Continue to `archon-finalize-pr` to update PR and mark ready for review.
```

**PHASE_3_CHECKPOINT:**

- [ ] Validation artifact written
- [ ] All results documented

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### ##_PHASE_3_ARTIFACT___WRITE_VALIDATION_RESULTS_CHECKPOINT
- - [ ] Validation artifact written
- - [ ] All results documented
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## ## Phase 4: OUTPUT - Report Results

<SUBAGENT>
description: archon-idea-to-pr-validate: ## Phase 4: OUTPUT - Report Results
subagent_type: general
</SUBAGENT>
<PROMPT>
### If All Pass:

```markdown
## Validation Complete ✅

**Workflow ID**: `$WORKFLOW_ID`

### Results

| Check | Status |
|-------|--------|
| Type check | ✅ |
| Lint | ✅ |
| Format | ✅ |
| Tests | ✅ ({N} passed) |
| Build | ✅ |

{If issues were fixed:}
### Issues Fixed

- {N} type errors fixed
- {M} lint issues fixed
- {K} format issues fixed

### Artifact

Results written to: `.archon-artifacts/validation.md`

### Next Step

Proceed to `archon-finalize-pr` to update PR and mark ready for review.
```

### If Blocked (unfixable issue):

```markdown
## Validation Blocked ❌

**Workflow ID**: `$WORKFLOW_ID`

### Failed Check

**{check-name}**: {error description}

### Attempts to Fix

1. {what was tried}
2. {what was tried}

### Required Action

This issue requires manual intervention:

{description of what needs to be done}

### Artifact

Partial results written to: `.archon-artifacts/validation.md`
```

---

## Success Criteria

- **TYPE_CHECK_PASS**: `{runner} run type-check` exits 0
- **LINT_PASS**: `{runner} run lint` exits 0
- **FORMAT_PASS**: `{runner} run format:check` exits 0
- **TESTS_PASS**: `{runner} test` all green
- **BUILD_PASS**: `{runner} run build` exits 0
- **ARTIFACT_WRITTEN**: Validation results documented

Write all results to `.archon-artifacts/`.
</PROMPT>

### ##_PHASE_4_OUTPUT___REPORT_RESULTS_CHECKPOINT
- [ ] ## Phase 4: OUTPUT - Report Results completed successfully
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Success Criteria

- [ ] All phases completed
- [ ] Output artifacts exist in `.archon-artifacts/`
