---
name: idea-to-pr
description: Use when user wants to implement a feature from idea to PR using isolated subagents
argument-hint: "<feature description>"
---

# Idea-to-PR: Deterministic Feature Implementation

**Core principle:** Each phase runs as a **fresh subagent** via the Task tool with zero memory of prior conversation. Phases communicate ONLY through `.archon-artifacts/` on disk. This ensures each phase starts clean, cannot hallucinate prior context, and produces independently verifiable output.

**Violating the subagent isolation rule is violating the purpose of this skill.** If a phase has context from a prior phase, you cannot trust its output.

## When to Use

- "implement feature X", "build this feature", "turn this into code"
- "create a PR for", "idea to pr", "from idea to pr"
- Any feature request that needs end-to-end implementation with validation gates

**When NOT to use:**
- Quick edits or one-off changes (use direct editing instead)
- Bug fixes (use systematic-debugging skill)
- Changes requiring human approval gates mid-workflow
- Refactoring-only tasks (use architect skill instead)

## EXECUTION PROTOCOLS

These protocols are not suggestions. They are the mechanism that makes this skill deterministic.

### SUBAGENT PROTOCOL

When you see a `<SUBAGENT>` block followed by `<PROMPT>`, you MUST execute them as a Task tool call:

```
<SUBAGENT>
description: <value>
subagent_type: <value>
</SUBAGENT>
<PROMPT>
<prompt text>
</PROMPT>
```

**Rules:**
1. Call the Task tool with `description` and `subagent_type` from `<SUBAGENT>`, and `prompt` from `<PROMPT>`
2. Do NOT execute the prompt yourself — always delegate via Task tool
3. After the subagent returns, verify the phase checkpoint before proceeding

### VALIDATE PROTOCOL

Every phase ends with a `<VALIDATE>` block containing bash commands that serve as gates:

```
**<VALIDATE>**
```bash
<commands>
```
**</VALIDATE>**
```

**Rules:**
1. Run every command in the bash block
2. If any command fails, do NOT proceed — fix the issue first
3. If the phase subagent failed, re-run the `<SUBAGENT>` block with failure details appended to `<PROMPT>`

## Quick Reference

| Phase | Subagent Type | Input | Output | Gate |
|-------|---------------|-------|--------|------|
| **Setup** | (inline) | `$ARGUMENTS` | `.archon-artifacts/input.txt` | Directory + input file exist |
| **1: PLAN** | explore | `input.txt` | `plan.md` | Plan has all required sections |
| **2: VALIDATE PLAN** | general | `plan.md` | `verification.md` | All file refs confirmed |
| **3: IMPLEMENT** | general | `plan.md` | `implementation.md` | All tasks executed cleanly |
| **4: VALIDATE** | general | `plan.md` | `validation.md` | Type-check, lint, tests, build pass |
| **5: FINALIZE** | general | `validation.md` | `summary.md` | Committed + PR created |

---

## Setup

```bash
mkdir -p .archon-artifacts
echo "$ARGUMENTS" > .archon-artifacts/input.txt
```

### SETUP_CHECKPOINT
- [ ] `.archon-artifacts/` directory created
- [ ] `input.txt` written with the full feature description
- [ ] Working directory is the project root

---

## Phase 1: PLAN — Codebase Analysis & Implementation Plan

<SUBAGENT>
description: idea-to-pr: PLAN — {feature description from input.txt}
subagent_type: explore
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/input.txt for the feature description.

Explore the codebase thoroughly to find:
1. Project structure (list root, key dirs, config files)
2. Existing similar features with file:line references
3. Naming conventions, error handling patterns, test structure
4. Integration points for this feature

Then write a complete implementation plan to .archon-artifacts/plan.md with:
- Summary & user story
- UX before/after diagram (text-based)
- Files to change (CREATE/UPDATE with paths)
- NOT Building scope limits
- Step-by-step atomic tasks (each with VALIDATE command)
- Testing strategy & edge cases
- Full validation commands

