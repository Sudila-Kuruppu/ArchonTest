---
name: comprehensive-pr-review
description: |
  Use when: User wants a comprehensive code review of a pull request with automatic fixes.
  Triggers: "review this PR", "review PR #123", "comprehensive review", "full PR review",
            "review and fix", "check this PR", "code review", "comprehensive-pr-review".
  Capability: Scopes PR -> syncs with main -> runs 5 specialized review agents in parallel ->
              synthesizes findings -> auto-fixes CRITICAL/HIGH issues -> reports remaining issues.
  NOT for: Quick questions about a PR, checking CI status, simple "what changed" queries.
argument-hint: "<pr-number|url>"
---

# Comprehensive PR Review

**Core principle:** Each phase runs as a **fresh subagent** via the Task tool with zero memory of prior conversation. Phases communicate ONLY through `.archon-artifacts/` on disk.

## EXECUTION PROTOCOLS

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

### PARALLEL SUBAGENT PROTOCOL

When you see `---parallel---` between SUBAGENT entries, fire ALL Task tool calls in a single message.

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
- [ ] `input.txt` written with PR number/URL

---

## Phase 1: SCOPE — Gather PR Context & Verify Reviewability

<SUBAGENT>
description: comprehensive-pr-review: SCOPE — PR from input.txt
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/input.txt for the PR number or URL.

### 1. Identify PR

```bash
PR_NUMBER=$(cat .archon-artifacts/input.txt | grep -oE '[0-9]+' | head -1)
if [ -z "$PR_NUMBER" ]; then
  PR_NUMBER=$(gh pr view --json number -q '.number' 2>/dev/null)
fi
if [ -z "$PR_NUMBER" ]; then echo "ERROR: No PR number found"; exit 1; fi
echo "$PR_NUMBER" > .archon-artifacts/.pr-number
gh pr view "$PR_NUMBER" --json number,title,body,url,headRefName,baseRefName,files,additions,deletions,changedFiles,state,author,isDraft,mergeable,mergeStateStatus
```

### 2. Pre-Review Checks

```bash
gh pr view "$PR_NUMBER" --json mergeable --jq '.mergeable'
gh pr checks "$PR_NUMBER" --json name,state,conclusion --jq '.[] | "\(.name): \(.state) (\(.conclusion // "pending"))"'
PR_BASE=$(gh pr view "$PR_NUMBER" --json baseRefName --jq '.baseRefName')
PR_HEAD=$(gh pr view "$PR_NUMBER" --json headRefName --jq '.headRefName')
git fetch origin "$PR_BASE" --quiet
git fetch origin "$PR_HEAD" --quiet
BEHIND=$(git rev-list --count "origin/$PR_HEAD..origin/$PR_BASE" 2>/dev/null || echo "0")
gh pr view "$PR_NUMBER" --json isDraft --jq '.isDraft'
```

If `CONFLICTING` — STOP and tell user to resolve conflicts.

#### 2.5 Check PR Size

```bash
CHANGED_FILES=$(gh pr view "$PR_NUMBER" --json changedFiles --jq '.changedFiles')
TOTAL_LINES=$(gh pr view "$PR_NUMBER" --json additions,deletions --jq '.additions + .deletions')
echo "Files changed: $CHANGED_FILES, Lines changed: +$(gh pr view "$PR_NUMBER" --json additions --jq '.additions') -$(gh pr view "$PR_NUMBER" --json deletions --jq '.deletions')"
```

| Metric | Warning Threshold | Action |
|--------|-------------------|--------|
| Changed files | 20+ | Warn about review thoroughness |
| Lines changed | 1000+ | Warn about review thoroughness |

If large (files >20 or lines >1000): warn and suggest splitting PR.

### 3. Gather Context

```bash
gh pr diff "$PR_NUMBER" > .archon-artifacts/pr-diff.txt
gh pr view "$PR_NUMBER" --json files --jq '.files[].path'
cat CLAUDE.md 2>/dev/null | head -200
```

