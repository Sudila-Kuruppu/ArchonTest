---
name: archon-idea-to-pr-confirm-plan
description: |
  Use when: Running the confirm-plan phase of archon-idea-to-pr.
  Verify plan research is still valid - check patterns exist, code hasn't drifted
  Command from: archon-confirm-plan
  NOT for: Standalone use outside archon-idea-to-pr workflow.
argument-hint: (no arguments - reads from workflow artifacts)
---

# Sub-skill: confirm-plan

**Core principle:** Follow the instructions below phase by phase. Write all outputs to `.archon-artifacts/`. Complete each phase before moving to the next.

## EXECUTION PROTOCOLS

### SUBAGENT PROTOCOL

When you see `<SUBAGENT>` followed by `<PROMPT>`, execute them as a Task tool call.
**Do NOT execute the prompt yourself.** Always delegate via Task tool.

### VALIDATE PROTOCOL

Run every command in `<VALIDATE>` bash blocks. If any fail, fix before proceeding.

---

## Phase 1: LOAD - Read Context Artifact

<SUBAGENT>
description: archon-idea-to-pr-confirm-plan: Phase 1 - Load Context Artifact
subagent_type: general
</SUBAGENT>
<PROMPT>
# Confirm Plan Research

**Workflow ID**: $WORKFLOW_ID

## Your Mission

Verify that the plan's research is still valid before implementation begins.

Plans can become stale:
- Files may have been renamed or moved
- Code patterns may have changed
- APIs may have been updated

**This step does NOT implement anything** - it only validates the plan is still accurate.

---

### 1.1 Load Plan Context

```bash
cat .archon-artifacts/plan-context.md
```

If not found, STOP with error:
```
❌ Plan context not found at .archon-artifacts/plan-context.md

Run archon-plan-setup first.
```

### 1.2 Extract Verification Targets

From the context, identify:

1. **Patterns to Mirror** - Files and line ranges to verify
2. **Files to Change** - Files that will be created/updated
3. **Validation Commands** - Commands that should work

### CHECKPOINT

- [ ] Context artifact loaded
- [ ] Patterns to verify extracted
- [ ] Files to change identified

Write all results to `.archon-artifacts/`.
</PROMPT>

### CHECKPOINT: Phase 1 Complete

- [ ] Context artifact loaded
- [ ] Patterns to verify extracted
- [ ] Files to change identified
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase 1 completed"
```
</VALIDATE>

---

## Phase 2: VERIFY - Check Patterns Exist

<SUBAGENT>
description: archon-idea-to-pr-confirm-plan: Phase 2 - Check Patterns Exist
subagent_type: general
</SUBAGENT>
<PROMPT>
### 2.1 Verify Pattern Files

For each file in "Patterns to Mirror":

1. Check if file exists:
   ```bash
   test -f {file-path} && echo "EXISTS" || echo "MISSING"
   ```

2. If exists, read the referenced lines:
   ```bash
   sed -n '{start},{end}p' {file-path}
   ```

3. Compare with what the plan expected (if plan included code snippets)

### 2.2 Document Findings

For each pattern file:

| File | Status | Notes |
|------|--------|-------|
| `src/adapters/telegram.ts` | ✅ EXISTS | Lines 11-23 match expected pattern |
| `src/types/index.ts` | ✅ EXISTS | Interface still present |
| `src/old-file.ts` | ❌ MISSING | File was renamed/deleted |
| `src/changed.ts` | ⚠️ DRIFTED | Code structure changed significantly |

### 2.3 Severity Assessment

| Finding | Severity | Action |
|---------|----------|--------|
| File exists, code matches | ✅ OK | Proceed |
| File exists, minor differences | ⚠️ WARNING | Note in artifact, proceed with caution |
| File exists, major drift | 🟠 CONCERN | Flag for review, may need plan update |
| File missing | ❌ BLOCKER | Stop, plan needs revision |

### CHECKPOINT

- [ ] All pattern files checked
- [ ] Findings documented
- [ ] Severity assessed

Write all results to `.archon-artifacts/`.
</PROMPT>

### CHECKPOINT: Phase 2 Complete

- [ ] All pattern files checked
- [ ] Findings documented
- [ ] Severity assessed
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase 2 completed"
```
</VALIDATE>

---

## Phase 3: VERIFY - Check Target Locations

<SUBAGENT>
description: archon-idea-to-pr-confirm-plan: Phase 3 - Check Target Locations
subagent_type: general
</SUBAGENT>
<PROMPT>
### 3.1 Check Files to Create

For each file marked CREATE:

1. Verify it doesn't already exist (would be unexpected):
   ```bash
   test -f {file-path} && echo "ALREADY EXISTS" || echo "OK - will create"
   ```

2. Verify parent directory exists or can be created:
   ```bash
   dirname {file-path} | xargs test -d && echo "DIR EXISTS" || echo "DIR WILL BE CREATED"
   ```

### 3.2 Check Files to Update

For each file marked UPDATE:

1. Verify it exists:
   ```bash
   test -f {file-path} && echo "EXISTS" || echo "MISSING"
   ```

2. If the plan references specific lines/functions, verify they exist

### CHECKPOINT

