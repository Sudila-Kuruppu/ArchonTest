---
name: archon
description: |
  Use when: User wants to run Archon workflows, create workflows/commands, or manage Archon config.
  Triggers: "use archon to", "run archon", "archon workflow", "have archon", "let archon",
  "ask archon to", "create a workflow", "set up archon", "configure archon".
  Capability: Runs AI workflows in isolated git worktrees for parallel development (PR review,
  issue fix, feature dev, refactoring, architecture, PRD creation, and more).
  NOT for: Direct agent work - only for delegating to Archon CLI via archon workflow run.
argument-hint: "[workflow] [message or issue number]"
---

# Archon CLI Skill

Archon is a remote agentic coding platform that runs AI workflows in isolated git worktrees. This skill teaches you how to run workflows, create new workflows and commands, and manage Archon configuration.

## Workflow Discovery

Find available workflows with:

```bash
archon workflow list --json | python3 -c "import sys,json; [print(f'  {w[\"name\"]} — {w.get(\"description\",\"\").split(chr(10))[0]}') for w in json.load(sys.stdin)]"
```

## Core Command

```bash
archon workflow run <workflow-name> --branch <branch-name> "<message>"
```

**CRITICAL**:

1. **Always run in background** — Archon workflows are long-running. Use `&` or a new terminal.
2. **Always use `--branch`** for worktree isolation.
3. **One workflow per shell** — each blocks its shell.

### Isolation Modes

| Mode               | Flag                            | When                             |
| ------------------ | ------------------------------- | -------------------------------- |
| Worktree (default) | `--branch <name>`               | Always unless told otherwise     |
| Custom start-point | `--branch <name> --from <base>` | Start from specific branch       |
| Direct checkout    | `--no-worktree`                 | Only if user explicitly requests |
| Resume failed run  | `--resume`                      | Resume from last failure         |

## Common Workflow Patterns

| Intent                  | Workflow                         | Branch                 |
| ----------------------- | -------------------------------- | ---------------------- |
| "Fix issue #X"          | `archon-fix-github-issue`        | `fix/issue-{N}`        |
| "Review PR #X"          | `archon-comprehensive-pr-review` | `review/pr-{N}`        |
| "Quick review PR"       | `archon-smart-pr-review`         | `review/pr-{N}`        |
| "Validate PR #X"        | `archon-validate-pr`             | `review/pr-{N}`        |
| "Implement from plan"   | `archon-feature-development`     | `feat/{name}`          |
| "Plan and implement"    | `archon-idea-to-pr`              | `feat/{name}`          |
| "Execute plan file"     | `archon-plan-to-pr`              | `feat/{name}`          |
| "Run ralph"             | `archon-ralph-dag`               | `feat/{name}`          |
| "Resolve conflicts"     | `archon-resolve-conflicts`       | `resolve/pr-{N}`       |
| "Create issue"          | `archon-create-issue`            | `issue/{name}`         |
| "Full issue review"     | `archon-issue-review-full`       | `review/issue-{N}`     |
| "Refactor safely"       | `archon-refactor-safely`         | `refactor/{name}`      |
| "Architecture review"   | `archon-architect`               | `review/{name}`        |
| "PIV loop / guided dev" | `archon-piv-loop`                | `piv/{name}`           |
| "Create a PRD"          | `archon-interactive-prd`         | `prd/{name}`           |
| General / debugging     | `archon-assist`                  | `assist/{description}` |

## Multi-Issue Invocation

Run each as a separate background task:

```bash
archon workflow run archon-fix-github-issue --branch fix/issue-10 "Fix issue #10" &
archon workflow run archon-fix-github-issue --branch fix/issue-11 "Fix issue #11" &
```

## Other CLI Commands

```bash
archon workflow list              # List available workflows
archon isolation list             # Show active worktrees
archon isolation cleanup          # Remove stale worktrees
archon complete <branch>          # End branch lifecycle
archon version                    # Show version
```

## Authoring Quick Start

Workflows are YAML files in `.archon/workflows/`. Each has a DAG of nodes:

```yaml
name: my-workflow
description: What this does
provider: claude
nodes:
  - id: first-node
    command: my-command # Loads .archon/commands/my-command.md
  - id: second-node
    prompt: "Use: $first-node.output"
    depends_on: [first-node]
```

### Node Types

Each node has exactly ONE of: `command`, `prompt`, `bash`, `script`, `loop`, `approval`, or `cancel`.

**Command** — runs a `.archon/commands/*.md` file:

```yaml
- id: investigate
  command: investigate-issue
```

**Prompt** — inline AI prompt:

```yaml
- id: classify
  prompt: "Classify: $ARGUMENTS"
  model: haiku
```

**Bash** — shell script, no AI:

```yaml
- id: fetch
  bash: "gh issue view 42 --json title,body"
```

**Script** — TypeScript/Python via bun/uv:

```yaml
- id: transform
  script: "console.log(JSON.stringify({ok: true}));"
  runtime: bun
```

**Loop** — iterates AI until completion:

```yaml
- id: implement
  loop:
    prompt: "Implement next story. When done: <promise>COMPLETE</promise>"
    until: COMPLETE
    max_iterations: 10
```

**Approval** — pauses for human review:

```yaml
- id: gate
  approval:
    message: "Review the plan before proceeding."
    capture_response: true
```

**Cancel** — terminates with reason:

```yaml
- id: stop
  cancel: "Input flagged UNSAFE."
  when: "$classify.output != 'SAFE'"
```

### Key Variables

| Variable         | Description                    |
| ---------------- | ------------------------------ |
| `$ARGUMENTS`     | User's input message           |
| `$ARTIFACTS_DIR` | Pre-created artifact directory |
| `$BASE_BRANCH`   | Base branch (auto-detected)    |
| `$WORKFLOW_ID`   | Unique run ID                  |
| `$nodeId.output` | Output from upstream node      |

### Commands

Files in `.archon/commands/` are markdown with frontmatter:

```markdown
---
description: What this does
argument-hint: <expected arguments>
---

User request: $ARGUMENTS
[Instructions for the AI agent]
```

## Docs

Full docs: https://archon.diy