### 4. Categorize Changed Files

```bash
gh pr view "$PR_NUMBER" --json files --jq '.files[].path' | while read f; do
  case "$f" in
    *.test.*|*.spec.*|test_*) echo "test: $f" ;;
    *.md|docs/*) echo "doc: $f" ;;
    *.json|*.yaml|*.toml|*.config.*) echo "config: $f" ;;
    *.ts|*.js|*.py|*.go|*.rs) echo "source: $f" ;;
    *) echo "other: $f" ;;
  esac
done
```

### 5. Scan for New Abstractions

```bash
gh pr diff "$PR_NUMBER" | grep "^+" | sed 's/^+//' | grep -E "(^interface |^export interface |^type |^abstract class |^export class )" | head -20 > .archon-artifacts/review/new-abstractions.txt
```

For each new abstraction found, note it in scope manifest under "Review Focus Areas" — verify no duplication of existing primitives.

### 6. Check for Workflow Artifacts

Check for artifacts from prior automated workflows:

```bash
# Option 1: Plan-based workflow (plan-context.md)
ls -t .archon-artifacts/../runs/*/plan-context.md 2>/dev/null | head -1

# Option 2: Issue-based workflow (investigation.md)
ls -t .archon-artifacts/../runs/*/investigation.md 2>/dev/null | head -1

# Option 3: Implementation report
ls -t .archon-artifacts/../runs/*/implementation.md 2>/dev/null | head -1
```

#### 6.1 Extract Scope Limits

If `plan-context.md` exists:
```bash
sed -n '/## NOT Building/,/^## /p' .archon-artifacts/../runs/*/plan-context.md | head -30
```

If `investigation.md` exists:
```bash
sed -n '/## Scope Boundaries/,/^## /p' .archon-artifacts/../runs/*/investigation.md | head -30
```

These are INTENTIONAL exclusions — do NOT flag them as bugs or missing features.

#### 6.2 Check Implementation Deviations

If `implementation.md` exists:
```bash
sed -n '/## Deviations/,/^## /p' .archon-artifacts/../runs/*/implementation.md | head -20
```

### 7. Clean Stale Artifacts

```bash
find .archon-artifacts/../reviews/pr-* -maxdepth 0 -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
```

### 8. Create Scope Manifest

```bash
mkdir -p .archon-artifacts/review
```

Write `.archon-artifacts/review/scope.md` containing:
- PR metadata (number, title, URL, branches, author, date)
- Pre-Review Status table (Merge Conflicts, CI Status, Behind Base, Draft, Size)
- Changed Files table with file, type, additions, deletions
- File Categories (Source, Test, Documentation, Configuration)
- Review Focus Areas
- CLAUDE.md Rules to Check
- Workflow Context (if from automated workflow): Scope Limits (NOT Building / OUT OF SCOPE), Implementation Deviations
- CI Details
- Metadata

### PHASE_1_CHECKPOINT
- [ ] PR number identified and saved to .pr-number
- [ ] PR is open and mergeable
- [ ] Size warnings issued if needed
- [ ] New abstractions scanned
- [ ] Workflow artifacts checked (plan-context.md / investigation.md)
- [ ] Scope limits extracted (NOT Building / OUT OF SCOPE)
- [ ] Implementation deviations noted (if available)
- [ ] Files categorized by type
- [ ] Scope manifest written to review/scope.md with all tables
- [ ] Diff saved to pr-diff.txt
- [ ] Stale artifacts cleaned
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/.pr-number` exists
- [ ] `.archon-artifacts/pr-diff.txt` exists
- [ ] `.archon-artifacts/review/scope.md` exists
- [ ] No merge conflicts blocking

**Checkpoint passed?** Proceed to Phase 2.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/.pr-number && echo "PASS: .pr-number" || echo "FAIL: .pr-number missing"
test -s .archon-artifacts/review/scope.md && echo "PASS: scope.md" || echo "FAIL: scope.md missing"
```
</VALIDATE>

