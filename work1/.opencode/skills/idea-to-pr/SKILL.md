---
name: idea-to-pr
description: Use when user wants to implement a feature from idea to PR using isolated subagents
argument-hint: "<feature description>"
---

# Idea-to-PR: Orchestrator

**Core principle:** Every phase runs as a fresh subagent that loads its own instructions via the skill tool. The orchestrator NEVER executes phase work directly — it only dispatches.

**You MUST NOT:**
- Execute any phase work yourself
- Read or follow instructions meant for a sub-skill
- Skip a phase or combine phases

## When to Use

- "implement feature X", "build this feature", "turn this into code"
- "create a PR for", "idea to pr", "from idea to pr"

**When NOT to use:**
- Quick edits or one-off changes
- Bug fixes (use systematic-debugging skill)
- Refactoring-only tasks (use architect skill instead)

## Execution Protocol

For each phase below:

1. Call the Task tool with `description`, `subagent_type`, and `prompt` as specified
2. Do NOT read the sub-skill's instructions — the subagent loads them via the skill tool
3. After the subagent returns, run the `<VALIDATE>` block and check the checkpoint
4. Only proceed if all checks pass

## Quick Reference

| Phase | Subagent Type | Input | Output | Gate |
|-------|---------------|-------|--------|------|
| **Setup** | (inline) | `$ARGUMENTS` | `.archon-artifacts/input.txt` | Files exist |
| **1: PLAN** | general | `input.txt` | `plan.md` | Plan complete |
| **2: VALIDATE PLAN** | general | `plan.md` | `verification.md` | All refs confirmed |
| **3: IMPLEMENT** | general | `plan.md` | `implementation.md` | Tasks done cleanly |
| **4: VALIDATE** | general | `plan.md` | `validation.md` | All checks pass |
| **5: FINALIZE** | general | `validation.md` | `summary.md` | PR created |

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

## Phase 1: PLAN

Dispatch a subagent. Tell it to load the `idea-to-pr-plan` skill.

**<SUBAGENT>**
description: idea-to-pr: PLAN
subagent_type: general
**</SUBAGENT>**
**<PROMPT>**
You are the PLAN subagent for idea-to-pr.

1. Load the skill named `idea-to-pr-plan` using the skill tool
2. Follow its instructions exactly
3. Write all output to `.archon-artifacts/`
4. Return a summary of what you did

