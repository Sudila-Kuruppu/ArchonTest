---
name: archon-architect
description: |
  Use when: User wants an architectural sweep, complexity reduction, or codebase health improvement.
  Triggers: "architect", "simplify codebase", "reduce complexity", "architectural sweep",
            "clean up architecture", "codebase health", "fix architecture", "archon-architect".
  Capability: Scans codebase metrics -> analyzes architecture with principled lens ->
              plans targeted simplifications -> executes fixes with self-review loops ->
              validates -> creates PR.
  NOT for: Single-file fixes, feature development, bug fixes, PR reviews.
argument-hint: "<focus area or 'general sweep'>"
---

# Archon Architect: Deterministic Codebase Health Improvement

**Core principle:** Each phase runs as a **fresh subagent** via the Task tool with zero memory of prior conversation. Phases communicate ONLY through `.archon-artifacts/` on disk.

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

**Rule:** Call the Task tool with:
- `description` = the value from `<SUBAGENT>`
- `subagent_type` = the value from `<SUBAGENT>`
- `prompt` = all text between `<PROMPT>` and `</PROMPT>`

**Do NOT execute the prompt yourself.** Always delegate via Task tool.

**After the subagent returns:** verify the `### PHASE_N_CHECKPOINT` checklist, then proceed to the next phase.

### VALIDATE PROTOCOL

When you see `<VALIDATE>` with a bash code block, execute the commands:

**<VALIDATE>**
```bash
<commands>
```
**</VALIDATE>**

**Rule:** Run every command in the bash block. If any fail, fix before proceeding.

---

## Setup

```bash
mkdir -p .archon-artifacts
echo "$ARGUMENTS" > .archon-artifacts/input.txt
```

### SETUP_CHECKPOINT
- [ ] `.archon-artifacts/` directory created
- [ ] `input.txt` written with the focus area description
- [ ] Working directory is the project root

---

## Phase 1: MEASURE — Gather Codebase Metrics

<SUBAGENT>
description: archon-architect: MEASURE — $(cat .archon-artifacts/input.txt 2>/dev/null || echo "general sweep")
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/input.txt for the focus area.

### 1. Gather File Size Hotspots

Find the top 30 largest source files:

```bash
FOCUS=$(cat .archon-artifacts/input.txt 2>/dev/null || echo "")
echo "=== FILE SIZE HOTSPOTS (top 30) ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | xargs wc -l 2>/dev/null | sort -rn | head -30
```

### 2. Gather Import Fan-Out

Files with more than 8 imports:

```bash
echo "=== IMPORT FAN-OUT (>8 imports) ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c "^import " {} \; 2>/dev/null | awk -F: '{if($2>8) print}' | sort -t: -k2 -rn | head -20
```

### 3. Gather Export Fan-Out

Files with more than 5 exports:

```bash
echo "=== EXPORT FAN-OUT (>5 exports) ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c "^export " {} \; 2>/dev/null | awk -F: '{if($2>5) print}' | sort -t: -k2 -rn | head -20
```

### 4. Gather Function Length Hotspots

Functions over ~50 lines:

```bash
echo "=== FUNCTION LENGTH HOTSPOTS (>50 lines) ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -l "function " {} \; 2>/dev/null | head -20
```

### 5. Gather Type-Safety Gaps

```bash
echo "=== ANY USAGE COUNT ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c ": any\| as any\|any(" {} \; 2>/dev/null | awk -F: '{if($2>0) print}' | sort -t: -k2 -rn | head -20

echo "=== ESLINT-DISABLE COUNT ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c "eslint-disable" {} \; 2>/dev/null | awk -F: '{if($2>0) print}' | sort -t: -k2 -rn | head -20
```

### 6. Save All Metrics