---

## Phase 2: SYNC — Sync PR with Main

<SUBAGENT>
description: comprehensive-pr-review: SYNC — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/.pr-number for PR number.

### 1. Check and Checkout

```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
PR_BASE=$(gh pr view "$PR_NUMBER" --json baseRefName --jq '.baseRefName')
PR_HEAD=$(gh pr view "$PR_NUMBER" --json headRefName --jq '.headRefName')
git fetch origin "$PR_BASE"
git fetch origin "$PR_HEAD"
git checkout "$PR_HEAD"
```

### 2. Check if Behind

```bash
BEHIND=$(git rev-list --count "HEAD..origin/$PR_BASE")
echo "Behind by: $BEHIND commits"
```

If 0 behind: output "Already up to date. No sync needed." and exit (no artifact created).

### 3. Attempt Rebase

```bash
git rebase "origin/$PR_BASE"
```

Possible outcomes:
- Success (no conflicts) → go to Phase 4 (Validate)
- Conflicts → go to Phase 3 (Resolve)
- Other error → report and abort

### 4. Resolve Conflicts (if any)

```bash
git diff --name-only --diff-filter=U
```

For each conflicting file, categorize:
- **SIMPLE**: One side added/changed, other didn't touch → Auto-resolve
- **COMPLEX**: Both sides changed same lines → Need decision

#### Auto-Resolve Simple Conflicts
- Both added different things → Keep both
- One updated, other didn't → Keep update
- Import additions → Merge both

```bash
# Edit file to resolve, then stage
git add {file}
```

#### Resolve Complex Conflicts
1. Read both versions to understand intent
2. Choose resolution based on PR intent, base branch updates, code correctness
3. Apply resolution and stage

```bash
git add {file}
git rebase --continue
```

### 5. Validate After Rebase

```bash
# No conflict markers
git diff --check

# Type check
bun run type-check

# Tests
bun test

# Lint
bun run lint
```

If any fail, fix issues before proceeding.

### 6. Push to Remote

```bash
git push --force-with-lease origin "$PR_HEAD"
```

If push rejected (someone else pushed):
```bash
git pull --rebase origin "$PR_HEAD"
git push origin "$PR_HEAD"
```

### 7. Create Sync Report

Write `.archon-artifacts/review/sync-report.md`:
- Summary (commits rebased, conflicts resolved, status)
- Conflicts Resolved section (file, type SIMPLE/COMPLEX, resolution)
- Validation table (type-check, tests, lint)
- Git state (before/after commit, commits ahead)

```markdown
# Sync Report: PR #{number}
**Date**: {timestamp}
**Action**: Rebased onto `{base}`

- **Commits rebased**: {N}
- **Conflicts resolved**: {M} (in {X} files)
- **Status**: ✅ Synced
```

### 8. Update Scope Artifact

Append to `.archon-artifacts/review/scope.md`:
```markdown
## Sync Status
**Synced**: {timestamp}
**Rebased onto**: `{base}` at {commit}
**Conflicts resolved**: {N}
```

### Error Handling

- **Rebase fails completely**: `git rebase --abort`, report failure
- **Push rejected**: `git pull --rebase origin $PR_HEAD`, retry push
- **Validation fails**: Investigate which changes broke, fix or abort and report

### PHASE_2_CHECKPOINT
- [ ] PR branch checked out
- [ ] Rebase completed (or was already up to date)
- [ ] Conflicts categorized (SIMPLE/COMPLEX) and resolved
- [ ] Validation passed (type-check, test, lint)
- [ ] Branch pushed (if rebased)
- [ ] Sync report created at review/sync-report.md
- [ ] Scope artifact updated with sync status
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] Branch synced with base (or already up to date)
- [ ] No conflict markers remain

**Checkpoint passed?** Proceed to Phase 3.
**Checkpoint failed?** Re-run the SUBAGENT block.

