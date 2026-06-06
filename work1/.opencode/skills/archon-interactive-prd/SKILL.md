---
name: archon-interactive-prd
description: |
  Use when: User wants to create a PRD through interactive elicitation using isolated subagents.
  Triggers: "create a prd", "write a prd", "make a prd", "product requirements document",
  "prd for", "generate prd", "interactive prd", "archon-interactive-prd", "create prd".
  Capability: End-to-end interactive PRD creation using fresh subagents per phase.
  Each phase is a separate subagent with zero memory of previous steps.
  Phases: DISCOVER -> DRAFT -> REVIEW -> FINALIZE.
  NOT for: Quick PRD edits, reviewing existing PRDs, or PRD template creation.
argument-hint: "<product idea description>"
---

# Archon Interactive PRD: Deterministic PRD Creation

**Core principle:** Each phase runs as a **fresh subagent** via the Task tool with zero memory of prior conversation. Phases communicate ONLY through `.archon-artifacts/` on disk.

## CRITICAL RULES (ABSOLUTE — NO EXCEPTIONS)

1. **You MUST use the Task tool** to invoke a subagent for every phase. Never do the work yourself.
2. **Do NOT discover, draft, review, or finalize anything directly.** Always delegate via Task tool with the exact parameters specified.
3. **After each subagent completes** — verify the checkpoint checklist items before proceeding to the next phase.
4. **Execute phases in strict order:** SETUP -> DISCOVER -> DRAFT -> REVIEW -> FINALIZE -> REPORT. Never skip, reorder, or combine phases.
5. **Never load multiple subagents simultaneously.** Execute one phase, verify its checkpoint, then start the next.

## Setup

```bash
mkdir -p .archon-artifacts
echo "$ARGUMENTS" > .archon-artifacts/input.txt
```

### SETUP_CHECKPOINT
- [ ] `.archon-artifacts/` directory created
- [ ] `input.txt` written with the full product idea description
- [ ] Working directory is the project root

---

## Phase 1: DISCOVER — Interactive Elicitation

**CRITICAL: You MUST use the Task tool. Do NOT do this work yourself.**

Use the Task tool with these exact parameters:
- **description**: "Interactive PRD discovery"
- **subagent_type**: "general"
- **prompt**: |
    Read .archon-artifacts/input.txt for the product idea.

    Your job is to interview the user interactively to elicit requirements. Ask questions one at a time. Wait for the user's answer before asking the next question.

    Cover these areas systematically:
    1. What is the core problem this product solves?
    2. Who are the target users? (end users, admins, stakeholders)
    3. What are the key user stories or use cases?
    4. What features are essential vs nice-to-have?
    5. What are the success criteria and metrics?
    6. What is the desired timeline or milestones?
    7. What are the known risks or constraints?
    8. What is explicitly out of scope?

    After all questions are answered, synthesize everything into a structured discovery document at .archon-artifacts/discovery.md with:
    - Product name / title
    - Problem statement
    - Target user segments
    - Key user stories (numbered)
    - Feature wishlist (grouped by priority)
    - Success metrics
    - Timeline expectations
    - Risks and constraints
    - Out of scope items
    - Open questions