```bash
{
  echo "=== FILE SIZE HOTSPOTS (top 30) ==="
  find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | xargs wc -l 2>/dev/null | sort -rn | head -30
  echo ""
  echo "=== IMPORT FAN-OUT (>8 imports) ==="
  find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c "^import " {} \; 2>/dev/null | awk -F: '{if($2>8) print}' | sort -t: -k2 -rn | head -20
  echo ""
  echo "=== EXPORT FAN-OUT (>5 exports) ==="
  find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c "^export " {} \; 2>/dev/null | awk -F: '{if($2>5) print}' | sort -t: -k2 -rn | head -20
  echo ""
  echo "=== FUNCTION LENGTH HOTSPOTS ==="
  find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -l "function " {} \; 2>/dev/null | head -20
  echo ""
  echo "=== TYPE-SAFETY GAPS ==="
  echo "--- any usage ---"
  find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c ": any\| as any\|any(" {} \; 2>/dev/null | awk -F: '{if($2>0) print}' | sort -t: -k2 -rn | head -20
  echo "--- eslint-disable ---"
  find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec grep -c "eslint-disable" {} \; 2>/dev/null | awk -F: '{if($2>0) print}' | sort -t: -k2 -rn | head -20
} > .archon-artifacts/metrics.txt
```

### PHASE_1_CHECKPOINT
- [ ] File size hotspots gathered
- [ ] Import fan-out measured
- [ ] Export fan-out measured
- [ ] Function length hotspots identified
- [ ] Type-safety gaps quantified
- [ ] All metrics saved to `.archon-artifacts/metrics.txt`
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/metrics.txt` exists and is non-empty
- [ ] Metrics contain file size, import/export fan-out, function length, and type-safety data

**Checkpoint passed?** Proceed to Phase 2.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/metrics.txt && echo "PASS: metrics.txt exists" || echo "FAIL: metrics.txt missing"
```
</VALIDATE>

---

## Phase 2: ANALYZE — Architectural Assessment

<SUBAGENT>
description: archon-architect: ANALYZE — $(cat .archon-artifacts/input.txt 2>/dev/null || echo "general sweep")
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/metrics.txt and .archon-artifacts/input.txt for focus area.

### 1. Read Metrics & Top Flagged Files

```bash
cat .archon-artifacts/metrics.txt | head -60
```

### 2. For Each of the Top 10-15 Flagged Files

Read the file and assess using these criteria:

**SRP (Single Responsibility Principle):** Does the file handle more than one concern? Can you describe its purpose in one sentence without using "and"?

**Cognitive Load:** How many distinct concepts must a reader hold in working memory to understand this file? Look for deeply nested conditionals, long methods, many dependencies.

**Abstraction Value:** Does the file provide meaningful abstraction? Or does it leak implementation details, mix levels of abstraction, or have unclear boundaries?

**Dependency Direction:** Does the file depend on things at the wrong level? High-level modules depending on low-level details, or circular dependencies?

### 3. Write Structured Assessment

Write `.archon-artifacts/architecture-assessment.md` with:

**Executive Summary** (3-5 sentences)
- Overall codebase health
- Key patterns found
- Most critical concern

**Top Findings Ranked by Impact**
For each finding:
- **Rank**: #1, #2, etc.
- **File**: path
- **Issue**: what's wrong
- **Why It Matters**: impact on maintainability, development speed, bug risk
- **Estimated Effort**: small / medium / large
- **Assessment Criteria**: which criteria flag this (SRP, cognitive load, abstraction, dependency)

Do NOT make any changes. Diagnose only.
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] `.archon-artifacts/architecture-assessment.md` exists with executive summary and ranked findings
- [ ] Top 10-15 flagged files assessed using all 4 criteria
- [ ] No changes were made (diagnosis only)