---

## Phase 3: REVIEW — 5 Parallel Review Agents

Launch 5 parallel agents. Fire ALL five Task tool calls in a single message.

---parallel---

<SUBAGENT>
description: comprehensive-pr-review: CODE REVIEW — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Review code quality, CLAUDE.md compliance, and bugs.

1. Load:
```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
cat .archon-artifacts/review/scope.md
gh pr diff "$PR_NUMBER"
cat CLAUDE.md 2>/dev/null
```

2. For each changed file check: CLAUDE.md compliance, bugs (logic errors, null/undefined, security), code quality (duplication, complexity).

3. Check for Primitive Duplication: For each new interface, class, type alias, or utility module introduced in the diff, search for similar existing abstractions. Flag with verdict:
- **EXTENDS**: extends existing primitive
- **DUPLICATE**: redundant with existing primitive
- **NEW**: genuinely new, no existing primitive

```bash
grep -r "interface {Name}\|class {Name}\|type {Name}" packages/ --include="*.ts" | head -10
```

4. Write `.archon-artifacts/review/code-review-findings.md`:
- Summary with verdict (APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION)
- Each finding: severity (CRITICAL/HIGH/MEDIUM/LOW), category, location, issue, fix options with pros/cons table, recommended fix with code, codebase pattern reference
- Primitive duplication findings with EXTENDS/DUPLICATE/NEW verdict
- Statistics table, CLAUDE.md compliance table, positive observations

Each finding MUST include fix options (2+), recommended option with reasoning, and codebase pattern reference.
</PROMPT>

---parallel---

<SUBAGENT>
description: comprehensive-pr-review: ERROR HANDLING — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Hunt for silent failures, inadequate error handling, broad catch blocks, and poor fallbacks.

1. Load:
```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
cat .archon-artifacts/review/scope.md
gh pr diff "$PR_NUMBER"
# Find error handling patterns in codebase
grep -r "catch" src/ --include="*.ts" -A 3 | head -30
grep -r "console.error" src/ --include="*.ts" -B 2 -A 2 | head -30
```

2. Find try/catch, .catch(), || fallback, ?? default, optional chaining. For each: logging quality, user feedback, catch specificity, fallback behavior. For each handler, evaluate:
- **Logging Quality**: Is error logged with appropriate severity and sufficient context?
- **User Feedback**: Does user receive actionable, specific feedback?
- **Catch Specificity**: Does it catch only expected error types? Could it suppress unrelated errors?
- **Fallback Behavior**: Is fallback documented/intended? Does it mask the problem?

3. Write `.archon-artifacts/review/error-handling-findings.md`:
- Summary with verdict
- Each finding: severity, category (silent-failure/broad-catch/missing-logging/poor-user-feedback/unsafe-fallback), location, hidden errors listed (list specific error types and scenarios), user impact, fix options with pros/cons, recommended fix, codebase pattern reference

- Error Handler Audit table:
| Location | Type | Logging | User Feedback | Specificity | Verdict |
|----------|------|---------|---------------|-------------|---------|

- Silent Failure Risk Assessment table:
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|

- Statistics table, positive observations

Each finding MUST list what errors could be silently hidden and user impact.
</PROMPT>

---parallel---

<SUBAGENT>
description: comprehensive-pr-review: TEST COVERAGE — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Analyze test coverage for PR changes.

1. Load:
```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
cat .archon-artifacts/review/scope.md
gh pr diff "$PR_NUMBER"
# Find test files
find src -name "*.test.ts" -o -name "*.spec.ts" | head -20
```

2. Map source to tests. Check: untested error paths, missing edge cases (null, empty, boundary), weak assertions, implementation-coupled tests. Evaluate each existing test for: tests behavior vs implementation, catches meaningful regressions, resilient to refactoring, follows DAMP principles, meaningful assertions.

