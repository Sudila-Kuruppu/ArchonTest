---
name: idea-to-pr-plan
description: Use when dispatched by idea-to-pr orchestrator for Phase 1 planning
---

# Phase 1: PLAN — Codebase Analysis & Implementation Plan

## Instructions

1. Read `.archon-artifacts/input.txt` for the feature description
2. Explore the codebase thoroughly
3. Write a complete implementation plan to `.archon-artifacts/plan.md`

## Exploration Checklist

Find:
- Project structure (root files, key directories, config files)
- Existing similar features with file:line references
- Naming conventions, error handling patterns, test structure
- Integration points for this feature

## Plan Structure

Write `.archon-artifacts/plan.md` with:

- **Summary & user story** — what the feature does from the user's perspective
- **UX before/after** — text-based diagram showing the change
- **Files to change** — each file marked as `CREATE` or `UPDATE` with full path
- **NOT building** — explicit scope limits (what you will NOT implement)
- **Step-by-step tasks** — atomic, each with a `<VALIDATE>` command block
- **Testing strategy** — what to test and edge cases
- **Validation commands** — full type-check, lint, test, build commands

## Asking Questions

If anything is unclear about the feature description:
1. Use the `question` tool to ask the user
2. Document their answer in `.archon-artifacts/input.txt`
3. Proceed with the clarified requirements

## Constraints

- Do NOT write any implementation code
- Plan only — no scaffolding, no file creation outside `.archon-artifacts/`
- Every task must have a runnable VALIDATE command