**Checkpoint passed?** Proceed to Phase 3.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/architecture-assessment.md && echo "PASS: architecture-assessment.md exists" || echo "FAIL: architecture-assessment.md missing"
grep -q "Executive Summary\|Executive summary" .archon-artifacts/architecture-assessment.md 2>/dev/null && echo "PASS: has executive summary" || echo "WARN: missing executive summary"
```
</VALIDATE>

---

## Phase 3: PLAN — Prioritize & Scope Improvements

<SUBAGENT>
description: archon-architect: PLAN — $(cat .archon-artifacts/input.txt 2>/dev/null || echo "general sweep")
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/architecture-assessment.md and .archon-artifacts/input.txt for focus area.

### 1. Apply Design Principles

Evaluate each finding through these lenses:
- **KISS** (Keep It Simple, Stupid): Would a simpler solution work? Is there unnecessary complexity?
- **YAGNI** (You Ain't Gonna Need It): Is any of this complexity speculative? Could it be deferred?
- **Rule of Three**: Has the pattern been duplicated three times before abstracting? Is the abstraction premature?

### 2. Select Top 3-5 Improvements

Choose the highest-impact, lowest-risk improvements. For each:
- **Which file** (path)
- **What to change** (specific: rename, extract, inline, remove, split)
- **Why** (which principle it satisfies, what complexity it reduces)
- **Blast radius** (which other files are affected, risk level: low/medium/high)

Scope rules:
- Maximum 5-7 files total across all changes
- Changes should be independent (not blocking each other)
- Prefer deletions and simplifications over new abstractions
- Avoid changes that introduce new dependencies

### 3. Write Numbered Plan

Write `.archon-artifacts/plan.md` with:

```markdown
# Architectural Simplification Plan

**Focus**: {from input.txt}

## Summary
{2-3 sentence overview}

## Improvements

### 1. {Title}
- **File**: {path}
- **Change**: {what to do}
- **Why**: {principle + complexity reduction}
- **Blast Radius**: {affected files, risk level}

### 2. {Title}
...
```

Do NOT implement anything. Plan only.
</PROMPT>

### PHASE_3_CHECKPOINT
- [ ] `.archon-artifacts/plan.md` exists with 3-5 numbered improvements
- [ ] Each improvement has file, change, why, and blast radius
- [ ] KISS/YAGNI/Rule-of-Three principles applied
- [ ] Changes are independent, max 5-7 files
- [ ] No implementation was done (plan only)

**Checkpoint passed?** Proceed to Phase 4.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/plan.md && echo "PASS: plan.md exists" || echo "FAIL: plan.md missing"
grep -q "KISS\|YAGNI\|Rule of Three\|simpl" .archon-artifacts/plan.md 2>/dev/null && echo "PASS: principles referenced" || echo "WARN: missing principle references"
```
</VALIDATE>

---

## Phase 4: EXECUTE — Implement Simplifications

<SUBAGENT>
description: archon-architect: EXECUTE — $(cat .archon-artifacts/input.txt 2>/dev/null || echo "general sweep")
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/plan.md for the numbered improvement list.

### 1. Work Through Plan Items in Order

For each item in the plan:

1. **Read the file** to understand current state
2. **Before writing**: confirm the file is in your plan (no scope creep)
3. **Make the change** — keep it minimal, focused, and aligned with the plan
4. **Run post-edit type check**: `bun run type-check 2>&1 || npx tsc --noEmit 2>&1 || true`
5. **Re-read the changed file** to verify the improvement
6. **State why this change reduces complexity** (one sentence)
7. **Write progress** to `.archon-artifacts/implementation.md`

If a change is harder than expected (touches too many files, ripple effects), skip it and move to the next item. Document the skip and why.

### 2. After All Changes

```bash
git diff --stat
```

Write final summary to `.archon-artifacts/implementation.md`:
- Each item completed (or skipped with reason)
- Lines added/removed
- Files changed count
- Any issues encountered

### 3. Strict Rules

- Do NOT add scope beyond the plan
- Do NOT refactor unrelated code
- Each change MUST reduce complexity (simplify, not complicate)
- If type check fails after a change, fix before moving on
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] `.archon-artifacts/implementation.md` exists
- [ ] Each plan item was attempted (or documented as skipped)
- [ ] Type check passes after each change
- [ ] Changes reduce complexity (not add new features)
- [ ] `git diff --stat` confirms scope is bounded
- [ ] No scope creep beyond the plan

**Checkpoint passed?** Proceed to Phase 5.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/implementation.md && echo "PASS: implementation.md exists" || echo "FAIL: implementation.md missing"
```
</VALIDATE>

---

## Phase 5: VALIDATE — Run Validation Suite

<VALIDATE>
```bash
echo "=== TYPE CHECK ===" | tee .archon-artifacts/validation-output.txt
bun run type-check 2>&1 | tee -a .archon-artifacts/validation-output.txt
TC_EXIT=${PIPESTATUS[0]}