- [ ] CREATE targets verified (don't exist yet)
- [ ] UPDATE targets verified (do exist)

Write all results to `.archon-artifacts/`.
</PROMPT>

### CHECKPOINT: Phase 3 Complete

- [ ] CREATE targets verified (don't exist yet)
- [ ] UPDATE targets verified (do exist)
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase 3 completed"
```
</VALIDATE>

---

## Phase 4: VERIFY - Check Validation Commands

<SUBAGENT>
description: archon-idea-to-pr-confirm-plan: Phase 4 - Check Validation Commands
subagent_type: general
</SUBAGENT>
<PROMPT>
### 4.1 Dry Run Validation Commands

Test that the validation commands work (without expecting them to pass):

```bash
# Check type-check command exists
bun run type-check --help 2>/dev/null || echo "type-check not available"

# Check lint command exists
bun run lint --help 2>/dev/null || echo "lint not available"

# Check test command exists
bun test --help 2>/dev/null || echo "test not available"
```

### 4.2 Document Command Availability

| Command | Status |
|---------|--------|
| `bun run type-check` | ✅ Available |
| `bun run lint` | ✅ Available |
| `bun test` | ✅ Available |
| `bun run build` | ✅ Available |

### CHECKPOINT

- [ ] Validation commands tested
- [ ] All required commands available

Write all results to `.archon-artifacts/`.
</PROMPT>

### CHECKPOINT: Phase 4 Complete

- [ ] Validation commands tested
- [ ] All required commands available
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase 4 completed"
```
</VALIDATE>

---

## Phase 5: ARTIFACT - Write Confirmation

<SUBAGENT>
description: archon-idea-to-pr-confirm-plan: Phase 5 - Write Confirmation Artifact
subagent_type: general
</SUBAGENT>
<PROMPT>
### 5.1 Write Confirmation Artifact

Write to `.archon-artifacts/plan-confirmation.md`:

```markdown
# Plan Confirmation

**Generated**: {YYYY-MM-DD HH:MM}
**Workflow ID**: $WORKFLOW_ID
**Status**: {CONFIRMED | WARNINGS | BLOCKED}

---

## Pattern Verification

| Pattern | File | Status | Notes |
|---------|------|--------|-------|
| Constructor pattern | `src/adapters/telegram.ts:11-23` | ✅ | Matches expected |
| Interface definition | `src/types/index.ts:49-74` | ✅ | Present |
| ... | ... | ... | ... |

**Pattern Summary**: {X} of {Y} patterns verified

---

## Target Files

### Files to Create

| File | Status |
|------|--------|
| `src/new-file.ts` | ✅ Does not exist (ready to create) |

### Files to Update

| File | Status |
|------|--------|
| `src/existing.ts` | ✅ Exists |

---

## Validation Commands

| Command | Available |
|---------|-----------|
| `bun run type-check` | ✅ |
| `bun run lint` | ✅ |
| `bun test` | ✅ |
| `bun run build` | ✅ |

---

## Issues Found

{If no issues:}
No issues found. Plan research is valid.

{If issues:}
### Warnings

- **{file}**: {description of drift or concern}

### Blockers

- **{file}**: {description of missing file or critical issue}

---

## Recommendation

{One of:}
- ✅ **PROCEED**: Plan research is valid, continue to implementation
- ⚠️ **PROCEED WITH CAUTION**: Minor drift detected, implementation may need adjustments
- ❌ **STOP**: Critical issues found, plan needs revision

---

## Next Step

{If PROCEED or PROCEED WITH CAUTION:}
Continue to `archon-implement-tasks` to execute the plan.

{If STOP:}
Revise the plan to address blockers, then re-run `archon-plan-setup`.
```

### CHECKPOINT

- [ ] Confirmation artifact written
- [ ] Status clearly indicated
- [ ] Issues documented

Write all results to `.archon-artifacts/`.
</PROMPT>

### CHECKPOINT: Phase 5 Complete

- [ ] Confirmation artifact written
- [ ] Status clearly indicated
- [ ] Issues documented
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase 5 completed"
```
</VALIDATE>

---

## Phase 6: OUTPUT - Report to User

<SUBAGENT>
description: archon-idea-to-pr-confirm-plan: Phase 6 - Report to User
subagent_type: general
</SUBAGENT>
<PROMPT>
### If Confirmed (no blockers):

```markdown
## Plan Confirmed ✅

**Workflow ID**: `$WORKFLOW_ID`
**Status**: Ready for implementation

### Verification Summary

| Check | Result |
|-------|--------|
| Pattern files | ✅ {X}/{Y} verified |
| Target files | ✅ Ready |
| Validation commands | ✅ Available |

{If warnings:}
### Warnings

- {warning 1}
- {warning 2}

These are minor and shouldn't block implementation.

### Artifact

Confirmation written to: `.archon-artifacts/plan-confirmation.md`

### Next Step

Proceed to `archon-implement-tasks` to execute the plan.
```

### If Blocked:

```markdown
## Plan Blocked ❌

**Workflow ID**: `$WORKFLOW_ID`
**Status**: Cannot proceed

### Blockers Found

1. **{file}**: {description}
2. **{file}**: {description}

### Required Action

The plan references files or patterns that no longer exist. Options:

1. **Update the plan** to reflect current codebase state
2. **Restore missing files** if they were accidentally deleted
3. **Re-run planning** with `/archon-plan` to generate a fresh plan

### Artifact

Details written to: `.archon-artifacts/plan-confirmation.md`
```

Write all results to `.archon-artifacts/`.
</PROMPT>

### CHECKPOINT: Phase 6 Complete

- [ ] Phase 6 completed successfully
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** All phases completed.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase 6 completed"
```
</VALIDATE>

---

## Success Criteria

- **PATTERNS_VERIFIED**: All pattern files exist and are reasonably similar
- **TARGETS_VALID**: CREATE files don't exist, UPDATE files do exist
- **COMMANDS_AVAILABLE**: Validation commands can be run
- **ARTIFACT_WRITTEN**: Confirmation artifact created with clear status

- [ ] All phases completed
- [ ] Output artifacts exist in `.archon-artifacts/`
