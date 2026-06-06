---
name: archon-idea-to-pr
description: |
  Use when: You have a feature idea or description and want end-to-end development.
  Triggers: "idea to pr", "implement feature", "from idea to pr", "turn this into code",
            "build this feature", "implement this", "create a PR for", "opencode-idea-to-pr".
  Capability: End-to-end idea to PR workflow using fresh subagents per phase.
              Each subagent loads its dedicated sub-skill via skill tool.
              17 focused sub-skills under .opencode/skills/archon-idea-to-pr/
  Phases: Phase 1: CREATE-PLAN -> Phase 2: PLAN-SETUP -> Phase 3: CONFIRM-PLAN -> Phase 4: IMPLEMENT-TASKS -> Phase 5: VALIDATE -> Phase 6: FINALIZE-PR -> Phase 7: VERIFY-PR-BASE -> Phase 8: REVIEW-SCOPE -> Phase 9: SYNC -> Phase 10: PARALLEL-REVIEW-10 -> Phase 11: SYNTHESIZE -> Phase 12: IMPLEMENT-FIXES -> Phase 13: WORKFLOW-SUMMARY.
  NOT for: Executing existing plans (use archon-plan-to-pr), quick fixes, standalone reviews.
argument-hint: "<feature description or PRD path>"
---

# Archon-Idea-To-Pr: Orchestrated Skill with Sub-Skill Loading

**Core principle:** Each phase runs as a **fresh subagent** via the Task tool with zero memory of prior conversation. Each subagent independently loads its dedicated sub-skill via the `skill` tool and follows its instructions. Phases communicate ONLY through `.archon-artifacts/` on disk.

## EXECUTION PROTOCOLS

These protocols are NOT suggestions. When you see a protocol block, you MUST follow its rule exactly.

### SUBAGENT PROTOCOL

When you see `<SUBAGENT>` followed by `<PROMPT>`, you MUST execute them as a Task tool call:

```
<SUBAGENT>
description: <value>
subagent_type: <value>
</SUBAGENT>
<PROMPT>
<prompt text>
</PROMPT>
```

**Rule:** Call the Task tool with `description`, `subagent_type`, and `prompt`. Do NOT execute the prompt yourself.

### SUBAGENT SKILL LOADING

Each subagent is instructed to load its sub-skill via `skill(name="<name>")` at the start of its prompt.
The subagent then follows the sub-skill instructions and writes results to `.archon-artifacts/phase-N-output.txt`.

### VALIDATE PROTOCOL

Run every command in the `<VALIDATE>` bash block. If any fail, fix before proceeding.

---

## Setup

```bash
mkdir -p .archon-artifacts
echo "$ARGUMENTS" > .archon-artifacts/input.txt
```

### SETUP_CHECKPOINT
- [ ] `.archon-artifacts/` created
- [ ] `input.txt` written

---

## Phase 1: create-plan

### create-plan

<SUBAGENT>
description: archon-idea-to-pr: Phase 1 - create-plan
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-create-plan` using the skill tool: `skill(name="archon-idea-to-pr-create-plan")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-1-output.txt`.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] Subagent(s) completed Phase 1
- [ ] `.archon-artifacts/phase-1-output.txt` exists

**Checkpoint passed?** Proceed to Phase 2.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-1-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 2: plan-setup

### plan-setup

<SUBAGENT>
description: archon-idea-to-pr: Phase 2 - plan-setup
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-plan-setup` using the skill tool: `skill(name="archon-idea-to-pr-plan-setup")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-2-output.txt`.
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] Subagent(s) completed Phase 2
- [ ] `.archon-artifacts/phase-2-output.txt` exists

**Checkpoint passed?** Proceed to Phase 3.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-2-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 3: confirm-plan

### confirm-plan

<SUBAGENT>
description: archon-idea-to-pr: Phase 3 - confirm-plan
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-confirm-plan` using the skill tool: `skill(name="archon-idea-to-pr-confirm-plan")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-3-output.txt`.
</PROMPT>

### PHASE_3_CHECKPOINT
- [ ] Subagent(s) completed Phase 3
- [ ] `.archon-artifacts/phase-3-output.txt` exists

**Checkpoint passed?** Proceed to Phase 4.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-3-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 4: implement-tasks

### implement-tasks

<SUBAGENT>
description: archon-idea-to-pr: Phase 4 - implement-tasks
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-implement-tasks` using the skill tool: `skill(name="archon-idea-to-pr-implement-tasks")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-4-output.txt`.
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] Subagent(s) completed Phase 4
- [ ] `.archon-artifacts/phase-4-output.txt` exists

**Checkpoint passed?** Proceed to Phase 5.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-4-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 5: validate

### validate

<SUBAGENT>
description: archon-idea-to-pr: Phase 5 - validate
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-validate` using the skill tool: `skill(name="archon-idea-to-pr-validate")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-5-output.txt`.
</PROMPT>

### PHASE_5_CHECKPOINT
- [ ] Subagent(s) completed Phase 5
- [ ] `.archon-artifacts/phase-5-output.txt` exists

**Checkpoint passed?** Proceed to Phase 6.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-5-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 6: finalize-pr

### finalize-pr

<SUBAGENT>
description: archon-idea-to-pr: Phase 6 - finalize-pr
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-finalize-pr` using the skill tool: `skill(name="archon-idea-to-pr-finalize-pr")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-6-output.txt`.
</PROMPT>

