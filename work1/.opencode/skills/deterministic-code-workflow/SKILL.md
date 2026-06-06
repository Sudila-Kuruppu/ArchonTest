---
name: deterministic-code-workflow
description: Implement code changes using deterministic subagent phases with YAML plans, retry logic, question permission, and optional PR pipeline. Triggers: "implement feature", "write code with subagent", "deterministic workflow", "dcw", "code workflow"
argument-hint: "<feature description>"
---

# deterministic-code-workflow (DCW)

**Core principle:** The orchestrator ONLY dispatches — it NEVER executes phase work directly. Every phase runs as a fresh subagent that loads its own sub-skill. This keeps the main context clean and ensures each phase starts with zero contamination from previous work.

**You MUST NOT:**
- Execute any phase work yourself
- Read or follow sub-skill instructions meant for a subagent
- Skip or combine phases
- Proceed past a failed VALIDATE without retry or user decision

## Execution Protocol

For each phase:

1. Call the Task tool with `description`, `subagent_type`, `prompt` as specified
2. Do NOT read the sub-skill — the subagent loads it via the skill tool
3. Run the `<VALIDATE>` block
4. If VALIDATE passes → proceed to next phase
5. If VALIDATE fails → follow the **Retry Protocol**

### Retry Protocol

```
MAX_RETRIES = 3

1. Collect failure output from the VALIDATE block
2. Increment retry_attempt counter
3. If retry_attempt < MAX_RETRIES:
   - Re-dispatch the SAME subagent_type
   - Append to prompt: "PREVIOUS ATTEMPT FAILED (attempt {N}). Failure: {details}. Fix these issues."
4. If retry_attempt >= MAX_RETRIES:
   - Use question tool: "Phase {NAME} failed after {MAX_RETRIES} retries. What should I do?"
   - Options: "Retry with guidance", "Skip phase", "Abort workflow"
   - Follow user's choice
```

---

## Setup

```bash
mkdir -p .archon-artifacts
```

Save the user's feature description as `.archon-artifacts/input.txt`.

### SETUP_CHECKPOINT
- [ ] `.archon-artifacts/` created
- [ ] `input.txt` written with the feature description

---

## Phase 1: DISCOVER

Subagent explores codebase + web search. Uses `question` tool if ambiguous.

**<SUBAGENT>**
description: DCW: DISCOVER
subagent_type: dcw-discover
**</SUBAGENT>**
**<PROMPT>**
You are the DISCOVER subagent for deterministic-code-workflow.

1. Load the skill named `deterministic-code-workflow-discover` using the skill tool
2. Follow its instructions exactly — explore codebase AND use web search
3. Write output to `.archon-artifacts/discovery.md`
4. Return a summary of what you found