echo "" | tee -a .archon-artifacts/validation-output.txt
echo "=== LINT ===" | tee -a .archon-artifacts/validation-output.txt
bun run lint 2>&1 | tee -a .archon-artifacts/validation-output.txt
LINT_EXIT=${PIPESTATUS[0]}

echo "" | tee -a .archon-artifacts/validation-output.txt
echo "=== TESTS ===" | tee -a .archon-artifacts/validation-output.txt
bun run test 2>&1 | tee -a .archon-artifacts/validation-output.txt
TEST_EXIT=${PIPESTATUS[0]}

echo "" | tee -a .archon-artifacts/validation-output.txt
echo "=== RESULTS ===" | tee -a .archon-artifacts/validation-output.txt
echo "Type check: $([ $TC_EXIT -eq 0 ] && echo 'PASS' || echo 'FAIL')" | tee -a .archon-artifacts/validation-output.txt
echo "Lint: $([ $LINT_EXIT -eq 0 ] && echo 'PASS' || echo 'FAIL')" | tee -a .archon-artifacts/validation-output.txt
echo "Tests: $([ $TEST_EXIT -eq 0 ] && echo 'PASS' || echo 'FAIL')" | tee -a .archon-artifacts/validation-output.txt

if [ $TC_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $TEST_EXIT -eq 0 ]; then
  echo "VALIDATION_STATUS: PASS" | tee -a .archon-artifacts/validation-output.txt
else
  echo "VALIDATION_STATUS: FAIL" | tee -a .archon-artifacts/validation-output.txt
fi
```
</VALIDATE>

### PHASE_5_CHECKPOINT
- [ ] Type check: PASS or FAIL
- [ ] Lint: PASS or FAIL
- [ ] Tests: PASS or FAIL
- [ ] VALIDATION_STATUS determined (PASS/FAIL)

**GATE**: If VALIDATION_STATUS is FAIL -> proceed to Phase 6 to fix failures.
**GATE**: If VALIDATION_STATUS is PASS -> skip Phase 6 and proceed directly to Phase 7.

---

## Phase 6: FIX VALIDATION FAILURES

<SUBAGENT>
description: archon-architect: FIX — $(cat .archon-artifacts/input.txt 2>/dev/null || echo "general sweep")
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/validation-output.txt for validation failures.

If validation output is not available, run the validation suite to get it:

```bash
bun run type-check 2>&1 | tee .archon-artifacts/validation-output.txt
bun run lint 2>&1 | tee -a .archon-artifacts/validation-output.txt
bun run test 2>&1 | tee -a .archon-artifacts/validation-output.txt
```

### 1. Check Validation Status

```bash
grep "VALIDATION_STATUS" .archon-artifacts/validation-output.txt
```

If `VALIDATION_STATUS: PASS`: output "All checks passed -- no fixes needed" and stop.

### 2. Fix Only What's Broken

For each failure:
1. Identify the specific error and file
2. Fix ONLY the broken code — no additional improvements, no refactoring
3. After each fix, re-run the specific failing check
4. After all fixes, re-run the full validation suite

```bash
bun run type-check 2>&1
bun run lint 2>&1
bun run test 2>&1
```

### 3. Strict Rules

- Fix ONLY validation failures. Do NOT add improvements.
- Do NOT touch files that aren't related to failures.
- If a fix is too risky or unclear, document it and leave it.

Write results to `.archon-artifacts/fix-results.md`.
</PROMPT>

### PHASE_6_CHECKPOINT
- [ ] If VALIDATION_STATUS was PASS: "All checks passed -- no fixes needed" output
- [ ] If VALIDATION_STATUS was FAIL: fix attempt made for each failure
- [ ] No scope creep (only failures fixed, no improvements)
- [ ] `.archon-artifacts/fix-results.md` exists (or PASS condition documented)

**Checkpoint passed?** Proceed to Phase 7.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/fix-results.md 2>/dev/null && echo "PASS: fix-results.md exists" || echo "INFO: no fix-results.md (may be PASS condition)"
```
</VALIDATE>

---

## Phase 7: CREATE PR

