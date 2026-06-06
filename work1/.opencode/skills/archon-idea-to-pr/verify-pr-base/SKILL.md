 ---
name: archon-idea-to-pr-verify-pr-base
description: |
  Use when: Running the verify-pr-base phase of archon-idea-to-pr.
  Verify PR base branch is correct and re-target if needed.
  NOT for: Standalone use outside archon-idea-to-pr workflow.
argument-hint: ""
---

# Sub-skill: verify-pr-base

Verify the PR's base branch matches the expected base branch. If mismatched, re-target the PR.

## EXECUTION PROTOCOLS

### SUBAGENT PROTOCOL
When you see `<SUBAGENT>` followed by `<PROMPT>`, execute them as a Task tool call. Do NOT execute the prompt yourself.

### VALIDATE PROTOCOL
Run every command in `<VALIDATE>` bash blocks. If any fail, fix before proceeding.

---

## Phase 1: VERIFY - Check PR Base

<SUBAGENT>
description: archon-idea-to-pr-verify-pr-base: Phase 1 - Check PR Base
subagent_type: general
</SUBAGENT>
<PROMPT>
### 1. Read Context

```bash
INPUT=$(cat .archon-artifacts/input.txt 2>/dev/null || echo "")
echo "Context: $INPUT"
```

### 2. Verify PR Base Branch

```bash
set -euo pipefail
EXPECTED="$BASE_BRANCH"
ACTUAL=$(gh pr view --json baseRefName -q '.baseRefName')
if [ "$ACTUAL" != "$EXPECTED" ]; then
  PR_NUMBER=$(gh pr view --json number -q '.number')
  echo "Base mismatch on PR #$PR_NUMBER: expected=$EXPECTED actual=$ACTUAL — re-targeting" >&2
  gh pr edit "$PR_NUMBER" --base "$EXPECTED"
else
  echo "PR base verified: $EXPECTED"
fi
```

### 3. Save Output

```bash
echo "SUCCESS: verify-pr-base completed" > .archon-artifacts/verify-pr-base-output.txt
```

Write results to `.archon-artifacts/`.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] PR base verified or re-targeted
- [ ] Output saved to `.archon-artifacts/verify-pr-base-output.txt`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

---

## Success Criteria

- [ ] Phase completed
- [ ] Output artifacts exist in `.archon-artifacts/`
