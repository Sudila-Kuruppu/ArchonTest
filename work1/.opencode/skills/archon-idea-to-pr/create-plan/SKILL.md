---
name: archon-idea-to-pr-create-plan
description: |
  Use when: Running the create-plan phase of archon-idea-to-pr.
  Create comprehensive feature implementation plan with codebase analysis and research
  Command from: archon-create-plan
  NOT for: Standalone use outside archon-idea-to-pr workflow.
argument-hint: <feature description | path/to/prd.md>
---

# Sub-skill: create-plan

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
description: archon-idea-to-pr-create-plan: Setup
subagent_type: general
</SUBAGENT>
<PROMPT>
# Create Implementation Plan

**Input**: $ARGUMENTS
**Workflow ID**: $WORKFLOW_ID

---

## Your Mission

Transform "$ARGUMENTS" into a battle-tested implementation plan through systematic codebase exploration, pattern extraction, and strategic research.

**Core Principle**: PLAN ONLY - no code written. Create a context-rich document that enables one-pass implementation success.

**Execution Order**: CODEBASE FIRST, RESEARCH SECOND. Solutions must fit existing patterns before introducing new ones.

**Agent Strategy**: Use Task tool with subagent_type="Explore" for codebase intelligence gathering. This ensures thorough pattern discovery before any external research.

**Output**: `.archon-artifacts/plan.md`

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

## Phase 0: DETECT - Input Type Resolution

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 0: DETECT - Input Type Resolution
subagent_type: general
</SUBAGENT>
<PROMPT>
### 0.1 Determine Input Type

| Input Pattern | Type | Action |
|---------------|------|--------|
| Ends with `.prd.md` | PRD file | Parse PRD, select next phase |
| Ends with `.md` and contains "Implementation Phases" | PRD file | Parse PRD, select next phase |
| File path that exists | Document | Read and extract feature description |
| Free-form text | Description | Use directly as feature input |
| Empty/blank | Error | STOP - require input |

### 0.2 If PRD File Detected

1. **Read the PRD file**
2. **Parse the Implementation Phases table** - find rows with `Status: pending`
3. **Check dependencies** - only select phases whose dependencies are `complete`
4. **Select the next actionable phase:**
   - First pending phase with all dependencies complete
   - If multiple candidates with same dependencies, note parallelism opportunity

5. **Extract phase context:**
   ```
   PHASE: {phase number and name}
   GOAL: {from phase details}
   SCOPE: {from phase details}
   SUCCESS SIGNAL: {from phase details}
   PRD CONTEXT: {problem statement, user, hypothesis from PRD}
   ```

6. **Report selection to user:**
   ```
   PRD: {prd file path}
   Selected Phase: #{number} - {name}

   {If parallel phases available:}
   Note: Phase {X} can also run in parallel (in separate worktree).

   Proceeding with Phase #{number}...
   ```

### 0.3 If Free-form Description

Proceed directly to Phase 1 with the input as feature description.

**CHECKPOINT:**

- [ ] Input type determined
- [ ] If PRD: next phase selected and dependencies verified
- [ ] Feature description ready for Phase 1

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_0_CHECKPOINT
- [ ] Input type determined
- [ ] If PRD: next phase selected and dependencies verified
- [ ] Feature description ready for Phase 1
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 1: PARSE - Feature Understanding

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 1: PARSE - Feature Understanding
subagent_type: general
</SUBAGENT>
<PROMPT>
### 1.1 Discover Project Structure

**CRITICAL**: Do NOT assume `src/` exists. Discover actual structure:

```bash
# List root contents
ls -la

# Find main source directories
ls -la */ 2>/dev/null | head -50

# Identify project type from config files
cat package.json 2>/dev/null | head -20
cat pyproject.toml 2>/dev/null | head -20
cat Cargo.toml 2>/dev/null | head -20
cat go.mod 2>/dev/null | head -20
```

Common alternatives to `src/`:
- `app/` (Next.js, Rails, Laravel)
- `lib/` (Ruby gems, Elixir)
- `packages/` (monorepos)
- `cmd/`, `internal/`, `pkg/` (Go)
- Root-level source files (Python, scripts)