3. Write `.archon-artifacts/review/test-coverage-findings.md`:
- Summary with verdict
- Coverage map table (Source File | Test File | New Code Tested | Modified Code Tested)
- Each finding: severity, criticality score (1-10), category (missing-test/weak-test/implementation-coupled/missing-edge-case), location, untested code, why it matters (specific bugs it could miss), test options with effort levels, recommended test code matching codebase patterns

- Test Quality Audit table:
| Test | Tests Behavior | Resilient | Meaningful Assertions | Verdict |
|------|---------------|-----------|----------------------|---------|

- Risk Assessment table:
| Untested Area | Failure Mode | User Impact | Priority |
|---------------|--------------|-------------|----------|

- Statistics table broken down by criticality bands (8-10, 5-7, 1-4), positive observations

Each finding MUST include criticality score (1-10), why it matters (what specific regression it could miss), and recommended test code.
</PROMPT>

---parallel---

<SUBAGENT>
description: comprehensive-pr-review: COMMENT QUALITY — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Analyze code comments for accuracy and maintainability.

1. Load:
```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
cat .archon-artifacts/review/scope.md
gh pr diff "$PR_NUMBER"
```

2. Check: comment accuracy vs code, comment rot (outdated TODOs, outdated references, contradictions), documentation completeness (public APIs, magic numbers, non-obvious algorithms, important decisions), signal-to-noise (redundant comments, clarity).

3. Write `.archon-artifacts/review/comment-quality-findings.md`:
- Summary with verdict
- Each finding: severity, category (inaccurate/outdated/missing/redundant/misleading), location, current comment vs actual code, impact, fix options (update/remove/expand) with pros/cons, recommended fix, good comment pattern from codebase

- Comment Audit table:
| Location | Type | Accurate | Up-to-date | Useful | Verdict |
|----------|------|----------|------------|--------|---------|

- Documentation Gaps table:
| Code Area | What's Missing | Priority |
|-----------|----------------|----------|

- Comment Rot Found table:
| Location | Comment Says | Code Does | Age |
|----------|--------------|-----------|-----|

- Statistics table, positive observations

Each finding MUST show the inaccurate comment vs the actual code behavior.
</PROMPT>

---parallel---

<SUBAGENT>
description: comprehensive-pr-review: DOCS IMPACT — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Check if PR changes require documentation updates.

1. Load:
```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
cat .archon-artifacts/review/scope.md
gh pr diff "$PR_NUMBER"
cat CLAUDE.md 2>/dev/null
ls -la docs/ 2>/dev/null || echo "No docs/ dir"
ls -la .claude/agents/ 2>/dev/null || true
ls -la .archon/commands/ 2>/dev/null || true
```

2. Check impact on: CLAUDE.md (commands, workflows, setup, env vars, schema, API, patterns), docs/ (architecture, getting started, config, API, deployment), agent/command definitions, README (features, install, usage, config).