**After the subagent completes**, verify:

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/discovery.md` exists and is non-empty
- [ ] Discovery contains all required sections (problem, users, stories, features, metrics, timeline, risks, out of scope, open questions)
- [ ] User was interactively interviewed (questions asked, answers captured)
- [ ] No PRD was written yet (discovery phase only)

**If checkpoint passes** -> proceed to Phase 2.
**If checkpoint fails** -> re-launch Phase 1 subagent with the failure details.

---

## Phase 2: DRAFT — PRD Creation

**CRITICAL: You MUST use the Task tool. Do NOT do this work yourself.**

Use the Task tool with these exact parameters:
- **description**: "Create PRD draft"
- **subagent_type**: "general"
- **prompt**: |
    Read .archon-artifacts/discovery.md for the product discovery data.

    Write a complete Product Requirements Document to .archon-artifacts/prd.md with ALL of the following sections:

    1. **Title** — Product name and document version
    2. **Overview** — Executive summary of the product
    3. **Problem Statement** — Clear description of the problem being solved
    4. **Target Users** — User segments and their characteristics
    5. **User Stories** — Numbered user stories in "As a... I want... So that..." format
    6. **Functional Requirements** — Numbered list of functional requirements with priority labels (P0, P1, P2)
    7. **Non-Functional Requirements** — Performance, security, scalability, reliability, usability requirements
    8. **Success Metrics** — Measurable KPIs and success criteria
    9. **Scope (In/Out)** — Clear in-scope and out-of-scope items
    10. **Timeline** — Phases or milestones with estimated dates
    11. **Risks & Mitigations** — Identified risks with mitigation strategies
    12. **Open Questions** — Unresolved questions requiring further discussion

    Each section should be substantive and specific to the product idea. Use the discovery document as the source of truth. If the discovery document lacks information for any section, use your best judgment to fill gaps and mark them with [ASSUMPTION].

    Format using clean markdown with headings, bullet points, and tables where appropriate.

**After the subagent completes**, verify:

### PHASE_2_CHECKPOINT
- [ ] `.archon-artifacts/prd.md` exists and is non-empty
- [ ] All 12 PRD sections present (Title, Overview, Problem Statement, Target Users, User Stories, Functional Requirements, Non-Functional Requirements, Success Metrics, Scope, Timeline, Risks, Open Questions)
- [ ] Each section has substantive content (not placeholder text)
- [ ] Assumptions explicitly marked with [ASSUMPTION] tags
- [ ] **GATE**: If any section is missing or has placeholder-only content -> re-launch Phase 2 to fix

**If checkpoint passes** -> proceed to Phase 3.
**If checkpoint fails** -> re-launch Phase 2 subagent with specific missing sections.

---

## Phase 3: REVIEW — Validation

**CRITICAL: You MUST use the Task tool. Do NOT do this work yourself.**

Use the Task tool with these exact parameters:
- **description**: "Validate and fix PRD"
- **subagent_type**: "general"
- **prompt**: |
    Read .archon-artifacts/prd.md for the PRD draft.
    Read .archon-artifacts/discovery.md for the original discovery data.

    Review the PRD for:
    1. **Completeness** — All 12 sections present with substantive content
    2. **Consistency** — No contradictions between sections
    3. **Clarity** — Language is clear, specific, and unambiguous
    4. **Feasibility** — Requirements are realistic and achievable
    5. **Completeness vs Discovery** — All discovery content is reflected in the PRD

    For each issue found:
    - Fix it directly in .archon-artifacts/prd.md
    - Log the issue and resolution to .archon-artifacts/review.md

    After fixes, write a final validation report to .archon-artifacts/review.md with:
    - Sections checked and their status (PASS/NEEDS_ATTENTION)
    - Issues found and their resolutions
    - Overall verdict: PASS or FAIL
    - Recommendations for the final output

**After the subagent completes**, verify:

### PHASE_3_CHECKPOINT
- [ ] `.archon-artifacts/review.md` exists
- [ ] All 12 sections checked with PASS/NEEDS_ATTENTION status
- [ ] Any issues found were fixed in prd.md
- [ ] Overall verdict is documented
- [ ] **GATE**: If overall verdict is FAIL -> re-launch Phase 3 to fix remaining issues

**If checkpoint passes** -> proceed to Phase 4.
**If checkpoint fails** -> re-launch Phase 3 subagent to fix remaining issues.

---

## Phase 4: FINALIZE — Output

**CRITICAL: You MUST use the Task tool. Do NOT do this work yourself.**

Use the Task tool with these exact parameters:
- **description**: "Finalize PRD output"
- **subagent_type**: "general"
- **prompt**: |
    Read .archon-artifacts/prd.md for the validated PRD.
    Read .archon-artifacts/review.md for the review report.

    Read .archon-artifacts/input.txt for any output path specified by the user. If a specific output path was provided in the original request, write the final PRD there. Otherwise, offer to write to a path of the user's choosing.

    Steps:
    1. Ask the user where they want the final PRD saved (if not specified in input)
    2. Create the target directory if it doesn't exist
    3. Write the final PRD to the specified path
    4. Write .archon-artifacts/summary.md with:
       - Product name
       - Output file path
       - Number of sections in the PRD
       - Overall quality verdict from review
       - Key metrics (user stories count, requirements count, risks identified)
       - Next steps / recommendations

**After the subagent completes**, verify:

### PHASE_4_CHECKPOINT
- [ ] Final PRD written to user-specified path
- [ ] `.archon-artifacts/summary.md` exists
- [ ] Summary includes product name, output path, section count, verdict, key metrics, next steps
- [ ] Target directory was created if it didn't exist
- [ ] **GATE**: If final PRD file is missing -> re-launch Phase 4 to write it

**If checkpoint passes** -> proceed to Report.
**If checkpoint fails** -> re-launch Phase 4 subagent to fix.

---

## Report

1. Read `.archon-artifacts/summary.md`
2. Output the EXACT text below, replacing only the `{placeholder}` values with actual content from summary.md:

```
===============================================================
ARCHON INTERACTIVE PRD — COMPLETE
===============================================================

Product: {product name from summary.md}
Output: {output file path from summary.md}
Quality: {overall verdict from summary.md}

-- Artifacts --
.archon-artifacts/input.txt
.archon-artifacts/discovery.md
.archon-artifacts/prd.md
.archon-artifacts/review.md
.archon-artifacts/summary.md
===============================================================
```

### REPORT_CHECKPOINT
- [ ] `.archon-artifacts/summary.md` read
- [ ] Banner displayed with exact formatting (including `===` lines and `-- Artifacts --` section)
- [ ] Product name, output path, and quality verdict filled in correctly
- [ ] No extra text added before or after the banner