### PHASE_6_CHECKPOINT
- [ ] Subagent(s) completed Phase 6
- [ ] `.archon-artifacts/phase-6-output.txt` exists

**Checkpoint passed?** Proceed to Phase 7.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-6-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 7: verify-pr-base

### verify-pr-base

<SUBAGENT>
description: archon-idea-to-pr: Phase 7 - verify-pr-base
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-verify-pr-base` using the skill tool: `skill(name="archon-idea-to-pr-verify-pr-base")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-7-output.txt`.
</PROMPT>

### PHASE_7_CHECKPOINT
- [ ] Subagent(s) completed Phase 7
- [ ] `.archon-artifacts/phase-7-output.txt` exists

**Checkpoint passed?** Proceed to Phase 8.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-7-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 8: review-scope

### review-scope

<SUBAGENT>
description: archon-idea-to-pr: Phase 8 - review-scope
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-review-scope` using the skill tool: `skill(name="archon-idea-to-pr-pr-review-scope")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-8-output.txt`.
</PROMPT>

### PHASE_8_CHECKPOINT
- [ ] Subagent(s) completed Phase 8
- [ ] `.archon-artifacts/phase-8-output.txt` exists

**Checkpoint passed?** Proceed to Phase 9.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-8-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 9: sync

### sync

<SUBAGENT>
description: archon-idea-to-pr: Phase 9 - sync
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-sync` using the skill tool: `skill(name="archon-idea-to-pr-sync-pr-with-main")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-9-output.txt`.
</PROMPT>

### PHASE_9_CHECKPOINT
- [ ] Subagent(s) completed Phase 9
- [ ] `.archon-artifacts/phase-9-output.txt` exists

**Checkpoint passed?** Proceed to Phase 10.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-9-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 10: parallel-review-10

**Note:** This phase has multiple parallel tasks. Deploy separate subagents for each.

### code-review

<SUBAGENT>
description: archon-idea-to-pr: Phase 10 - code-review
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-code-review` using the skill tool: `skill(name="archon-idea-to-pr-code-review-agent")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-10-code-review-output.txt`.
</PROMPT>

### error-handling

<SUBAGENT>
description: archon-idea-to-pr: Phase 10 - error-handling
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-error-handling` using the skill tool: `skill(name="archon-idea-to-pr-error-handling-agent")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-10-error-handling-output.txt`.
</PROMPT>

### test-coverage

<SUBAGENT>
description: archon-idea-to-pr: Phase 10 - test-coverage
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-test-coverage` using the skill tool: `skill(name="archon-idea-to-pr-test-coverage-agent")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-10-test-coverage-output.txt`.
</PROMPT>

### comment-quality

<SUBAGENT>
description: archon-idea-to-pr: Phase 10 - comment-quality
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-comment-quality` using the skill tool: `skill(name="archon-idea-to-pr-comment-quality-agent")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-10-comment-quality-output.txt`.
</PROMPT>

### docs-impact

<SUBAGENT>
description: archon-idea-to-pr: Phase 10 - docs-impact
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-docs-impact` using the skill tool: `skill(name="archon-idea-to-pr-docs-impact-agent")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-10-docs-impact-output.txt`.
</PROMPT>

### PHASE_10_CHECKPOINT
- [ ] All 5 parallel subagents completed
### PHASE_10_CHECKPOINT
```bash
test -s .archon-artifacts/phase-10-code-review-output.txt && test -s .archon-artifacts/phase-10-error-handling-output.txt && test -s .archon-artifacts/phase-10-test-coverage-output.txt && test -s .archon-artifacts/phase-10-comment-quality-output.txt && test -s .archon-artifacts/phase-10-docs-impact-output.txt && echo "PASS" || echo "FAIL: parallel outputs missing"
```
</VALIDATE>

---

## Phase 11: synthesize

### synthesize

<SUBAGENT>
description: archon-idea-to-pr: Phase 11 - synthesize
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-synthesize` using the skill tool: `skill(name="archon-idea-to-pr-synthesize-review")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-11-output.txt`.
</PROMPT>

### PHASE_11_CHECKPOINT
- [ ] Subagent(s) completed Phase 11
- [ ] `.archon-artifacts/phase-11-output.txt` exists

**Checkpoint passed?** Proceed to Phase 12.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-11-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 12: implement-fixes

### implement-fixes

<SUBAGENT>
description: archon-idea-to-pr: Phase 12 - implement-fixes
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-implement-fixes` using the skill tool: `skill(name="archon-idea-to-pr-implement-review-fixes")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-12-output.txt`.
</PROMPT>

### PHASE_12_CHECKPOINT
- [ ] Subagent(s) completed Phase 12
- [ ] `.archon-artifacts/phase-12-output.txt` exists

**Checkpoint passed?** Proceed to Phase 13.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-12-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Phase 13: workflow-summary

### workflow-summary

<SUBAGENT>
description: archon-idea-to-pr: Phase 13 - workflow-summary
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `archon-idea-to-pr-workflow-summary` using the skill tool: `skill(name="archon-idea-to-pr-workflow-summary")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-13-output.txt`.
</PROMPT>

### PHASE_13_CHECKPOINT
- [ ] Subagent(s) completed Phase 13
- [ ] `.archon-artifacts/phase-13-output.txt` exists

<VALIDATE>
```bash
test -s .archon-artifacts/phase-13-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>

---

## Report

### REPORT_CHECKPOINT
- [ ] All phases completed
- [ ] Report banner displayed