CRITICAL: Do NOT implement anything. Plan only.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/plan.md` exists and is non-empty
- [ ] Plan contains all required sections: summary, UX diagram, files, scope limits, tasks, testing, validation
- [ ] Plan explicitly marks files as CREATE or UPDATE
- [ ] Each task has a `<VALIDATE>` command block
- [ ] No implementation code was written (plan-only)

**Checkpoint passed?** Proceed to Phase 2.
**Checkpoint failed?** Re-run the `<SUBAGENT>` block above with the failure details appended to `<PROMPT>`.

**<VALIDATE>**
```bash
test -s .archon-artifacts/plan.md && echo "PASS: plan.md exists" || echo "FAIL: plan.md missing"
grep -q "Summary & user story" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: has summary" || echo "FAIL: missing summary"
grep -q "NOT Building" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: has scope limits" || echo "FAIL: missing scope limits"
grep -q "<VALIDATE>" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: has validate blocks" || echo "FAIL: missing validate blocks"
```
**</VALIDATE>**

---

## Phase 2: VALIDATE PLAN — Plan Readiness Check

<SUBAGENT>
description: idea-to-pr: VALIDATE PLAN — {feature description from input.txt}
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/plan.md

1. Check every pattern file reference exists on disk
2. Check every CREATE target doesn't exist; every UPDATE target does
3. Dry-run each task's VALIDATE command (with || true)
4. Write verification to .archon-artifacts/verification.md

If anything is wrong, fix the plan file directly.

Output: CONFIRMED or list of issues found.
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] `.archon-artifacts/verification.md` exists
- [ ] All pattern file references exist on disk
- [ ] All CREATE targets do NOT exist yet
- [ ] All UPDATE targets already exist
- [ ] All VALIDATE commands dry-run successfully
- [ ] **GATE**: If issues found -> fix plan.md first, then re-run `<SUBAGENT>` block

**Checkpoint passed?** Proceed to Phase 3.
**Checkpoint failed?** Fix plan.md, then re-run the `<SUBAGENT>` block above.

**<VALIDATE>**
```bash
test -s .archon-artifacts/verification.md && echo "PASS: verification.md exists" || echo "FAIL: verification.md missing"
grep -qi "confirmed" .archon-artifacts/verification.md 2>/dev/null && echo "PASS: plan confirmed" || echo "WARN: plan may have issues"
```
**</VALIDATE>**

---

## Phase 3: IMPLEMENT — Execute Plan Tasks

<SUBAGENT>
description: idea-to-pr: IMPLEMENT — {feature description from input.txt}
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/plan.md

Execute EVERY task in the plan IN ORDER. After EACH file change:
1. Run type-check: npx tsc --noEmit 2>&1 || true
2. Run lint: npx eslint . 2>&1 || true
3. If validation fails, fix before next task

For CREATE tasks: read existing similar files to mirror patterns.
For UPDATE tasks: read the file before editing.

Write progress to .archon-artifacts/implementation.md:
- Each task completed with files changed
- Any issues encountered and how they were resolved
- Final validation status

Strictly follow the plan. Do NOT add scope beyond what's planned.
</PROMPT>

### PHASE_3_CHECKPOINT
- [ ] `.archon-artifacts/implementation.md` exists
- [ ] Every task from the plan was executed
- [ ] Type-check passes after each change (or N/A)
- [ ] Lint passes after each change (or N/A)
- [ ] No scope beyond the plan was added
- [ ] Implementation log documents all changes

**Checkpoint passed?** Proceed to Phase 4.
**Checkpoint failed?** Re-run the `<SUBAGENT>` block above with failure details appended to `<PROMPT>`.

**<VALIDATE>**
```bash
test -s .archon-artifacts/implementation.md && echo "PASS: implementation.md exists" || echo "FAIL: implementation.md missing"
```
**</VALIDATE>**

---

## Phase 4: VALIDATE — Full Validation Suite

<SUBAGENT>
description: idea-to-pr: VALIDATE — {feature description from input.txt}
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/plan.md for validation commands.

Run ALL of these:
1. Type-check: npx tsc --noEmit 2>&1
2. Lint: npx eslint . 2>&1 || true
3. Format: npx prettier --check . 2>&1 || true
4. Tests: npx vitest run 2>&1 || npx jest 2>&1 || npm test 2>&1 || echo "No test runner"
5. Build: npm run build 2>&1 || npx vite build 2>&1 || echo "No build command"

If anything fails, fix it and re-run.
Write results to .archon-artifacts/validation.md with PASS/FAIL per check.
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] `.archon-artifacts/validation.md` exists
- [ ] Type-check: PASS or N/A
- [ ] Lint: PASS or N/A
- [ ] Format: PASS or N/A
- [ ] Tests: PASS or "No test runner"
- [ ] Build: PASS or "No build command"
- [ ] **GATE**: If ANY check FAILED -> fix and re-run `<SUBAGENT>` block

**Checkpoint passed?** Proceed to Phase 5.
**Checkpoint failed?** Re-run the `<SUBAGENT>` block above (subagent fixes and re-validates).

**<VALIDATE>**
```bash
test -s .archon-artifacts/validation.md && echo "PASS: validation.md exists" || echo "FAIL: validation.md missing"
```
**</VALIDATE>**

---

## Phase 5: FINALIZE — Commit & Pull Request

<SUBAGENT>
description: idea-to-pr: FINALIZE — {feature description from input.txt}
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/plan.md for feature name.
Read .archon-artifacts/validation.md for validation results.

ONLY proceed if Phase 4 validation PASSED.

1. Stage everything: git add -A
2. Show what's being committed: git diff --cached --stat
3. Commit with message format: feat: {feature name from plan}
4. Push: git push -u origin HEAD 2>&1
5. Create PR:
   gh pr view HEAD --json url 2>/dev/null || gh pr create \
    --title "{feature name}" \
    --body "## Summary\n## Changes\n## Test Plan"

Write summary to .archon-artifacts/summary.md.
</PROMPT>

### PHASE_5_CHECKPOINT
- [ ] Phase 4 validation passed (check `.archon-artifacts/validation.md`)
- [ ] **GATE**: If validation FAILED -> do NOT commit. Stop and report failure.
- [ ] All changes staged with `git add -A`
- [ ] Commit message matches `feat: {feature name}` format
- [ ] Changes pushed to origin
- [ ] PR created (or "manual PR needed" if `gh` unavailable)
- [ ] `.archon-artifacts/summary.md` written

**Checkpoint passed?** Proceed to Report.
**Checkpoint failed?** Re-run the `<SUBAGENT>` block above.

**<VALIDATE>**
```bash
test -s .archon-artifacts/summary.md && echo "PASS: summary.md exists" || echo "FAIL: summary.md missing"
```
**</VALIDATE>**

---

## Report

1. Read `.archon-artifacts/summary.md`
2. Output the EXACT text below, replacing only `{placeholder}` values with actual content:

```
===============================================================
IDEA-TO-PR — COMPLETE
===============================================================

