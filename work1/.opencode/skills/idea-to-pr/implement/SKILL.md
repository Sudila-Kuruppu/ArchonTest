---
name: idea-to-pr-implement
description: Use when dispatched by idea-to-pr orchestrator for Phase 3 implementation
---

# Phase 3: IMPLEMENT — Execute Plan Tasks

## Instructions

1. Read `.archon-artifacts/plan.md`
2. Execute every task in the plan IN ORDER
3. Write progress to `.archon-artifacts/implementation.md`

## Per-Task Protocol

For EACH task:

1. Read the task description and target files
- For `CREATE` tasks: read existing similar files to mirror patterns first
- For `UPDATE` tasks: read the file before editing
2. Make the changes
3. Run type-check: `npx tsc --noEmit 2>&1 || true`
4. Run lint: `npx eslint . 2>&1 || true`
5. If validation fails, fix before moving to next task

## Asking Questions

If a task is ambiguous or you hit a design decision:
1. Use the `question` tool to ask the user
2. Document the answer in `.archon-artifacts/implementation.md`
3. Proceed with the clarified direction

## Output

Write `.archon-artifacts/implementation.md` with:
- Each task completed and files changed
- Any issues encountered and how they were resolved
- Type-check status after each change
- Lint status after each change
- Final validation status

## Constraints

- Strictly follow the plan — do NOT add scope beyond what's planned
- Do NOT skip tasks or reorder them
- If a task fails repeatedly, document why and return with status
