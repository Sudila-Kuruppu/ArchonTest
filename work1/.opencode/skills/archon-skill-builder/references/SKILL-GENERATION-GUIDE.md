---
description: Reference for generating proper opencode skills from Archon workflow YAMLs.
Covers sub-skill architecture, command file conversion, naming, and common pitfalls.
---

# Skill Generation Guide: Archon YAML → OpenCode Skills

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [YAML Parsing Rules](#2-yaml-parsing-rules)
3. [Sub-Skill Generation](#3-sub-skill-generation)
4. [Main Skill Orchestration](#4-main-skill-orchestration)
5. [Naming Conventions](#5-naming-conventions)
6. [Phase Structure Template](#6-phase-structure-template)
7. [Parallel Phase Output Handling](#7-parallel-phase-output-handling)
8. [Common Pitfalls](#8-common-pitfalls)
9. [Validation Checklist](#9-validation-checklist)

---

## 1. Architecture Overview

A generated skill has two layers:

```
.opencode/skills/<skill-name>/
├── SKILL.md                     # Main orchestrator — loads sub-skills via skill tool
├── create-plan/SKILL.md         # Sub-skill for each command node
├── plan-setup/SKILL.md
├── implement-tasks/SKILL.md
├── validate/SKILL.md
└── ...                          # One sub-skill per command
```

**The main skill** defines phases that delegate to subagents. Each subagent loads its dedicated sub-skill via the skill tool and follows its instructions.

**Each sub-skill** is a standalone, focused opencode skill that:
- Contains the full detailed instructions from the original command file
- Has EXECUTION PROTOCOLS, phases, SUBAGENT/PROMPT blocks, checkpoints, and validation
- Writes outputs to `.archon-artifacts/<node-id>-output.txt`
- Is independently loadable and testable

**Data flow between phases:** All phases communicate ONLY through `.archon-artifacts/` on disk. Each subagent writes its results there; the next subagent reads prior outputs from the same directory.

---

## 2. YAML Parsing Rules

Archon workflow YAML nodes use field-based typing, NOT a `type:` field. The parser must detect these fields:

```yaml
nodes:
  # Command node — references a command file
  - id: create-plan
    command: archon-create-plan      # <-- this means it's a command node
    depends_on: []                   # root node
    context: fresh

  # Bash node — inline script
  - id: verify-pr-base
    bash: |                          # <-- this means it's a bash node
      set -euo pipefail
      gh pr view --json baseRefName -q '.baseRefName'
    depends_on: [finalize-pr]

  # Prompt node — direct instruction text
  - id: some-prompt
    type: prompt                     # <-- explicit type field (rare)
    content: "Do something"

  # Other recognized fields: script, loop, approval, cancel
```

Detection logic (pseudocode):

```
for each node in nodes:
    if node has "command" and node.command:
        type = "command"
        command_name = node.command
        subskill_dir = node.command.replace("archon-", "")
    elif node has "bash" and node.bash:
        type = "bash"
        bash_script = node.bash
    elif node has "type" and node.type in known_types:
        type = node.type
    else:
        type = "prompt"
        content = node.content or node.prompt or node.message
```

---

## 3. Sub-Skill Generation

Each command node in the workflow maps to a **command file** at `.archon/commands/defaults/<name>.md`. The sub-skill must be generated FROM that file, not from a template or stub.

### Process

For each unique `command:` value:

1. **Read the command file** at `.archon/commands/defaults/archon-<name>.md`
2. **Extract frontmatter** (description, argument-hint)
3. **Parse phases** — split body at `## Phase N:` headings
4. **Convert** each phase into a SUBAGENT/PROMPT block
5. **Replace `$ARTIFACTS_DIR`** with `.archon-artifacts` everywhere
6. **Wrap** in proper opencode skill format:
   - YAML frontmatter with `name: <skill-name>-<subskill-name>`
   - EXECUTION PROTOCOLS section
   - Setup phase for preamble content (before first `## Phase` heading)
   - Phase blocks with SUBAGENT/PROMPT
   - CHECKPOINT sections per phase
   - Success Criteria at end

### Bash Nodes

For `bash:` nodes (no command file), create a simple sub-skill with:
- One phase containing the bash script
- EXECUTION PROTOCOLS
- CHECKPOINT section
- Output file pointing to `.archon-artifacts/<node-id>-output.txt`

---

## 4. Main Skill Orchestration

The main skill's job is to orchestrate phases, NOT to contain detailed instructions. Each phase is a thin wrapper:

```
## Phase 1: create-plan

### create-plan

<SUBAGENT>
description: <skill-name>: Phase 1 - create-plan
subagent_type: general
</SUBAGENT>
<PROMPT>
First, load the skill `<skill-name>-<subskill-name>` using the skill tool:
`skill(name="<skill-name>-<subskill-name>")`.

Then, follow the sub-skill instructions exactly.
Read `.archon-artifacts/input.txt` for input and `.archon-artifacts/phase-*-output.txt` for prior outputs.
Write results to `.archon-artifacts/phase-1-output.txt`.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] Subagent completed Phase 1
- [ ] `.archon-artifacts/phase-1-output.txt` exists

**Checkpoint passed?** Proceed to Phase 2.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-1-output.txt && echo "PASS" || echo "FAIL"
```
</VALIDATE>
```

**Key rule:** The subagent loads the sub-skill itself using `skill(name="...")` at the start of its prompt. The orchestrator does NOT pre-load the sub-skill.

---

## 5. Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Main skill directory | `<skill-name>` | `archon-idea-to-pr` |
| Main skill name (frontmatter) | `<skill-name>` | `archon-idea-to-pr` |
| Sub-skill directory | `<command-suffix>` | `code-review-agent` |
| Sub-skill name (frontmatter) | `<skill-name>-<command-suffix>` | `archon-idea-to-pr-code-review-agent` |
| Command file | `archon-<command-suffix>.md` | `archon-code-review-agent.md` |
| Bash node sub-skill dir | `<node-id>` | `verify-pr-base` |
| Phase output file | `phase-<N>-output.txt` | `phase-3-output.txt` |
| Parallel output file | `phase-<N>-<node-id>-output.txt` | `phase-10-code-review-agent-output.txt` |

**Deriving sub-skill directory from command name:**
```
archon-code-review-agent  →  strip "archon-" prefix  →  code-review-agent
```

---

## 6. Phase Structure Template

Every phase in a sub-skill must follow this structure:

```markdown
## Phase N: <TITLE>

<SUBAGENT>
description: <skill-name>-<subskill-name>: Phase N - <title>
subagent_type: general
</SUBAGENT>
<PROMPT>
<phase content from command file>

Write results to `.archon-artifacts/`.
</PROMPT>

### PHASE_N_CHECKPOINT
- [ ] <phase-specific check item>
- [ ] <phase-specific check item>
- [ ] Output saved to `.archon-artifacts/`

**Checkpoint passed?** Proceed to next phase.
**Checkpoint failed?** Re-run with failure details appended.

<VALIDATE>
```bash
echo "PASS: Phase completed"
```
</VALIDATE>

---
```

### Checklist extraction

Extract checklist items from the command file's content. Look for lines with `- [ ]` or `- [x]` patterns within each phase. If none found, add a generic completion check.

---

## 7. Parallel Phase Output Handling

When a phase contains multiple parallel nodes (e.g., 5 review agents running simultaneously), each subagent must write to a **unique output file** to avoid overwrites.

**Pattern:** `phase-<N>-<node-id>-output.txt`

```
Phase 10 (parallel):
├── code-review-agent    →  phase-10-code-review-agent-output.txt
├── error-handling-agent →  phase-10-error-handling-agent-output.txt
├── test-coverage-agent  →  phase-10-test-coverage-agent-output.txt
├── comment-quality-agent→  phase-10-comment-quality-agent-output.txt
└── docs-impact-agent    →  phase-10-docs-impact-agent-output.txt
```

The VALIDATE block must check ALL parallel outputs:

```bash
test -s .archon-artifacts/phase-10-code-review-agent-output.txt && \
test -s .archon-artifacts/phase-10-error-handling-agent-output.txt && \
test -s .archon-artifacts/phase-10-test-coverage-agent-output.txt && \
test -s .archon-artifacts/phase-10-comment-quality-agent-output.txt && \
test -s .archon-artifacts/phase-10-docs-impact-agent-output.txt && \
echo "PASS" || echo "FAIL: parallel outputs missing"
```

---

## 8. Common Pitfalls

### Pitfall 1: Treating command: nodes as prompt nodes
**Problem:** The parser checks `node.get("type", "")` which is empty for `command:` nodes.
**Fix:** Check `node.get("command")` first, then `node.get("bash")`, then fall back to `type`.

### Pitfall 2: Empty prompts in generated phases
**Problem:** Command nodes have no `content` field — all instructions are in the command file.
**Fix:** Read the actual command file `.archon/commands/defaults/archon-<name>.md` and use its content.

### Pitfall 3: $ARTIFACTS_DIR not replaced
**Problem:** Command files reference `$ARTIFACTS_DIR` which doesn't exist in opencode context.
**Fix:** Replace ALL occurrences with `.archon-artifacts` (both `$ARTIFACTS_DIR` and `${ARTIFACTS_DIR}`).

### Pitfall 4: Pre-phase content as separate phase
**Problem:** Content before the first `## Phase` heading (e.g., "Your Mission") gets wrapped as a duplicate Phase 1.
**Fix:** Split preamble from phase sections. Put preamble in a `## Setup` section before the phases.

### Pitfall 5: Parallel subagents overwriting same output file
**Problem:** Multiple subagents in the same phase write to `phase-N-output.txt`.
**Fix:** Use unique filenames: `phase-N-<node-id>-output.txt`.

### Pitfall 6: Sub-skill name mismatch
**Problem:** Main skill references `archon-idea-to-pr-code-review` but sub-skill is named `archon-idea-to-pr-code-review-agent`.
**Fix:** Derive the sub-skill name from the command file name (strip `archon-` prefix), and use `<skill-name>-<subskill-dir>` format consistently.

### Pitfall 7: Missing EXECUTION PROTOCOLS
**Problem:** Sub-skills missing SUBAGENT or VALIDATE protocol sections — subagents don't know how to run.
**Fix:** Always include both SUBAGENT PROTOCOL and VALIDATE PROTOCOL in every sub-skill.

### Pitfall 8: Overwriting main skill references
**Problem:** Regenerating sub-skills changes directories but main skill still references old names.
**Fix:** After regenerating sub-skills, always re-verify the main skill's `skill(name="...")` calls match the sub-skill frontmatter `name:` fields.

---

## 9. Validation Checklist

After generating any skill, run these checks:

### Frontmatter
- [ ] Main skill has `name`, `description`, `triggers`, `argument-hint`, `NOT for`
- [ ] Each sub-skill has `name`, `description`, `argument-hint`
- [ ] Sub-skill name follows `<skill-name>-<subskill>` pattern
- [ ] All sub-skill names referenced in main skill's `skill(name="...")` calls

### Protocols
- [ ] SUBAGENT PROTOCOL section present
- [ ] VALIDATE PROTOCOL section present
- [ ] SUBAGENT SKILL LOADING instructions (or equivalent) present

### Phases
- [ ] All workflow nodes mapped to phases
- [ ] Each phase has `<SUBAGENT>`/`<PROMPT>` blocks
- [ ] Each phase has `### CHECKPOINT` section
- [ ] Each phase has `<VALIDATE>` block
- [ ] Parallel phases use unique output files
- [ ] Phase ordering is correct (topological sort)

### Content
- [ ] No `$ARTIFACTS_DIR` references remain (must be `.archon-artifacts`)
- [ ] No placeholder text (`TODO`, `FIXME`, empty prompts)
- [ ] Command-derived sub-skills contain actual command file content
- [ ] Bash nodes have inline script content

### Structural
- [ ] Sub-skills live at `.opencode/skills/<skill-name>/<subskill>/SKILL.md`
- [ ] Main skill at `.opencode/skills/<skill-name>/SKILL.md`
- [ ] All sub-skills loadable via `skill()` tool
- [ ] `wc -l` on each file is reasonable (sub-skills 50-1000 lines; main skill 300-700 lines)