<SUBAGENT>
description: archon-architect: PR — $(cat .archon-artifacts/input.txt 2>/dev/null || echo "general sweep")
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/input.txt, .archon-artifacts/architecture-assessment.md, .archon-artifacts/plan.md, and .archon-artifacts/implementation.md for context.

Restricted to git and gh operations ONLY. Do NOT edit source files.

### 1. Stage and Commit

```bash
git add -A
git diff --cached --stat
```

Skip artifact files under `.archon-artifacts/` — they should not be committed.

```bash
git commit -m "architect: Simplify codebase — {focus area}
    
Changes:
- {summary of changes from implementation.md}
    
Review artifacts: .archon-artifacts/"
```

### 2. Push

```bash
git push -u origin HEAD 2>&1
```

If push fails (no remote, no upstream): output "Manual PR needed" and save to `.archon-artifacts/.pr-url`.

### 3. Check for Existing PR

```bash
PR_EXISTS=$(gh pr list --head "$(git branch --show-current)" --json url --jq '.[0].url' 2>/dev/null)
```

If PR already exists, use the existing URL.

### 4. Create PR

```bash
BASE_BRANCH=$(cat .archon-artifacts/input.txt 2>/dev/null | grep -oE 'base=[a-zA-Z0-9_-]+' | cut -d= -f2 || echo "main")
gh pr create \
  --base "$BASE_BRANCH" \
  --title "Architectural Sweep: {focus area}" \
  --body "## Architectural Sweep

**Focus**: {focus area from input.txt}

**Assessment Summary**:
{3-5 sentence summary from architecture-assessment.md}

### Changes

{per-change: what file, what was simplified, why}

### Validation

- Type check: PASS
- Lint: PASS
- Tests: PASS"
```

### 5. Save PR URL

```bash
PR_URL=$(gh pr view --json url --jq '.url' 2>/dev/null || echo "manual PR needed")
echo "$PR_URL" > .archon-artifacts/.pr-url
```

### 6. Verify PR Base Branch

```bash
CURRENT_BASE=$(gh pr view --json baseRefName --jq '.baseRefName' 2>/dev/null)
EXPECTED_BASE=$(cat .archon-artifacts/input.txt 2>/dev/null | grep -oE 'base=[a-zA-Z0-9_-]+' | cut -d= -f2 || echo "main")
if [ -n "$CURRENT_BASE" ] && [ "$CURRENT_BASE" != "$EXPECTED_BASE" ]; then
  echo "WARNING: PR base branch is $CURRENT_BASE, expected $EXPECTED_BASE"
fi
```
</PROMPT>

### PHASE_7_CHECKPOINT
- [ ] Changes staged and committed
- [ ] Changes pushed to remote (or "manual PR needed" documented)
- [ ] PR created or existing PR detected
- [ ] `.archon-artifacts/.pr-url` saved with URL (or "manual PR needed")
- [ ] PR base branch verified against expected

**Checkpoint passed?** Proceed to Report.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/.pr-url && echo "PASS: .pr-url exists" || echo "FAIL: .pr-url missing"
```
</VALIDATE>

---

## Report

1. Read `.archon-artifacts/input.txt` for focus area
2. Read `.archon-artifacts/.pr-url` for PR URL
3. Read `.archon-artifacts/implementation.md` for changes summary
4. Output the EXACT text below, replacing `{placeholder}` values:

```
===============================================================
ARCHON ARCHITECT — COMPLETE
===============================================================

Focus: {focus area from input.txt}
Branch: {current branch name}
PR: {PR URL or "manual PR needed"}

-- Phases --
  ✅ measure
  ✅ analyze
  ✅ plan
  ✅ simplify
  ✅ validate
  ✅ fix-failures
  ✅ create-pr

-- Artifacts --
.archon-artifacts/metrics.txt
.archon-artifacts/architecture-assessment.md
.archon-artifacts/plan.md
.archon-artifacts/validation-output.txt
.archon-artifacts/.pr-url
===============================================================
```

### REPORT_CHECKPOINT
- [ ] All 7 phases listed with checkmarks
- [ ] All 5 artifact paths listed
- [ ] PR URL captured
- [ ] Banner uses exact formatting (`===` lines, `-- Phases --`, `-- Artifacts --`)