### 1.2 Read CLAUDE.md

```bash
cat CLAUDE.md
```

Note all coding standards, patterns, and rules that apply to this codebase.

### 1.3 Extract from Input

- Core problem being solved
- User value and business impact
- Feature type: NEW_CAPABILITY | ENHANCEMENT | REFACTOR | BUG_FIX
- Complexity: LOW | MEDIUM | HIGH
- Affected systems list

### 1.4 Formulate User Story

```
As a <user type>
I want to <action/goal>
So that <benefit/value>
```

**CHECKPOINT:**

- [ ] Project structure discovered
- [ ] CLAUDE.md rules noted
- [ ] Problem statement is specific and testable
- [ ] User story follows correct format
- [ ] Complexity assessment has rationale
- [ ] Affected systems identified

**GATE**: If requirements are AMBIGUOUS → STOP and ASK user for clarification before proceeding.

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] Project structure discovered
- [ ] CLAUDE.md rules noted
- [ ] Problem statement is specific and testable
- [ ] User story follows correct format
- [ ] Complexity assessment has rationale
- [ ] Affected systems identified
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 2: EXPLORE - Codebase Intelligence

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 2: EXPLORE - Codebase Intelligence
subagent_type: general
</SUBAGENT>
<PROMPT>
**CRITICAL: Use Task tool with subagent_type="Explore" with thoroughness="very thorough"**

### 2.1 Launch Explore Agent

```
Explore the codebase to find patterns, conventions, and integration points
relevant to implementing: [feature description].

DISCOVER:
1. Similar implementations - find analogous features with file:line references
2. Naming conventions - extract actual examples of function/class/file naming
3. Error handling patterns - how errors are created, thrown, caught
4. Logging patterns - logger usage, message formats
5. Type definitions - relevant interfaces and types
6. Test patterns - test file structure, assertion styles
7. Integration points - where new code connects to existing
8. Dependencies - relevant libraries already in use

Return ACTUAL code snippets from codebase, not generic examples.
```

### 2.2 Document Discoveries

**Format in table:**

| Category | File:Lines | Pattern Description | Code Snippet |
|----------|------------|---------------------|--------------|
| NAMING | `src/features/X/service.ts:10-15` | camelCase functions | `export function createThing()` |
| ERRORS | `src/features/X/errors.ts:5-20` | Custom error classes | `class ThingNotFoundError` |
| LOGGING | `src/core/logging/index.ts:1-10` | getLogger pattern | `const logger = getLogger("domain")` |
| TESTS | `src/features/X/tests/service.test.ts:1-30` | describe/it blocks | `describe("service", () => {` |
| TYPES | `src/features/X/models.ts:1-20` | Type inference | `type Thing = typeof things.$inferSelect` |

**CHECKPOINT:**

- [ ] Explore agent launched and completed successfully
- [ ] At least 3 similar implementations found with file:line refs
- [ ] Code snippets are ACTUAL (copy-pasted from codebase, not invented)
- [ ] Integration points mapped with specific file paths
- [ ] Dependencies cataloged with versions from package.json

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] Explore agent launched and completed successfully
- [ ] At least 3 similar implementations found with file:line refs
- [ ] Code snippets are ACTUAL (copy-pasted from codebase, not invented)
- [ ] Integration points mapped with specific file paths
- [ ] Dependencies cataloged with versions from package.json
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 3: RESEARCH - External Documentation

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 3: RESEARCH - External Documentation
subagent_type: general
</SUBAGENT>
<PROMPT>
**ONLY AFTER Phase 2 is complete** - solutions must fit existing codebase patterns first.

### 3.1 Search for Documentation

Use WebSearch tool for:
- Official documentation for involved libraries (match versions from package.json)
- Known gotchas, breaking changes, deprecations
- Security considerations and best practices
- Performance optimization patterns

### 3.2 Format References

```markdown
- [Library Docs v{version}](https://url#specific-section)
  - KEY_INSIGHT: {what we learned that affects implementation}
  - APPLIES_TO: {which task/file this affects}
  - GOTCHA: {potential pitfall and how to avoid}
```

**CHECKPOINT:**

