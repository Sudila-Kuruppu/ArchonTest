---
name: archon-idea-to-pr-workflow-summary
description: |
  Use when: Running the workflow-summary phase of archon-idea-to-pr.
  Final workflow summary with decision matrix for follow-up actions
  Command from: archon-workflow-summary
  NOT for: Standalone use outside archon-idea-to-pr workflow.
argument-hint: (no arguments - reads from workflow artifacts)
---

# Sub-skill: workflow-summary

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
description: archon-idea-to-pr-workflow-summary: Setup
subagent_type: general
</SUBAGENT>
<PROMPT>
# Workflow Summary

**Workflow ID**: $WORKFLOW_ID

---

## Your Mission

Create the final summary report for the workflow run:
1. Summarize what was implemented vs the plan
2. List deviations and their rationale
3. Surface unfixed review findings (MEDIUM/LOW)
4. Create actionable follow-up recommendations
5. Post to GitHub PR as a comment
6. Write artifact for future reference

**Output**: Decision matrix the user can act on quickly.

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

## Phase 1: LOAD - Gather ALL Artifacts

<SUBAGENT>
description: archon-idea-to-pr-workflow-summary: Phase 1 - LOAD - Gather ALL Artifacts
subagent_type: general
</SUBAGENT>
<PROMPT>
**CRITICAL**: Read EVERY artifact from the workflow run. Miss nothing.

### 1.1 Scan Workflow Artifacts Directory

```bash
# List all artifacts from this workflow run
ls -la .archon-artifacts/

# Read each one
for file in .archon-artifacts/*.md; do
  echo "=== $file ==="
  cat "$file"
done
```

**Expected artifacts**:
- `plan-context.md` - Plan summary, scope limits, acceptance criteria
- `plan-confirmation.md` - Pattern verification results
- `implementation.md` - Tasks done, deviations, issues encountered
- `validation.md` - Test/lint/build results
- `pr-ready.md` - PR number, URL, final commit
- `.pr-number` - PR number registry file
- `.pr-url` - PR URL registry file

### 1.2 Scan Review Artifacts

```bash
# Read review artifacts from workflow-scoped directory
ls -la .archon-artifacts/review/

# Read each review finding
for file in .archon-artifacts/review/*.md; do
  echo "=== $file ==="
  cat "$file"
done
```

**Expected review artifacts** (in `.archon-artifacts/review/`):
- `scope.md` - Files changed, scope limits, focus areas
- `code-review-findings.md` - Code quality issues
- `error-handling-findings.md` - Silent failures, catch blocks
- `test-coverage-findings.md` - Test gaps
- `comment-quality-findings.md` - Documentation issues
- `docs-impact-findings.md` - Doc update needs
- `consolidated-review.md` - Combined findings, priorities
- `fix-report.md` - What was fixed
- `sync-report.md` - Rebase/sync status (if applicable)

### 1.3 Extract Key Data

**From plan-context.md**:
- Plan title and summary
- Files expected to change
- **NOT Building (Scope Limits)** - CRITICAL: these are follow-up candidates
- Acceptance criteria

**From implementation.md**:
- Tasks completed vs planned
- Files actually changed
- **Deviations from plan** - document these prominently
- Issues encountered during implementation

**From all review findings**:
- CRITICAL/HIGH issues (should be fixed)
- **MEDIUM issues** - follow-up candidates
- **LOW issues** - optional follow-ups
- Specific recommendations by category

**From fix-report.md**:
- What was actually fixed
- What was NOT fixed (and why)

### 1.4 Cross-Reference

Compare across artifacts:
- Plan vs Implementation: What matched? What deviated?
- Review findings vs Fix report: What's still open?
- NOT Building vs Review findings: Did reviewers flag excluded items? (this is expected, note it)

**PHASE_1_CHECKPOINT:**

- [ ] ALL workflow artifacts read
- [ ] ALL review artifacts read
- [ ] Deviations extracted
- [ ] Unfixed issues identified
- [ ] NOT Building items noted

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] ALL workflow artifacts read
- [ ] ALL review artifacts read
- [ ] Deviations extracted
- [ ] Unfixed issues identified
- [ ] NOT Building items noted
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 2: ANALYZE - Build Follow-Up Matrix

<SUBAGENT>
description: archon-idea-to-pr-workflow-summary: Phase 2 - ANALYZE - Build Follow-Up Matrix
subagent_type: general
</SUBAGENT>
<PROMPT>
### 2.1 Categorize Follow-Up Items

**From "NOT Building" section** - Future work explicitly deferred:

| Item | Rationale | Suggested Follow-Up |
|------|-----------|---------------------|
| {excluded item} | {why excluded} | Create issue / Separate PR / Not needed |

**From Implementation Deviations** - Changes that diverged from plan:

| Deviation | Reason | Impact | Follow-Up Needed? |
|-----------|--------|--------|-------------------|
| {what changed} | {why} | {low/medium/high} | {yes/no + action} |

**From Unfixed Review Findings** - MEDIUM/LOW severity items:

| Finding | Severity | Category | Suggested Action |
|---------|----------|----------|------------------|
| {issue} | MEDIUM | docs | Update CLAUDE.md |
| {issue} | LOW | test | Add edge case test |
| {issue} | MEDIUM | error-handling | Log instead of silent |

### 2.2 Prioritize by Effort vs Value

**Quick Wins** (< 5 min, high value):
- Documentation updates
- Simple comment additions
- Missing log statements

**Worth Doing** (medium effort, clear value):
- Test coverage gaps
- Error message improvements
- Type refinements

**Can Defer** (higher effort or lower urgency):
- Refactoring suggestions
- Performance optimizations
- Style improvements

**PHASE_2_CHECKPOINT:**

- [ ] NOT Building items categorized
- [ ] Deviations assessed
- [ ] Unfixed findings prioritized
- [ ] Quick wins identified

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] NOT Building items categorized
- [ ] Deviations assessed
- [ ] Unfixed findings prioritized
- [ ] Quick wins identified
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 3: GENERATE - Create Decision Matrix

<SUBAGENT>
description: archon-idea-to-pr-workflow-summary: Phase 3 - GENERATE - Create Decision Matrix
subagent_type: general
</SUBAGENT>
<PROMPT>
### 3.1 Build Decision Matrix

Structure the output for easy decision-making:

```markdown
## Follow-Up Decision Matrix

### Quick Wins (Can do now, < 5 min each)

| # | Item | Action | Command |
|---|------|--------|---------|
| 1 | Update CLAUDE.md with new column | Docs update | `Run docs agent` |
| 2 | Add missing JSDoc to deactivateSession | Comment | `Auto-fix` |

**Your choice**:
- [ ] Do all quick wins before merge
- [ ] Create issues for later
- [ ] Skip (not needed)

---

### Suggested GitHub Issues

| # | Title | Labels | From |
|---|-------|--------|------|
| 1 | {issue title} | `enhancement`, `docs` | NOT Building |
| 2 | {issue title} | `bug`, `low-priority` | Review finding |

**Your choice**:
- [ ] Create all issues
- [ ] Create selected: {numbers}
- [ ] Skip issue creation

---

### Documentation Gaps

| File | Section | Update Needed |
|------|---------|---------------|
| CLAUDE.md | Database Schema | Add ended_reason column |
| docs/architecture.md | Sessions | Update deactivateSession signature |

**Your choice**:
- [ ] Send docs agent to fix all
- [ ] Fix manually after merge
- [ ] Skip (acceptable as-is)

---

### Deferred Items (from NOT Building)

| Item | Why Deferred | When to Address |
|------|--------------|-----------------|
| {item} | {rationale} | {next sprint / never / if needed} |

**These were intentionally excluded** - no action needed unless priorities change.
```

**PHASE_3_CHECKPOINT:**

- [ ] Decision matrix structured
- [ ] Quick wins identified
- [ ] Issues drafted
- [ ] Docs gaps listed

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_3_CHECKPOINT
- [ ] Decision matrix structured
- [ ] Quick wins identified
- [ ] Issues drafted
- [ ] Docs gaps listed
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 4: POST - GitHub PR Comment

<SUBAGENT>
description: archon-idea-to-pr-workflow-summary: Phase 4 - POST - GitHub PR Comment
subagent_type: general
</SUBAGENT>
<PROMPT>
### 4.1 Format for GitHub

Create a PR comment with the summary:

```markdown
## Workflow Summary

**Plan**: `{plan-path}`
**Status**: Implementation complete, PR ready for review

---

### Implementation vs Plan

| Metric | Planned | Actual |
|--------|---------|--------|
| Files created | {N} | {N} |
| Files updated | {M} | {M} |
| Tests added | {K} | {K} |
| Deviations | - | {count} |

{If deviations:}
<details>
<summary>Deviations from Plan ({count})</summary>

{List each deviation with reason}

</details>

---

### Review Summary

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| CRITICAL | {N} | {N} | 0 |
| HIGH | {N} | {N} | 0 |
| MEDIUM | {N} | {fixed} | {remaining} |
| LOW | {N} | {fixed} | {remaining} |

---

### Quick Wins Before Merge

{If any quick wins identified:}

| Item | Effort | Action |
|------|--------|--------|
| {item} | ~2 min | {action} |

**Reply with**: `@archon do quick wins` to auto-fix these.

---

### Suggested Follow-Up Issues

{If issues suggested:}

| Title | Labels |
|-------|--------|
| {title} | {labels} |

**Reply with**: `@archon create follow-up issues` to create these.

---

### Documentation Updates

{If doc gaps found:}

| File | Update |
|------|--------|
| {file} | {what} |

**Reply with**: `@archon update docs` to send a docs agent.

---

<details>
<summary>Deferred Items (NOT Building)</summary>

These were **intentionally excluded** from scope:

{List from NOT Building section}

</details>

---

**Artifacts**: `.archon-artifacts/`
```