Use the `question` tool if the feature description is unclear.
**</PROMPT>**

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/discovery.md` exists with all template sections
- [ ] Codebase patterns documented with file:line references
- [ ] Web research completed and documented
- [ ] Integration points identified

**<VALIDATE>**
```bash
test -s .archon-artifacts/discovery.md && echo "PASS: discovery.md exists" || echo "FAIL: discovery.md missing"
grep -q "DCW DISCOVER" .archon-artifacts/discovery.md 2>/dev/null && echo "PASS: has DCW DISCOVER header" || echo "FAIL: missing DCW DISCOVER header"
grep -q "Web Research" .archon-artifacts/discovery.md 2>/dev/null && echo "PASS: has Web Research" || echo "FAIL: missing Web Research"
```
**</VALIDATE>**

---

## Phase 2: PLAN

Subagent creates YAML plan + plan.md. Deterministic task list.

**<SUBAGENT>**
description: DCW: PLAN
subagent_type: dcw-plan
**</SUBAGENT>**
**<PROMPT>**
You are the PLAN subagent for deterministic-code-workflow.

1. Load the skill named `deterministic-code-workflow-plan` using the skill tool
2. Follow its instructions exactly
3. Write `.archon-artifacts/plan.yaml` and `.archon-artifacts/plan.md`
4. Return a summary of the plan

Use the `question` tool if the feature is still unclear.
**</PROMPT>**

### PHASE_2_CHECKPOINT
- [ ] `.archon-artifacts/plan.yaml` exists with valid task list
- [ ] `.archon-artifacts/plan.md` exists with all template sections
- [ ] Every task has: id, action, path, depends, validate
- [ ] Scope in/out documented
- [ ] No implementation code written

**<VALIDATE>**
```bash
test -s .archon-artifacts/plan.yaml && echo "PASS: plan.yaml exists" || echo "FAIL: plan.yaml missing"
test -s .archon-artifacts/plan.md && echo "PASS: plan.md exists" || echo "FAIL: plan.md missing"
grep -q "tasks:" .archon-artifacts/plan.yaml 2>/dev/null && echo "PASS: has tasks" || echo "FAIL: missing tasks"
grep -q "DCW PLAN" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: has DCW PLAN header" || echo "FAIL: missing DCW PLAN header"
```
**</VALIDATE>**

---

## Phase 3: IMPLEMENT

Subagent executes each task in order with per-task validation.

**<SUBAGENT>**
description: DCW: IMPLEMENT
subagent_type: dcw-implement
**</SUBAGENT>**
**<PROMPT>**
You are the IMPLEMENT subagent for deterministic-code-workflow.

1. Load the skill named `deterministic-code-workflow-implement` using the skill tool
2. Follow its instructions exactly
3. Execute tasks from plan.yaml in dependency order
4. Write `.archon-artifacts/implementation.md`
5. Return a completion summary

Use the `question` tool for design decisions and failure guidance.
**</PROMPT>**

### PHASE_3_CHECKPOINT
- [ ] `.archon-artifacts/implementation.md` exists with all template sections
- [ ] Every plan task was executed (or documented and user-approved skip)
- [ ] Per-task validation passed (or documented)
- [ ] No scope was added beyond the plan

**<VALIDATE>**
```bash
test -s .archon-artifacts/implementation.md && echo "PASS: implementation.md exists" || echo "FAIL: implementation.md missing"
grep -q "DCW IMPLEMENT" .archon-artifacts/implementation.md 2>/dev/null && echo "PASS: has DCW IMPLEMENT header" || echo "FAIL: missing DCW IMPLEMENT header"
```
**</VALIDATE>**

---

## Phase 4: VALIDATE

Subagent runs full validation suite.

**<SUBAGENT>**
description: DCW: VALIDATE
subagent_type: dcw-validate
**</SUBAGENT>**
**<PROMPT>**
You are the VALIDATE subagent for deterministic-code-workflow.

1. Load the skill named `deterministic-code-workflow-validate` using the skill tool
2. Follow its instructions exactly
3. Run all validation checks
4. Write `.archon-artifacts/validation.md`
5. Return PASS/FAIL per check

Use the `question` tool for failures you cannot fix.
**</PROMPT>**

### PHASE_4_CHECKPOINT
- [ ] `.archon-artifacts/validation.md` exists with all template sections
- [ ] Type-check: PASS or N/A
- [ ] Lint: PASS or N/A
- [ ] Tests: PASS or "No test runner"
- [ ] Build: PASS or "No build command"
- [ ] **GATE**: If any check FAILED → retry or ask user before proceeding

**<VALIDATE>**
```bash
test -s .archon-artifacts/validation.md && echo "PASS: validation.md exists" || echo "FAIL: validation.md missing"
grep -q "DCW VALIDATE" .archon-artifacts/validation.md 2>/dev/null && echo "PASS: has DCW VALIDATE header" || echo "FAIL: missing DCW VALIDATE header"
```
**</VALIDATE>**

---

## Phase 5: FINALIZE

Subagent asks user, then optionally runs git/PR.

**<SUBAGENT>**
description: DCW: FINALIZE
subagent_type: dcw-finalize
**</SUBAGENT>**
**<PROMPT>**
You are the FINALIZE subagent for deterministic-code-workflow.

1. Load the skill named `deterministic-code-workflow-finalize` using the skill tool
2. Follow its instructions exactly
3. Ask user what they want to do
4. Write `.archon-artifacts/summary.md`
5. Return final status

Use the `question` tool to ask user's choice and handle errors.
**</PROMPT>**

### PHASE_5_CHECKPOINT
- [ ] `.archon-artifacts/summary.md` exists with all template sections
- [ ] User was asked about git/PR workflow
- [ ] Their choice was executed (or documented if skipped)
- [ ] Any git errors were reported

**<VALIDATE>**
```bash
test -s .archon-artifacts/summary.md && echo "PASS: summary.md exists" || echo "FAIL: summary.md missing"
grep -q "DCW Summary" .archon-artifacts/summary.md 2>/dev/null && echo "PASS: has DCW Summary header" || echo "FAIL: missing DCW Summary header"
```
**</VALIDATE>**

---

## Report

1. Read `.archon-artifacts/summary.md`
2. Output the completion banner:

```
===============================================================
DCW — COMPLETE
===============================================================

Feature: {name}
Phases completed: DISCOVER → PLAN → IMPLEMENT → VALIDATE → FINALIZE
Git/PR: {A - Full | B - Skipped | C - Staged | D - Nothing}

-- Artifacts --
.archon-artifacts/discovery.md
.archon-artifacts/plan.yaml
.archon-artifacts/plan.md
.archon-artifacts/implementation.md
.archon-artifacts/validation.md
.archon-artifacts/summary.md
===============================================================
```

### REPORT_CHECKPOINT
- [ ] All artifacts verified to exist
- [ ] Banner displayed with exact formatting
- [ ] Feature name, phases, and PR status filled in

## Artifact Template Contract

Every `.md` artifact follows this structure for **deterministic consistency** across all runs:

```
# DCW {PHASE} — {Title}

## Meta
- **Feature:** {name}
- **Phase:** {phase}
- **Date:** {date}

... phase-specific sections ...

---
*DCW artifact — generated by deterministic-code-workflow*
```

This means you can compare artifacts from different runs and see the same structure every time.

## Common Mistakes

| Mistake | Fix |
|---------|------|
| Writing code directly instead of dispatching | Delete the code, re-dispatch subagent |
| Reading sub-skill content yourself | Close it. Subagent loads it fresh. |
| Proceeding past failed VALIDATE | Apply retry protocol or ask user |
| Skipping Phase 1 (Discover) | Always explore + web search first |
| Artifact missing DCW header template | Every .md must start with `# DCW {PHASE}` |
| Combining IMPLEMENT + VALIDATE | Separate phases — validate is an independent gate |