3. Write `.archon-artifacts/review/docs-impact-findings.md`:
- Summary with verdict (NO_CHANGES_NEEDED | UPDATES_REQUIRED | CRITICAL_UPDATES)
- Impact Assessment table per document:
| Document | Impact | Required Update |
|----------|--------|-----------------|
| CLAUDE.md | NONE/LOW/HIGH | {description} |
| docs/*.md | NONE/LOW/HIGH | {description} |
| README.md | NONE/LOW/HIGH | {description} |
| .claude/agents/*.md | NONE/LOW/HIGH | {description} |
| .archon/commands/*.md | NONE/LOW/HIGH | {description} |

- Each finding: severity, category (missing-docs/outdated-docs/incomplete-docs/misleading-docs), document, PR change, issue, current vs needed docs, impact if not updated, suggested update text, documentation style reference
- CLAUDE.md Sections to Update table:
| Section | Current | Needed Update |
|---------|---------|---------------|

- New Documentation Needed table:
| Topic | Suggested Location | Priority |
|-------|-------------------|----------|

- Statistics table, positive observations

Each finding MUST include impact if not updated and suggested update text.
</PROMPT>

### PHASE_3_CHECKPOINT
- [ ] All 5 agents launched in parallel
- [ ] `.archon-artifacts/review/code-review-findings.md` exists
- [ ] `.archon-artifacts/review/error-handling-findings.md` exists
- [ ] `.archon-artifacts/review/test-coverage-findings.md` exists
- [ ] `.archon-artifacts/review/comment-quality-findings.md` exists
- [ ] `.archon-artifacts/review/docs-impact-findings.md` exists

**Checkpoint passed?** Proceed to Phase 4.
**Checkpoint failed?** Re-run only the missing agent(s).

<VALIDATE>
```bash
for f in code-review-findings error-handling-findings test-coverage-findings comment-quality-findings docs-impact-findings; do
  test -s ".archon-artifacts/review/$f.md" && echo "PASS: $f.md" || echo "FAIL: $f.md missing"
done
```
</VALIDATE>

---

## Phase 4: SYNTHESIZE — Combine Findings & Post to PR

<SUBAGENT>
description: comprehensive-pr-review: SYNTHESIZE — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Read all 5 agent findings, synthesize, and post to GitHub.

1. Load:
```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
cat .archon-artifacts/review/scope.md
cat .archon-artifacts/review/code-review-findings.md
cat .archon-artifacts/review/error-handling-findings.md
cat .archon-artifacts/review/test-coverage-findings.md
cat .archon-artifacts/review/comment-quality-findings.md
cat .archon-artifacts/review/docs-impact-findings.md
```

2. Synthesize:
- **Aggregate by severity**: CRITICAL (must fix) > HIGH (should fix) > MEDIUM (options) > LOW (defer)
- **Deduplicate**: Check for overlapping findings (same issue reported by multiple agents), group related issues, resolve conflicting recommendations
- **Prioritize**: By severity, user impact, ease of fix, risk if not fixed

3. Write `.archon-artifacts/review/consolidated-review.md`:
- Executive summary with overall verdict
- Auto-fix candidates count
- Statistics table per agent × severity
- CRITICAL issues (must fix) with full details and fix code
- HIGH issues (should fix) with full details
- MEDIUM issues with options table (Fix now / Create issue / Skip) with effort and risk
- LOW issues table
- Positive observations
- Suggested follow-up issues
- Next steps

4. Post to PR using rich GitHub format with emojis and collapsible sections:

```bash
gh pr comment "$PR_NUMBER" --body "$(cat <<'EOF'
# 🔍 Comprehensive PR Review

**PR**: #{number}
**Reviewed by**: 5 specialized agents
**Date**: {date}

---

## Summary

{executive summary}

**Verdict**: `{APPROVE | REQUEST_CHANGES}`

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | {n} |
| 🟠 HIGH | {n} |
| 🟡 MEDIUM | {n} |
| 🟢 LOW | {n} |

---

## 🔴 Critical Issues (Auto-fixing)

{For each CRITICAL issue:}

### {Title}
📍 `{file}:{line}`

{Brief description}

<details>
<summary>View fix</summary>

```typescript
{fix code}
```

</details>

---

## 🟠 High Issues (Auto-fixing)

{Same format as CRITICAL}

---

## 🟡 Medium Issues (Needs Decision)

{For each MEDIUM issue:}

### {Title}
📍 `{file}:{line}`

{Brief description}

**Options**: Fix now | Create issue | Skip

<details>
<summary>View details</summary>

{full details and options table}

</details>

---

## 🟢 Low Issues

<details>
<summary>View {n} low-priority suggestions</summary>

| Issue | Location | Suggestion |
|-------|----------|------------|
| {title} | `file:line` | {suggestion} |

</details>

---

## ✅ What's Good

{Positive observations}

---

## 📋 Suggested Follow-up Issues

{If any MEDIUM/LOW issues should become issues}

---

## Next Steps

1. ⚡ Auto-fix step will address CRITICAL + HIGH issues
2. 📝 Review MEDIUM issues above
3. 🎯 Merge when ready

---

*Reviewed by Archon comprehensive-pr-review workflow*
*Artifacts: `.archon-artifacts/review/`*
EOF
)"
```

5. Output: "✅ Review synthesis complete. Proceeding to auto-fix step..."

### PHASE_4_CHECKPOINT
- [ ] Consolidated review artifact created with all sections
- [ ] Findings deduplicated (overlaps resolved, conflicts reconciled)
- [ ] GitHub PR comment posted with emoji format and collapsible sections
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] `.archon-artifacts/review/consolidated-review.md` exists
- [ ] GitHub PR comment posted

**Checkpoint passed?** Proceed to Phase 5.
**Checkpoint failed?** Re-run the SUBAGENT block.

<VALIDATE>
```bash
test -s .archon-artifacts/review/consolidated-review.md && echo "PASS: consolidated-review.md" || echo "FAIL: consolidated-review.md missing"
```
</VALIDATE>

---

## Phase 5: FIX — Implement CRITICAL & HIGH Fixes

<SUBAGENT>
description: comprehensive-pr-review: FIX — PR #$(cat .archon-artifacts/.pr-number)
subagent_type: general
</SUBAGENT>
<PROMPT>
Implement all CRITICAL and HIGH fixes. Commit and push to PR branch.

IMPORTANT: Keep output minimal. Only output the final structured report.

1. Load:
```bash
PR_NUMBER=$(cat .archon-artifacts/.pr-number)
HEAD_BRANCH=$(gh pr view "$PR_NUMBER" --json headRefName --jq '.headRefName')
git fetch origin "$HEAD_BRANCH"
git checkout "$HEAD_BRANCH"
git pull origin "$HEAD_BRANCH"
cat .archon-artifacts/review/consolidated-review.md
# Also read individual artifacts for full fix details if needed
cat .archon-artifacts/review/code-review-findings.md
cat .archon-artifacts/review/error-handling-findings.md
cat .archon-artifacts/review/test-coverage-findings.md
cat .archon-artifacts/review/docs-impact-findings.md
git status --porcelain
git branch --show-current
# Verify on correct PR branch (should be $HEAD_BRANCH)
```

2. For each CRITICAL and HIGH issue: read file, apply recommended fix, verify compiles.
3. For test coverage gaps: create/update test file, add tests for the fix, verify tests pass.
4. Handle unfixable issues with categorization:
- **Conflict**: Code has changed since review
- **Complex**: Requires architectural changes
- **Unclear**: Recommendation is ambiguous
- **Risk**: Fix might break other things
Document reason clearly.

5. Validate:
```bash
bun run type-check
bun run lint
bun test
bun run build
```

If any fail, fix issues introduced. If unfixable, mark as "Not Fixed" with reason.

6. Commit and push with staging safety rules:
```bash
# Stage ONLY files you edited — never git add -A, git add ., or git add -u
git add path/to/file1 path/to/file2 ...
git status --porcelain  # verify nothing scratch/review/PR-body is staged
```

**Never stage**:
- `.pr-body.md`, `pr-body.md`, `*.scratch.md`, `*.tmp.md`
- `review/` directory or any `*-report.md` at repo root
- Anything under `.archon-artifacts/` (review artifacts)

```bash
git commit -m "fix: Address review findings (CRITICAL/HIGH)

Fixes applied:
- {brief list of fixes}

Tests added:
- {list of new tests if any}

Skipped (see review artifacts):
- {brief list of unfixable if any}

Review artifacts: .archon-artifacts/review/"
git push origin "$HEAD_BRANCH"
```

If push rejected due to divergence:
```bash
git pull --rebase origin "$HEAD_BRANCH"
git push origin "$HEAD_BRANCH"
```

7. Write `.archon-artifacts/review/fix-report.md`:
- Summary, CRITICAL fixes (fixed/skipped), HIGH fixes, tests added, not fixed items (with reason), MEDIUM issues for user, suggested follow-ups, validation results table

8. Post fix report to PR with rich format:

```bash
gh pr comment "$PR_NUMBER" --body "$(cat <<'EOF'
# ⚡ Auto-Fix Report

**Status**: {COMPLETE | PARTIAL}
**Pushed**: ✅ Changes pushed to PR

---

## Fixes Applied

| Severity | Fixed | Skipped |
|----------|-------|---------|
| 🔴 CRITICAL | {n} | {n} |
| 🟠 HIGH | {n} | {n} |

### What Was Fixed

{For each fix:}
- ✅ **{title}** (`{file}:{line}`) - {brief description}

### Tests Added

{If any:}
- `{test-file}`: {n} new test cases

---

## ❌ Not Fixed (Manual Action Required)

{If any:}
- **{title}** (`{file}`) - {reason} (Conflict/Complex/Unclear/Risk)

---

## 🟡 MEDIUM Issues (Your Decision)

{If any:}
| Issue | Options |
|-------|---------|
| {title} | Fix now / Create issue / Skip |

---

## 📋 Suggested Follow-up Issues

{If any items should become issues:}
1. **{Issue Title}** (P{1/2/3}) - {brief description}

---

## Validation

✅ Type check | ✅ Lint | ✅ Tests | ✅ Build

---

*Auto-fixed by Archon comprehensive-pr-review workflow*
*Fixes pushed to branch `{HEAD_BRANCH}`*
EOF
)"
```

9. Final output:
```markdown
## ✅ Fix Implementation Complete
PR: #{number} | Branch: {branch}
CRITICAL: {n}/{total} fixed | HIGH: {n}/{total} fixed
Validation: ✅ All checks | Pushed: ✅
```

### PHASE_5_CHECKPOINT
- [ ] On correct PR branch
- [ ] CRITICAL + HIGH fixes attempted
- [ ] Unfixable issues categorized (Conflict/Complex/Unclear/Risk)
- [ ] Build validation passed
- [ ] Staging safety rules followed (no review artifacts staged)
- [ ] Changes committed and pushed (with retry on rejection)
- [ ] fix-report.md created
- [ ] Rich fix report posted to PR
</PROMPT>

### PHASE_5_CHECKPOINT
- [ ] `.archon-artifacts/review/fix-report.md` exists
- [ ] Fixes pushed to PR branch

**Checkpoint passed?** Proceed to Report.
**Checkpoint failed?** Re-run the SUBAGENT block.

<VALIDATE>
```bash
test -s .archon-artifacts/review/fix-report.md && echo "PASS: fix-report.md" || echo "FAIL: fix-report.md missing"
```
</VALIDATE>

---

## Report

1. Read `.archon-artifacts/review/fix-report.md`
2. Output the EXACT text below, replacing `{placeholder}` values:

```
===============================================================
COMPREHENSIVE PR REVIEW — COMPLETE
===============================================================

PR: #{pr-number}
Branch: {PR head branch}
PR URL: {PR URL}

-- Review Agents --
  ✅ code-review
  ✅ error-handling
  ✅ test-coverage
  ✅ comment-quality
  ✅ docs-impact

-- Artifacts --
.archon-artifacts/review/scope.md
.archon-artifacts/review/code-review-findings.md
.archon-artifacts/review/error-handling-findings.md
.archon-artifacts/review/test-coverage-findings.md
.archon-artifacts/review/comment-quality-findings.md
.archon-artifacts/review/docs-impact-findings.md
.archon-artifacts/review/consolidated-review.md
.archon-artifacts/review/fix-report.md
===============================================================
```

### REPORT_CHECKPOINT
- [ ] fix-report.md read
- [ ] Banner displayed with exact formatting
- [ ] All 5 agents listed
- [ ] All 8 artifact paths listed