### 4.2 Post to GitHub

```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
gh pr comment $PR_NUMBER --body "{formatted-summary}"
```

**PHASE_4_CHECKPOINT:**

- [ ] Summary formatted for GitHub
- [ ] Comment posted to PR

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] Summary formatted for GitHub
- [ ] Comment posted to PR
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 5: ARTIFACT - Write Summary

<SUBAGENT>
description: archon-idea-to-pr-workflow-summary: Phase 5 - ARTIFACT - Write Summary
subagent_type: general
</SUBAGENT>
<PROMPT>
### 5.1 Write Summary Artifact

Write to `.archon-artifacts/workflow-summary.md`:

```markdown
# Workflow Summary

**Generated**: {YYYY-MM-DD HH:MM}
**Workflow ID**: $WORKFLOW_ID
**PR**: #{number}

---

## Execution Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Setup | Yes | Branch ready |
| Confirm | Yes | Plan validated |
| Implement | Yes | {N} tasks completed |
| Validate | Yes | All checks pass |
| PR | Yes | #{number} created |
| Review | Yes | {N} agents ran |
| Fixes | Yes | {N} issues fixed |

---

## Implementation vs Plan

{Detailed comparison}

---

## Deviations

{List with rationale}

---

## Unfixed Review Findings

### MEDIUM Severity

{List}

### LOW Severity

{List}

---

## Follow-Up Recommendations

### GitHub Issues to Create

{List with draft titles/bodies}

### Documentation Updates

{List with specific changes}

### Deferred to Future

{List from NOT Building}

---

## Decision Matrix

{Copy of the decision matrix}

---

## GitHub Comment

Posted to: {PR URL}#comment-{id}
```

**PHASE_5_CHECKPOINT:**

- [ ] Summary artifact written
- [ ] All sections complete

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_5_CHECKPOINT
- [ ] Summary artifact written
- [ ] All sections complete
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 5.5: ARCHIVE - Create Backward-Compatible Symlink

<SUBAGENT>
description: archon-idea-to-pr-workflow-summary: Phase 5.5 - ARCHIVE - Create Backward-Compatible Symlink
subagent_type: general
</SUBAGENT>
<PROMPT>
### 5.5.1 Create Symlink for PR-Based Lookup

Create symlink for backward compatibility with PR-based artifact lookup:

```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number 2>/dev/null)
if [ -n "$PR_NUMBER" ]; then
  mkdir -p .archon-artifacts/../reviews
  ln -sfn ../runs/$WORKFLOW_ID/review .archon-artifacts/../reviews/pr-$PR_NUMBER
fi
```

This allows legacy tools to find review artifacts at `.archon-artifacts/../reviews/pr-{number}/`.

**PHASE_5.5_CHECKPOINT:**

- [ ] Symlink created (if PR number available)

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_5_5_CHECKPOINT
- [ ] Symlink created (if PR number available)
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 6: OUTPUT - Report to User

<SUBAGENT>
description: archon-idea-to-pr-workflow-summary: Phase 6 - OUTPUT - Report to User
subagent_type: general
</SUBAGENT>
<PROMPT>
```markdown
## Workflow Complete

**Workflow ID**: `$WORKFLOW_ID`
**PR**: #{number} - {title}

### Summary

| Metric | Value |
|--------|-------|
| Tasks completed | {N}/{N} |
| Review findings fixed | {N} |
| Quick wins available | {N} |
| Follow-up issues suggested | {N} |

### Posted to GitHub

Summary comment added to PR with:
- Implementation vs plan comparison
- Deviations documented
- Decision matrix for follow-ups

### Your Next Steps

1. **Review the PR**: {url}
2. **Quick wins**: Reply `@archon do quick wins` on PR (or skip)
3. **Create issues**: Reply `@archon create follow-up issues` (or skip)
4. **Merge when ready**

### Artifacts

- Summary: `.archon-artifacts/workflow-summary.md`
- All artifacts: `.archon-artifacts/`
```

---

## Success Criteria

- **ARTIFACTS_LOADED**: All workflow artifacts read
- **MATRIX_CREATED**: Follow-up items categorized and prioritized
- **GITHUB_POSTED**: Summary comment on PR
- **ARTIFACT_WRITTEN**: workflow-summary.md created
- **ACTIONABLE**: User has clear next steps with minimal cognitive load

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_6_CHECKPOINT
- [ ] Phase 6 report delivered
- [ ] Success criteria evaluated
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to final step.
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