Feature: {feature name from summary.md}
Branch: {current branch name}
PR: {PR url or "manual PR needed"}

-- Artifacts --
.archon-artifacts/plan.md
.archon-artifacts/verification.md
.archon-artifacts/implementation.md
.archon-artifacts/validation.md
.archon-artifacts/summary.md
===============================================================
```

### REPORT_CHECKPOINT
- [ ] `.archon-artifacts/summary.md` read
- [ ] Banner displayed with exact formatting (`===` lines, `-- Artifacts --`, artifact list)
- [ ] Feature name, branch, and PR status filled in correctly
- [ ] No extra text before or after the banner

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Skipping Phase 2 (validate plan) | Plan has stale references, implementation hits dead ends | Always run Phase 2 |
| Implementing during Phase 1 | Plan has code biases, scope creep | Phase 1 is plan-only — checkpoint enforces this |
| Running phases in wrong order | Plan not validated before implementation, validation not confirmed before finalize | Follow phases 1→2→3→4→5 strictly |
| Reusing same subagent across phases | Subagent carries prior context, loses isolation guarantee | Always use fresh Task tool call per phase |
| Proceeding past a failed VALIDATE | Broken code committed or PR'd | Every VALIDATE is a hard gate — do not pass |

## Red Flags — Stop and Reassess

- The feature description is vague or lacks user-facing behavior
- You're tempted to skip Phase 2 because "the plan looks good"
- You modified the plan during Phase 3 without re-running Phase 2
- A VALIDATE block failed and you're thinking "it's probably fine"
- You're writing code for a future phase during an earlier phase
- The `.archon-artifacts/` directory already has stale files from a prior run
- You're considering reusing a subagent to "save time"

**All of these mean: Stop. Fix the root cause. Do not proceed.**