Use the `question` tool if you need to ask the user anything.
**</PROMPT>**

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/plan.md` exists and is non-empty
- [ ] Plan contains: summary, UX diagram, files (CREATE/UPDATE), scope limits, tasks, testing, validation
- [ ] Each task has a `<VALIDATE>` command block
- [ ] No implementation code written (plan-only)

**Checkpoint passed?** Proceed to Phase 2.
**Checkpoint failed?** Re-run the subagent with failure details.

**<VALIDATE>**
```bash
test -s .archon-artifacts/plan.md && echo "PASS: plan.md exists" || echo "FAIL: plan.md missing"
grep -q "Summary & user story" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: has summary" || echo "FAIL: missing summary"
grep -q "NOT Building" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: has scope limits" || echo "FAIL: missing scope limits"
grep -q "<VALIDATE>" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: has validate blocks" || echo "FAIL: missing validate blocks"
```
**</VALIDATE>**

---

## Phase 2: VALIDATE PLAN

Dispatch a subagent. Tell it to load the `idea-to-pr-validate-plan` skill.

**<SUBAGENT>**
description: idea-to-pr: VALIDATE PLAN
subagent_type: general
**</SUBAGENT>**
**<PROMPT>**
You are the VALIDATE PLAN subagent for idea-to-pr.

1. Load the skill named `idea-to-pr-validate-plan` using the skill tool
2. Follow its instructions exactly
3. Write all output to `.archon-artifacts/`
4. Return CONFIRMED or list of issues found

Use the `question` tool if you need to ask the user anything.
**</PROMPT>**

### PHASE_2_CHECKPOINT
- [ ] `.archon-artifacts/verification.md` exists
- [ ] All pattern file references exist on disk
- [ ] All CREATE targets do NOT exist yet
- [ ] All UPDATE targets already exist
- [ ] All VALIDATE commands dry-run successfully
- [ ] **GATE**: If issues found -> fix plan.md first, then re-run

**Checkpoint passed?** Proceed to Phase 3.
**Checkpoint failed?** Fix plan.md, then re-run.

**<VALIDATE>**
```bash
test -s .archon-artifacts/verification.md && echo "PASS: verification.md exists" || echo "FAIL: verification.md missing"
grep -qi "confirmed" .archon-artifacts/verification.md 2>/dev/null && echo "PASS: plan confirmed" || echo "WARN: plan may have issues"
```
**</VALIDATE>**

---

## Phase 3: IMPLEMENT

Dispatch a subagent. Tell it to load the `idea-to-pr-implement` skill.

**<SUBAGENT>**
description: idea-to-pr: IMPLEMENT
subagent_type: general
**</SUBAGENT>**
**<PROMPT>**
You are the IMPLEMENT subagent for idea-to-pr.

1. Load the skill named `idea-to-pr-implement` using the skill tool
2. Follow its instructions exactly
3. Write all output to `.archon-artifacts/`
4. Return a completion summary

Use the `question` tool if you need to ask the user anything.
**</PROMPT>**

### PHASE_3_CHECKPOINT
- [ ] `.archon-artifacts/implementation.md` exists
- [ ] Every task from the plan was executed
- [ ] Type-check passes after each change (or N/A)
- [ ] Lint passes after each change (or N/A)
- [ ] No scope beyond the plan was added
- [ ] Implementation log documents all changes

**Checkpoint passed?** Proceed to Phase 4.
**Checkpoint failed?** Re-run the subagent with failure details.

**<VALIDATE>**
```bash
test -s .archon-artifacts/implementation.md && echo "PASS: implementation.md exists" || echo "FAIL: implementation.md missing"
```
**</VALIDATE>**

---

## Phase 4: VALIDATE

Dispatch a subagent. Tell it to load the `idea-to-pr-validate` skill.

**<SUBAGENT>**
description: idea-to-pr: VALIDATE
subagent_type: general
**</SUBAGENT>**
**<PROMPT>**
You are the VALIDATE subagent for idea-to-pr.

1. Load the skill named `idea-to-pr-validate` using the skill tool
2. Follow its instructions exactly
3. Write all output to `.archon-artifacts/`
4. Return PASS/FAIL per check

Use the `question` tool if you need to ask the user anything.
**</PROMPT>**

### PHASE_4_CHECKPOINT
- [ ] `.archon-artifacts/validation.md` exists
- [ ] Type-check: PASS or N/A
- [ ] Lint: PASS or N/A
- [ ] Format: PASS or N/A
- [ ] Tests: PASS or "No test runner"
- [ ] Build: PASS or "No build command"
- [ ] **GATE**: If ANY check FAILED -> fix and re-run

**Checkpoint passed?** Proceed to Phase 5.
**Checkpoint failed?** Re-run the subagent.

**<VALIDATE>**
```bash
test -s .archon-artifacts/validation.md && echo "PASS: validation.md exists" || echo "FAIL: validation.md missing"
```
**</VALIDATE>**

---

## Phase 5: FINALIZE

Dispatch a subagent. Tell it to load the `idea-to-pr-finalize` skill.

**<SUBAGENT>**
description: idea-to-pr: FINALIZE
subagent_type: general
**</SUBAGENT>**
**<PROMPT>**
You are the FINALIZE subagent for idea-to-pr.

1. Load the skill named `idea-to-pr-finalize` using the skill tool
2. Follow its instructions exactly
3. Write all output to `.archon-artifacts/`
4. Return the PR url or status

Use the `question` tool if you need to ask the user anything.
**</PROMPT>**

### PHASE_5_CHECKPOINT
- [ ] Phase 4 validation passed (check `.archon-artifacts/validation.md`)
- [ ] **GATE**: If validation FAILED -> do NOT commit. Stop and report failure.
- [ ] All changes staged with `git add -A`
- [ ] Commit message matches `feat: {feature name}` format
- [ ] Changes pushed to origin
- [ ] PR created (or "manual PR needed" if `gh` unavailable)
- [ ] `.archon-artifacts/summary.md` written

**Checkpoint passed?** Proceed to Report.
**Checkpoint failed?** Re-run the subagent.

**<VALIDATE>**
```bash
test -s .archon-artifacts/summary.md && echo "PASS: summary.md exists" || echo "FAIL: summary.md missing"
```
**</VALIDATE>**

---

## Report

1. Read `.archon-artifacts/summary.md`
2. Output the exact report banner with values filled in:

```
===============================================================
IDEA-TO-PR — COMPLETE
===============================================================

Feature: {feature name}
Branch: {branch}
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
- [ ] Banner displayed with exact formatting
- [ ] Feature name, branch, and PR status filled in
- [ ] No extra text before or after the banner

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Executing phase work directly | Contaminated output, scope creep | Delete work, re-dispatch subagent |
| Reading sub-skill content yourself | Context contamination, bias | Close the file. Subagent loads it fresh. |
| Skipping Phase 2 | Stale plan references | Always run Phase 2 |
| Proceeding past failed VALIDATE | Broken code committed | Every VALIDATE is a hard gate |
| Reusing same subagent across phases | Prior context leaks | Always use fresh Task tool call |

## Red Flags

- You're reading sub-skill files to "understand what the subagent will do"
- You wrote code directly instead of dispatching
- You're tempted to skip a VALIDATE block
- You think "I can do this phase faster myself"
- You combined multiple phases into one dispatch

**All of these mean: Stop. Delete any direct work. Dispatch a fresh subagent.**