- [ ] Documentation versions match package.json
- [ ] URLs include specific section anchors (not just homepage)
- [ ] Gotchas documented with mitigation strategies
- [ ] No conflicting patterns between external docs and existing codebase

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_3_CHECKPOINT
- [ ] Documentation versions match package.json
- [ ] URLs include specific section anchors (not just homepage)
- [ ] Gotchas documented with mitigation strategies
- [ ] No conflicting patterns between external docs and existing codebase
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 3.5: TRANSFORM - UX/Design Consideration

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 3.5: TRANSFORM - UX/Design Consideration
subagent_type: general
</SUBAGENT>
<PROMPT>
### 3.5.1 Create ASCII Diagrams

**Before State:**

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Screen/   │ ──────► │   Action    │ ──────► │   Result    │            ║
║   │  Component  │         │   Current   │         │   Current   │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: [describe current step-by-step experience]                       ║
║   PAIN_POINT: [what's missing, broken, or inefficient]                        ║
║   DATA_FLOW: [how data moves through the system currently]                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**After State:**

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Screen/   │ ──────► │   Action    │ ──────► │   Result    │            ║
║   │  Component  │         │    NEW      │         │    NEW      │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ NEW_FEATURE │  ◄── [new capability added]          ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: [describe new step-by-step experience]                           ║
║   VALUE_ADD: [what user gains from this change]                               ║
║   DATA_FLOW: [how data moves through the system after]                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 3.5.2 Document Interaction Changes

| Location | Before | After | User_Action | Impact |
|----------|--------|-------|-------------|--------|
| `/route` | State A | State B | Click X | Can now Y |
| `Component.tsx` | Missing feature | Has feature | Input Z | Gets result W |

**CHECKPOINT:**

- [ ] Before state accurately reflects current system behavior
- [ ] After state shows ALL new capabilities
- [ ] Data flows are traceable from input to output
- [ ] User value is explicit and measurable

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_3_5_CHECKPOINT
- [ ] Before state accurately reflects current system behavior
- [ ] After state shows ALL new capabilities
- [ ] Data flows are traceable from input to output
- [ ] User value is explicit and measurable
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 4: ARCHITECT - Strategic Design

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 4: ARCHITECT - Strategic Design
subagent_type: general
</SUBAGENT>
<PROMPT>
### 4.0 Primitives Inventory

Before designing the solution, audit existing building blocks:

1. **What primitives already exist?** List the core abstractions in the codebase
   related to this feature — with file:line references from the Explore agent output.
2. **Are they complete?** Do the existing primitives cover this use case, or do they
   have gaps that require extension?
3. **Extend before adding** — can we extend an existing primitive rather than creating
   a new one? Prefer `implements ExistingInterface` over `interface NewInterface`.
4. **Minimum primitive surface** — if new primitives ARE needed, what's the smallest
   addition that enables this feature and remains useful to future callers?
5. **Dependency chain** — what must exist first? What does this feature unlock downstream?

| Primitive | File:Lines | Complete? | Role in Feature |
|-----------|-----------|-----------|----------------|
| {name} | `path/to/file.ts:10-30` | Yes/Partial/No | {how it's used or extended} |

### 4.1 Deep Analysis

Consider (use extended thinking if needed):

- **ARCHITECTURE_FIT**: How does this integrate with the existing architecture?
- **EXECUTION_ORDER**: What must happen first → second → third?
- **FAILURE_MODES**: Edge cases, race conditions, error scenarios?
- **PERFORMANCE**: Will this scale? Database queries optimized?
- **SECURITY**: Attack vectors? Data exposure risks? Auth/authz?
- **MAINTAINABILITY**: Will future devs understand this code?

### 4.2 Document Decisions

```markdown
APPROACH_CHOSEN: [description]
RATIONALE: [why this over alternatives - reference codebase patterns]

ALTERNATIVES_REJECTED:
- [Alternative 1]: Rejected because [specific reason]
- [Alternative 2]: Rejected because [specific reason]

NOT_BUILDING (explicit scope limits):
- [Item 1 - explicitly out of scope and why]
- [Item 2 - explicitly out of scope and why]
```

**CHECKPOINT:**

- [ ] Approach aligns with existing architecture and patterns
- [ ] Dependencies ordered correctly (types → repository → service → routes)
- [ ] Edge cases identified with specific mitigation strategies
- [ ] Scope boundaries are explicit and justified

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] Approach aligns with existing architecture and patterns
- [ ] Dependencies ordered correctly (types → repository → service → routes)
- [ ] Edge cases identified with specific mitigation strategies
- [ ] Scope boundaries are explicit and justified
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 5: GENERATE - Write Plan File

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 5: GENERATE - Write Plan File
subagent_type: general
</SUBAGENT>
<PROMPT>
### 5.1 Create Artifact Directory

```bash
mkdir -p .archon-artifacts
```

### 5.2 Write Plan

Write to `.archon-artifacts/plan.md`:

```markdown
# Feature: {Feature Name}

## Summary

{One paragraph: What we're building and high-level approach}

## User Story

As a {user type}
I want to {action}
So that {benefit}

## Problem Statement

{Specific problem this solves - must be testable}

## Solution Statement

{How we're solving it - architecture overview}

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY / ENHANCEMENT / REFACTOR / BUG_FIX |
| Complexity | LOW / MEDIUM / HIGH |
| Systems Affected | {comma-separated list} |
| Dependencies | {external libs/services with versions} |
| Estimated Tasks | {count} |

---

## UX Design

### Before State

{ASCII diagram - current user experience with data flows}

### After State

{ASCII diagram - new user experience with data flows}

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| {path/component} | {old behavior} | {new behavior} | {what changes for user} |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `path/to/critical.ts` | 10-50 | Pattern to MIRROR exactly |
| P1 | `path/to/types.ts` | 1-30 | Types to IMPORT |
| P2 | `path/to/test.ts` | all | Test pattern to FOLLOW |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [Lib Docs v{version}](url#anchor) | {section name} | {specific reason} |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```typescript
// SOURCE: {file:lines}
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

**ERROR_HANDLING:**
```typescript
// SOURCE: {file:lines}
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

**LOGGING_PATTERN:**
```typescript
// SOURCE: {file:lines}
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: {file:lines}
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/features/new/models.ts` | CREATE | Type definitions |
| `src/features/new/service.ts` | CREATE | Business logic |
| `src/existing/index.ts` | UPDATE | Add integration |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- {Item 1 - explicitly out of scope and why}
- {Item 2 - explicitly out of scope and why}

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: {CREATE/UPDATE} `{file path}`

- **ACTION**: {CREATE new file / UPDATE existing file}
- **IMPLEMENT**: {specific what to implement}
- **MIRROR**: `{source-file:lines}` - follow this pattern exactly
- **IMPORTS**: `{specific imports needed}`
- **GOTCHA**: {known issue to avoid}
- **VALIDATE**: `{validation-command}` - must pass before next task

### Task 2: {CREATE/UPDATE} `{file path}`

{... repeat for each task ...}

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `src/features/new/tests/service.test.ts` | CRUD ops, edge cases | Business logic |

### Edge Cases Checklist

- [ ] Empty string inputs
- [ ] Missing required fields
- [ ] Unauthorized access attempts
- [ ] Not found scenarios
- [ ] {feature-specific edge case}

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
{runner} run type-check && {runner} run lint
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: UNIT_TESTS

```bash
{runner} test {path/to/feature/tests}
```

**EXPECT**: All tests pass

### Level 3: FULL_SUITE

```bash
{runner} run validate
```

**EXPECT**: All tests pass, build succeeds

---

## Acceptance Criteria

- [ ] All specified functionality implemented per user story
- [ ] Level 1-3 validation commands pass with exit 0
- [ ] Code mirrors existing patterns exactly (naming, structure, logging)
- [ ] No regressions in existing tests
- [ ] UX matches "After State" diagram

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Risk description} | LOW/MED/HIGH | LOW/MED/HIGH | {Specific prevention/handling strategy} |

---

## Notes

{Additional context, design decisions, trade-offs, future considerations}
```

### 5.3 If Input Was PRD

Also update the PRD file:
1. Change the phase's Status from `pending` to `in-progress`
2. Add the plan file path to the PRP Plan column

**CHECKPOINT:**

- [ ] Plan file written to `.archon-artifacts/plan.md`
- [ ] All sections populated with actual codebase data
- [ ] If PRD: source file updated

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_5_CHECKPOINT
- [ ] Plan file written to `.archon-artifacts/plan.md`
- [ ] All sections populated with actual codebase data
- [ ] If PRD: source file updated
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 6: VERIFY - Plan Quality Check

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 6: VERIFY - Plan Quality Check
subagent_type: general
</SUBAGENT>
<PROMPT>
### 6.1 Context Completeness

- [ ] All patterns from Explore agent documented with file:line references
- [ ] External docs versioned to match package.json
- [ ] Integration points mapped with specific file paths
- [ ] Gotchas captured with mitigation strategies
- [ ] Every task has at least one executable validation command

### 6.2 Implementation Readiness

- [ ] Tasks ordered by dependency (can execute top-to-bottom)
- [ ] Each task is atomic and independently testable
- [ ] No placeholders - all content is specific and actionable
- [ ] Pattern references include actual code snippets (copy-pasted, not invented)

### 6.3 Pattern Faithfulness

- [ ] Every new file mirrors existing codebase style exactly
- [ ] No unnecessary abstractions introduced
- [ ] Naming follows discovered conventions
- [ ] Error/logging patterns match existing
- [ ] Test structure matches existing tests

### 6.4 No Prior Knowledge Test

**Could an agent unfamiliar with this codebase implement using ONLY the plan?**

If NO → add missing context to plan.

**CHECKPOINT:**

- [ ] All verification checks pass
- [ ] Plan is self-contained

---

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_6_CHECKPOINT
- [ ] All verification checks pass
- [ ] Plan is self-contained
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---

## Phase 7: OUTPUT - Report to User

<SUBAGENT>
description: archon-idea-to-pr-create-plan: Phase 7: OUTPUT - Report to User
subagent_type: general
</SUBAGENT>
<PROMPT>
```markdown
## Plan Created

**File**: `.archon-artifacts/plan.md`
**Workflow ID**: `$WORKFLOW_ID`

{If from PRD:}
**Source PRD**: `{prd-file-path}`
**Phase**: #{number} - {phase name}
**PRD Updated**: Status set to `in-progress`, plan linked

{If parallel phases available:}
**Parallel Opportunity**: Phase {X} can run concurrently in a separate worktree.

---

### Summary

{2-3 sentence feature overview}

### Metadata

| Field | Value |
|-------|-------|
| Complexity | {LOW/MEDIUM/HIGH} |
| Files to CREATE | {N} |
| Files to UPDATE | {M} |
| Total Tasks | {K} |

### Key Patterns Discovered

- {Pattern 1 from Explore agent with file:line}
- {Pattern 2 from Explore agent with file:line}
- {Pattern 3 from Explore agent with file:line}

### External Research

- {Key doc 1 with version}
- {Key doc 2 with version}

### UX Transformation

- **BEFORE**: {one-line current state}
- **AFTER**: {one-line new state}

### Risks

- {Primary risk}: {mitigation}

### Confidence Score

**{1-10}/10** for one-pass implementation success

{Rationale for score}

---

### Next Step

Plan ready. Proceeding to implementation setup.
```

---

## Success Criteria

- **CONTEXT_COMPLETE**: All patterns, gotchas, integration points documented from actual codebase via Explore agent
- **IMPLEMENTATION_READY**: Tasks executable top-to-bottom without questions, research, or clarification
- **PATTERN_FAITHFUL**: Every new file mirrors existing codebase style exactly
- **VALIDATION_DEFINED**: Every task has executable verification command
- **UX_DOCUMENTED**: Before/After transformation is visually clear with data flows
- **ONE_PASS_TARGET**: Confidence score 8+ indicates high likelihood of first-attempt success
- **ARTIFACT_WRITTEN**: Plan saved to `.archon-artifacts/plan.md`

Write all results to `.archon-artifacts/`.
</PROMPT>

### PHASE_7_CHECKPOINT
- [ ] Report written and displayed to user
- [ ] Output written to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
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
