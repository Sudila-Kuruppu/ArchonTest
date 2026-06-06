---
name: archon-skill-builder
description: |
  Use when: User wants to generate a complete opencode skill from an Archon workflow YAML file.
  Triggers: "archon-skill-builder", "convert workflow", "generate skill", "build a skill",
  "skill from yaml", "yaml to skill", "create a skill".
  Capability: Generates complete opencode skills from Archon workflow YAML files.
  Each phase is a separate subagent with zero memory of previous steps.
  Phases: DISCOVER -> MAP -> GENERATE -> VALIDATE -> FINALIZE.
  NOT for: Editing existing skills, running workflows, or managing Archon configuration.
argument-hint: "<yaml-path or 'discover'>"
---

# Archon Skill Builder: Deterministic Skill Generation

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
pip3 install pyyaml -q
```

### SETUP_CHECKPOINT
- [ ] `.archon-artifacts/` directory created
- [ ] `input.txt` written with the workflow YAML path
- [ ] pyyaml installed
- [ ] Working directory is the project root

---

## Phase 1: DISCOVER -- Parse Workflow YAML

<SUBAGENT>
description: archon-skill-builder: DISCOVER -- parse workflow YAML
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/input.txt to get the YAML file path. The path is relative to the project root.

### 1. Validate the YAML Path

```bash
YAML_PATH=$(cat .archon-artifacts/input.txt | tr -d '\n')
echo "YAML path: $YAML_PATH"

if [ ! -f "$YAML_PATH" ]; then
    echo "ERROR: File not found: $YAML_PATH"
    echo '{"error": "file_not_found", "path": "'"$YAML_PATH"'"}' > .archon-artifacts/workflow.json
    exit 1
fi

if [ ! -s "$YAML_PATH" ]; then
    echo "ERROR: Empty or unreadable file: $YAML_PATH"
    echo '{"error": "empty_file", "path": "'"$YAML_PATH"'"}' > .archon-artifacts/workflow.json
    exit 1
fi
```

### 2. Parse YAML to JSON

```bash
python3 -c "
import sys, json, yaml, os

try:
    data = yaml.safe_load(open('$YAML_PATH'))
except yaml.YAMLError as e:
    print(f'ERROR: Invalid YAML: {e}', file=sys.stderr)
    json.dump({'error': 'invalid_yaml', 'detail': str(e)}, sys.stdout)
    sys.exit(1)
except Exception as e:
    print(f'ERROR: Could not read file: {e}', file=sys.stderr)
    json.dump({'error': 'read_error', 'detail': str(e)}, sys.stdout)
    sys.exit(1)

if data is None:
    json.dump({'error': 'empty_yaml', 'path': '$YAML_PATH'}, sys.stdout)
    sys.exit(1)

if 'name' not in data:
    data['name'] = os.path.splitext(os.path.basename('$YAML_PATH'))[0]
    print(f'WARNING: No name field in YAML, using filename: {data[\"name\"]}', file=sys.stderr)

if 'nodes' not in data or not data['nodes']:
    json.dump({'error': 'no_nodes', 'detail': 'Workflow has zero nodes'}, sys.stdout)
    sys.exit(1)

json.dump(data, sys.stdout, indent=2)
" > .archon-artifacts/workflow-parsed.json 2>.archon-artifacts/parse-errors.txt

cat .archon-artifacts/parse-errors.txt
```

### 3. Check for Parse Errors

```bash
if [ -f .archon-artifacts/workflow-parsed.json ]; then
    ERROR_CHECK=$(python3 -c "import json; d=json.load(open('.archon-artifacts/workflow-parsed.json')); print(d.get('error',''))")
    if [ -n "$ERROR_CHECK" ]; then
        echo "FATAL: $ERROR_CHECK"
        cp .archon-artifacts/workflow-parsed.json .archon-artifacts/workflow.json
        exit 1
    fi
fi
```

### 4. Validate Required Fields & Extract Node Types

```bash
python3 -c "
import json, sys

with open('.archon-artifacts/workflow-parsed.json') as f:
    data = json.load(f)

workflow_info = {
    'name': data.get('name', 'unnamed-workflow'),
    'description': data.get('description', f'Workflow generated from {data.get(\"name\", \"unknown\")}'),
    'provider': data.get('provider', ''),
    'model': data.get('model', ''),
    'nodes': [],
    'source_path': '$YAML_PATH',
    'node_count': 0
}

# Known node types
known_types = {'prompt', 'command', 'bash', 'script', 'loop', 'approval', 'cancel'}

for node in data.get('nodes', []):
    node_id = node.get('id', '')
    node_type = node.get('type', '')
    
    if node_type not in known_types:
        print(f'WARNING: Unknown node type \"{node_type}\" for node \"{node_id}\" -- will convert to sub-agent prompt', file=sys.stderr)
    
    node_info = {
        'id': node_id,
        'type': node_type if node_type in known_types else 'prompt',
        'original_type': node_type if node_type not in known_types else None,
        'content': node.get('content', '') or node.get('prompt', '') or node.get('message', ''),
        'depends_on': node.get('depends_on', []),
        'when': node.get('when', ''),
        'trigger_rule': node.get('trigger_rule', ''),
        'command': node.get('command', '') if node_type == 'command' else None,
        'script_content': node.get('script', '') if node_type == 'script' else None,
        'loop_config': {
            'over': node.get('over', []),
            'item': node.get('item', ''),
            'parallel': node.get('parallel', False)
        } if node_type == 'loop' else None,
        'approval_config': {
            'message': node.get('message', ''),
            'capture_response': node.get('capture_response', True),
            'response_key': node.get('response_key', '')
        } if node_type == 'approval' else None,
        'cancel_config': {
            'message': node.get('message', ''),
            'on_cancel': node.get('on_cancel', '')
        } if node_type == 'cancel' else None
    }
    workflow_info['nodes'].append(node_info)

workflow_info['node_count'] = len(workflow_info['nodes'])

with open('.archon-artifacts/workflow.json', 'w') as f:
    json.dump(workflow_info, f, indent=2)

print(f'PARSED: {workflow_info[\"name\"]} with {workflow_info[\"node_count\"]} nodes')
"
```

### 5. Handle Errors Gracefully

If the YAML file does not exist, is invalid, or has zero nodes, the error is written to `.archon-artifacts/workflow.json` with an `error` field. Downstream phases check for this field and stop with a clear message.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/workflow.json` exists and is non-empty
- [ ] JSON has `name` and `nodes` fields
- [ ] All node types identified (prompt, command, bash, script, loop, approval, cancel)
- [ ] Dependencies (depends_on) extracted

**Checkpoint passed?** Proceed to Phase 2.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/workflow.json 2>/dev/null && echo "PASS: workflow.json exists" || echo "FAIL: workflow.json missing"
python3 -c "import json; d=json.load(open('.archon-artifacts/workflow.json')); assert 'name' in d; assert 'nodes' in d; assert len(d['nodes'])>0; print('PASS: structure valid')" 2>/dev/null || echo "FAIL: structure invalid"
```
</VALIDATE>

---

## Phase 2: MAP -- Resolve DAG & Map to Skill Phases

<SUBAGENT>
description: archon-skill-builder: MAP -- resolve DAG and map phases
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/workflow.json for the parsed workflow structure.

### 1. Check for Errors from Phase 1

```bash
python3 -c "
import json
with open('.archon-artifacts/workflow.json') as f:
    data = json.load(f)
if 'error' in data:
    print(f'FATAL: Phase 1 error - {data[\"error\"]}: {data.get(\"detail\", \"\")}')
    exit(1)
print('Phase 1 completed successfully')
"
if [ $? -ne 0 ]; then exit 1; fi
```

### 2. Topological Sort of Nodes

```bash
python3 -c "
import json

with open('.archon-artifacts/workflow.json') as f:
    workflow = json.load(f)

nodes = workflow['nodes']
node_map = {n['id']: n for n in nodes}

# Build adjacency and in-degree
adj = {n['id']: [] for n in nodes}
in_degree = {n['id']: 0 for n in nodes}

for n in nodes:
    for dep in n.get('depends_on', []):
        if dep in adj:
            adj[dep].append(n['id'])
            in_degree[n['id']] = in_degree.get(n['id'], 0) + 1

# Kahn's algorithm for topological sort
queue = [nid for nid, deg in in_degree.items() if deg == 0]
sorted_nodes = []
depth_map = {}

while queue:
    nid = queue.pop(0)
    sorted_nodes.append(nid)
    current_depth = depth_map.get(nid, 0)
    for neighbor in adj[nid]:
        in_degree[neighbor] -= 1
        depth_map[neighbor] = max(depth_map.get(neighbor, 0), current_depth + 1)
        if in_degree[neighbor] == 0:
            queue.append(neighbor)

if len(sorted_nodes) != len(nodes):
    print('ERROR: Circular dependency detected in workflow')
    print(f'Sorted {len(sorted_nodes)} of {len(nodes)} nodes')
    missing = [n['id'] for n in nodes if n['id'] not in sorted_nodes]
    print(f'Nodes in cycle: {missing}')
    exit(1)

print(f'Topological sort: {sorted_nodes}')
print(f'Depth map: {depth_map}')
"
```

### 3. Generate Phase Map

```bash
python3 -c "
import json

with open('.archon-artifacts/workflow.json') as f:
    workflow = json.load(f)

nodes = workflow['nodes']
node_map = {n['id']: n for n in nodes}

# Re-run topological sort
adj = {n['id']: [] for n in nodes}
in_degree = {n['id']: 0 for n in nodes}
for n in nodes:
    for dep in n.get('depends_on', []):
        if dep in adj:
            adj[dep].append(n['id'])
            in_degree[n['id']] = in_degree.get(n['id'], 0) + 1

queue = [nid for nid, deg in in_degree.items() if deg == 0]
sorted_nodes = []
depth_map = {}
while queue:
    nid = queue.pop(0)
    sorted_nodes.append(nid)
    current_depth = depth_map.get(nid, 0)
    for neighbor in adj[nid]:
        in_degree[neighbor] -= 1
        depth_map[neighbor] = max(depth_map.get(neighbor, 0), current_depth + 1)
        if in_degree[neighbor] == 0:
            queue.append(neighbor)

# Group nodes by depth (independent nodes at same depth -> same phase)
depth_groups = {}
for nid, depth in depth_map.items():
    depth_groups.setdefault(depth, []).append(nid)

# Build phase map
phase_map = {
    'skill_name': workflow['name'],
    'skill_description': workflow.get('description', ''),
    'approval_gates': [],
    'command_nodes': [],
    'phases': []
}

phase_number = 1
for depth in sorted(depth_groups.keys()):
    group_nodes = depth_groups[depth]
    phase_nodes = []
    has_approval = False
    has_cancel = False
    
    for nid in group_nodes:
        node = node_map[nid]
        phase_nodes.append({
            'id': nid,
            'type': node['type'],
            'original_type': node.get('original_type'),
            'content': node.get('content', ''),
            'depends_on': node.get('depends_on', []),
            'command': node.get('command'),
            'script_content': node.get('script_content'),
            'loop_config': node.get('loop_config'),
            'approval_config': node.get('approval_config'),
            'cancel_config': node.get('cancel_config')
        })
        
        if node['type'] == 'approval':
            has_approval = True
            phase_map['approval_gates'].append({
                'id': nid,
                'approval_config': node.get('approval_config'),
                'phase_number': phase_number
            })
        
        if node['type'] == 'cancel':
            has_cancel = True
        
        if node['type'] == 'command':
            phase_map['command_nodes'].append({
                'id': nid,
                'command': node.get('command', ''),
                'content': node.get('content', '')
            })
    
    # Determine phase type
    if has_approval:
        phase_type = 'gate'
    elif len(group_nodes) > 1 and all(node_map[nid]['type'] in ('bash', 'script') for nid in group_nodes):
        phase_type = 'parallel'
    else:
        phase_type = 'subagent'
    
    # Find title: use first node's content snippet or node id
    first_node = node_map[group_nodes[0]]
    title = first_node.get('content', '')[:60] if first_node.get('content') else ' '.join(group_nodes)
    
    phase_map['phases'].append({
        'phase_number': phase_number,
        'title': title,
        'type': phase_type,
        'nodes': phase_nodes,
        'node_ids': group_nodes,
        'depth': depth,
        'has_approval': has_approval,
        'has_cancel': has_cancel
    })
    
    phase_number += 1

phase_map['total_phases'] = len(phase_map['phases'])
phase_map['total_nodes'] = len(nodes)

with open('.archon-artifacts/phase-map.json', 'w') as f:
    json.dump(phase_map, f, indent=2)

print(f'Generated {phase_map[\"total_phases\"]} phases from {phase_map[\"total_nodes\"]} nodes')
print(f'Approval gates: {len(phase_map[\"approval_gates\"])}')
print(f'Command nodes: {len(phase_map[\"command_nodes\"])}')
for p in phase_map['phases']:
    print(f'  Phase {p[\"phase_number\"]}: type={p[\"type\"]}, nodes={p[\"node_ids\"]}')
"
```
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] `.archon-artifacts/phase-map.json` exists
- [ ] Phases are ordered correctly (no cycles)
- [ ] Approval gates identified and marked for top-level lifting
- [ ] Command nodes identified for sub-agent reference

**Checkpoint passed?** Proceed to Phase 3.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-map.json 2>/dev/null && echo "PASS: phase-map.json exists" || echo "FAIL: phase-map.json missing"
```
</VALIDATE>

---

## Phase 3: GENERATE -- Produce Complete SKILL.md

<SUBAGENT>
description: archon-skill-builder: GENERATE -- produce complete SKILL.md
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/workflow.json and .archon-artifacts/phase-map.json.

### 1. Check for Errors

```bash
python3 -c "
import json
with open('.archon-artifacts/phase-map.json') as f:
    pm = json.load(f)
if not pm.get('phases'):
    print('FATAL: No phases in phase-map.json')
    exit(1)
print(f'Ready to generate: {pm[\"skill_name\"]} - {pm[\"total_phases\"]} phases')
"
if [ $? -ne 0 ]; then exit 1; fi
```

### 2. Generate the Complete SKILL.md

```bash
python3 -c "
import json

with open('.archon-artifacts/workflow.json') as f:
    workflow = json.load(f)

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

skill_name = phase_map['skill_name'].lower().replace(' ', '-').replace('_', '-')
if len(skill_name) > 50:
    skill_name = skill_name[:50]

desc = f'Generated skill from {workflow.get(\"source_path\", \"workflow\")}'
workflow_desc = phase_map.get('skill_description', '')
if workflow_desc:
    desc = workflow_desc

triggers = f'\"{skill_name}\"'
phases_list = [f'Phase {p[\"phase_number\"]}: {p[\"type\"].upper()}' for p in phase_map['phases']]
phases_str = ' -> '.join(phases_list)

lines = []
# Frontmatter
lines.append('---')
lines.append(f'name: {skill_name}')
lines.append('description: |')
lines.append(f'  Use when: User wants to use the {skill_name} workflow.')
lines.append(f'  Triggers: \"{skill_name}\", \"run {skill_name}\", \"execute {skill_name}\".')
lines.append(f'  Capability: {desc}')
lines.append(f'  Generated from Archon workflow YAML.')
lines.append(f'  Phases: {phases_str}.')
lines.append(f'  NOT for: Tasks outside the scope of this generated workflow.')
lines.append('argument-hint: \"<optional-arguments>\"')
lines.append('---')
lines.append('')

# Title
lines.append(f'# {skill_name.title()}: Generated Skill')
lines.append('')
lines.append('**Core principle:** Each phase runs as a **fresh subagent** via the Task tool with zero memory of prior conversation. Phases communicate ONLY through `.archon-artifacts/` on disk.')
lines.append('')

# EXECUTION PROTOCOLS
lines.append('## EXECUTION PROTOCOLS')
lines.append('')
lines.append('These protocols are NOT suggestions. When you see a protocol block, you MUST follow its rule exactly.')
lines.append('')
lines.append('### SUBAGENT PROTOCOL')
lines.append('')
lines.append('When you see `<SUBAGENT>` followed by `<PROMPT>`, you MUST execute them as a Task tool call:')
lines.append('')
lines.append('```')
lines.append('<SUBAGENT>')
lines.append('description: <value>')
lines.append('subagent_type: <value>')
lines.append('</SUBAGENT>')
lines.append('<PROMPT>')
lines.append('<prompt text>')
lines.append('</PROMPT>')
lines.append('```')
lines.append('')
lines.append('**Rule:** Call the Task tool with:')
lines.append('- `description` = the value from `<SUBAGENT>`')
lines.append('- `subagent_type` = the value from `<SUBAGENT>`')
lines.append('- `prompt` = all text between `<PROMPT>` and `</PROMPT>`')
lines.append('')
lines.append('**Do NOT execute the prompt yourself.** Always delegate via Task tool.')
lines.append('')
lines.append('**After the subagent returns:** verify the `### PHASE_N_CHECKPOINT` checklist, then proceed to the next phase.')
lines.append('')
lines.append('### VALIDATE PROTOCOL')
lines.append('')
lines.append('When you see `<VALIDATE>` with a bash code block, execute the commands:')
lines.append('')
lines.append('**<VALIDATE>**')
lines.append('```bash')
lines.append('<commands>')
lines.append('```')
lines.append('**</VALIDATE>**')
lines.append('')
lines.append('**Rule:** Run every command in the bash block. If any fail, fix before proceeding.')
lines.append('')

# Parallel subagent protocol if needed
has_parallel = any(p['type'] == 'parallel' for p in phase_map['phases'])
if has_parallel:
    lines.append('### PARALLEL SUBAGENT PROTOCOL')
    lines.append('')
    lines.append('When a phase contains multiple parallel nodes, you MAY execute them in parallel using separate Task tool calls.')
    lines.append('However, each subagent must produce its own artifact file. Aggregate artifacts after all complete.')
    lines.append('')

lines.append('---')
lines.append('')

# Setup
lines.append('## Setup')
lines.append('')
lines.append('```bash')
lines.append('mkdir -p .archon-artifacts')
lines.append('echo \"\$ARGUMENTS\" > .archon-artifacts/input.txt')
lines.append('```')
lines.append('')
lines.append('### SETUP_CHECKPOINT')
lines.append('- [ ] `.archon-artifacts/` directory created')
lines.append('- [ ] `input.txt` written with arguments')
lines.append('- [ ] Working directory is the project root')
lines.append('')
lines.append('---')
lines.append('')

# Generate a GATE section for each approval gate
for gate in phase_map['approval_gates']:
    gate_config = gate.get('approval_config', {})
    gate_msg = gate_config.get('message', 'User approval required')
    lines.append(f'### GATE: {gate_msg}')
    lines.append('This phase requires user approval before proceeding.')
    lines.append('')
    lines.append('**GATE CHECKPOINT**')
    lines.append('- [ ] User has reviewed and approved the plan')
    lines.append(f'- [ ] Approval captured and saved to .archon-artifacts/approval-{gate[\"id\"]}.txt')
    lines.append('')
    lines.append('---')
    lines.append('')

# Generate phases
for phase in phase_map['phases']:
    pn = phase['phase_number']
    title = phase['title'][:80] if phase['title'] else f'Phase {pn} - {phase[\"type\"].upper()}'
    phase_desc = f'{skill_name}: Phase {pn} - {title}'
    
    lines.append(f'## Phase {pn}: {title}')
    lines.append('')
    lines.append('<SUBAGENT>')
    lines.append(f'description: {phase_desc}')
    lines.append('subagent_type: general')
    lines.append('</SUBAGENT>')
    lines.append('<PROMPT>')
    
    for node in phase['nodes']:
        nid = node['id']
        ntype = node['type']
        content = node.get('content', '')
        
        if ntype == 'prompt':
            lines.append(f'### Task: {nid}')
            lines.append(content if content else f'Execute the task for {nid}.')
            lines.append('')
        
        elif ntype == 'command':
            cmd = node.get('command', '')
            lines.append(f'### Command Task: {nid}')
            lines.append(f'Execute the following command: `{cmd}`')
            if content:
                lines.append(f'')
                lines.append(content)
            lines.append('')
        
        elif ntype == 'bash':
            lines.append(f'### Bash Task: {nid}')
            if content:
                lines.append('```bash')
                lines.append(content)
                lines.append('```')
            lines.append('')
        
        elif ntype == 'script':
            script = node.get('script_content', '')
            lines.append(f'### Script Task: {nid}')
            lines.append('Create and execute a script:')
            if script:
                lines.append('```bash')
                lines.append(script)
                lines.append('```')
            lines.append('')
        
        elif ntype == 'loop':
            loop_config = node.get('loop_config', {})
            over = loop_config.get('over', [])
            item = loop_config.get('item', 'item')
            parallel = loop_config.get('parallel', False)
            lines.append(f'### Loop Task: {nid}')
            lines.append(f'Iterate over each {item} in {json.dumps(over)}.')
            if parallel:
                lines.append('Execute iterations in parallel.')
            else:
                lines.append('Execute iterations sequentially.')
            if content:
                lines.append(f'For each iteration, perform: {content}')
            lines.append('')
        
        elif ntype == 'approval':
            approval_config = node.get('approval_config', {})
            msg = approval_config.get('message', 'Proceed?')
            lines.append(f'### Approval Task: {nid}')
            lines.append(f'**{msg}**')
            lines.append(f'Ask the user for approval and capture their response.')
            lines.append('')
        
        elif ntype == 'cancel':
            cancel_config = node.get('cancel_config', {})
            msg = cancel_config.get('message', 'Cancel?')
            lines.append(f'### Cancel Check: {nid}')
            lines.append(f'If condition is met: {msg}')
            lines.append('On cancel, stop execution and report.')
            lines.append('')
    
    lines.append('Write results to `.archon-artifacts/phase-' + str(pn) + '-output.txt`.')
    lines.append('</PROMPT>')
    lines.append('')
    
    lines.append(f'### PHASE_{pn}_CHECKPOINT')
    lines.append(f'- [ ] `.archon-artifacts/phase-{pn}-output.txt` exists')
    for node in phase['nodes']:
        lines.append(f'- [ ] Task `{node[\"id\"]}` completed')
    lines.append('')
    lines.append('**Checkpoint passed?** Proceed to Phase ' + str(pn + 1) + '.')
    lines.append('**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.')
    lines.append('')
    lines.append('<VALIDATE>')
    lines.append('```bash')
    lines.append(f'test -s .archon-artifacts/phase-{pn}-output.txt && echo \"PASS: phase-{pn}-output.txt exists\" || echo \"FAIL: phase-{pn}-output.txt missing\"')
    lines.append('```')
    lines.append('</VALIDATE>')
    lines.append('')
    lines.append('---')
    lines.append('')

# Report
lines.append('## Report')
lines.append('')
lines.append('1. Read `.archon-artifacts/summary.md` for final report data.')
lines.append('2. Output the report banner with phase list and artifact list.')
lines.append('')
lines.append('```')
lines.append('===============================================================')
lines.append(f'{skill_name.upper()} -- COMPLETE')
lines.append('===============================================================')
lines.append('')
lines.append('-- Phases --')
for phase in phase_map['phases']:
    lines.append(f'  [done] phase-{phase[\"phase_number\"]}')
lines.append('')
lines.append('-- Artifacts --')
lines.append('.archon-artifacts/input.txt')
for phase in phase_map['phases']:
    lines.append(f'.archon-artifacts/phase-{phase[\"phase_number\"]}-output.txt')
lines.append('.archon-artifacts/summary.md')
lines.append('===============================================================')
lines.append('```')
lines.append('')
lines.append('### REPORT_CHECKPOINT')
lines.append('- [ ] All phases completed')
lines.append('- [ ] All artifacts listed')
lines.append('- [ ] Report banner displayed with correct formatting')

with open('.archon-artifacts/generated-skill.md', 'w') as f:
    f.write('\\n'.join(lines))

print(f'Generated {len(lines)} lines for skill: {skill_name}')
print(f'Total phases: {len(phase_map[\"phases\"])}')
print(f'Approval gates: {len(phase_map[\"approval_gates\"])}')
print(f'Command nodes: {len(phase_map[\"command_nodes\"])}')
"
```

### 3. Write Generation Report

```bash
python3 -c "
import json

with open('.archon-artifacts/workflow.json') as f:
    workflow = json.load(f)

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

report = f'''# Generation Report

Source: {workflow.get('source_path', 'unknown')}
Skill Name: {phase_map['skill_name']}
Total Phases: {phase_map['total_phases']}
Total Nodes: {phase_map['total_nodes']}
Approval Gates: {len(phase_map['approval_gates'])}
Command Nodes: {len(phase_map['command_nodes'])}

## Phase Summary
'''

for p in phase_map['phases']:
    node_ids = ', '.join(p['node_ids'])
    report += f\"\"\"- Phase {p['phase_number']} ({p['type']}): {node_ids}
\"\"\"

with open('.archon-artifacts/generation-report.md', 'w') as f:
    f.write(report)

print('Generation report written')
"
```
</PROMPT>

### PHASE_3_CHECKPOINT
- [ ] `.archon-artifacts/generated-skill.md` exists
- [ ] `.archon-artifacts/generation-report.md` exists
- [ ] Generated skill has frontmatter, protocols, phases, checkpoints, validate blocks, report
- [ ] All workflow nodes mapped to skill phases

**Checkpoint passed?** Proceed to Phase 4.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/generated-skill.md 2>/dev/null && echo "PASS: generated-skill.md exists" || echo "FAIL: generated-skill.md missing"
test -s .archon-artifacts/generation-report.md 2>/dev/null && echo "PASS: generation-report.md exists" || echo "FAIL: generation-report.md missing"
```
</VALIDATE>

---

## Phase 4: VALIDATE -- Verify Generated Skill Structure

<SUBAGENT>
description: archon-skill-builder: VALIDATE -- verify generated skill structure
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/generated-skill.md for the generated skill content.
Read .archon-artifacts/phase-map.json for expected phase structure.

### 1. Check Generated File Exists

```bash
if [ ! -f .archon-artifacts/generated-skill.md ]; then
    echo "FATAL: generated-skill.md not found - Phase 3 did not produce output"
    echo '{"error": "no_generated_skill"}' > .archon-artifacts/validation.json
    exit 1
fi
```

### 2. Run Comprehensive Structural Validation

```bash
python3 -c "
import json, re

with open('.archon-artifacts/generated-skill.md') as f:
    content = f.read()

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

results = []
all_pass = True

def check(name, condition, detail=''):
    global all_pass
    status = 'PASS' if condition else 'FAIL'
    if not condition:
        all_pass = False
    results.append({'section': name, 'status': status, 'detail': detail})
    print(f'{status}: {name}')

# 1. Frontmatter
check('Frontmatter delimiter', content.startswith('---'))
check('Frontmatter name field', 'name:' in content[:200])
check('Frontmatter description', 'description:' in content[:200])
check('Frontmatter NOT-for', 'NOT for' in content[:500])
check('Frontmatter argument-hint', 'argument-hint' in content[:500])

# 2. EXECUTION PROTOCOLS
check('EXECUTION PROTOCOLS section', 'EXECUTION PROTOCOLS' in content)
check('SUBAGENT PROTOCOL', 'SUBAGENT PROTOCOL' in content)
check('VALIDATE PROTOCOL', 'VALIDATE PROTOCOL' in content)

# 3. Phase Structure
phase_headings = re.findall(r'^## Phase \d+:', content, re.MULTILINE)
expected_phases = phase_map['total_phases']
check(f'Phase headings count ({len(phase_headings)} of {expected_phases})', len(phase_headings) == expected_phases)

for i in range(1, expected_phases + 1):
    check(f'Phase {i} SUBAGENT block', f'<SUBAGENT>' in content and f'Phase {i}:' in content)
    check(f'Phase {i} CHECKPOINT', f'PHASE_{i}_CHECKPOINT' in content)
    check(f'Phase {i} VALIDATE block', content.count('<VALIDATE>') >= expected_phases)
    check(f'Phase {i} separator', content.count('---') >= expected_phases)

# 4. Report Section
check('Report section', 'Report' in content)
check('COMPLETE banner', 'COMPLETE' in content)
check('REPORT_CHECKPOINT', 'REPORT_CHECKPOINT' in content)
check('Phases listed', '[done]' in content)
check('Artifact list', '.archon-artifacts/' in content)

# 5. Security Checks (NFR-09)
placeholder_patterns = ['TODO', 'FIXME', 'PLACEHOLDER', 'placeholder']
for pat in placeholder_patterns:
    count = content.count(pat)
    if count > 0:
        check(f'No {pat} placeholders', False, f'Found {count} occurrences')

abs_paths = re.findall(r'/home/\w+', content)
check(f'No absolute paths ({len(abs_paths)} found)', len(abs_paths) == 0, f'Absolute paths: {abs_paths}')

# 6. Sequential Numbering
for i in range(1, expected_phases):
    prev = f'Phase {i}:'
    next_phase = f'Phase {i+1}:'
    prev_pos = content.index(prev) if prev in content else -1
    next_pos = content.index(next_phase) if next_phase in content else -1
    if prev_pos > 0 and next_pos > 0:
        check(f'Phase {i} before Phase {i+1}', prev_pos < next_pos)

# Write results
with open('.archon-artifacts/validation.md', 'w') as f:
    f.write('# Validation Report\\n\\n')
    f.write('| Section | Status | Details |\\n')
    f.write('|---------|--------|---------|\\n')
    for r in results:
        f.write(f'| {r[\"section\"]} | {r[\"status\"]} | {r[\"detail\"]} |\\n')
    f.write('\\n')
    if all_pass:
        f.write('## OVERALL VERDICT: PASS\\n')
    else:
        f.write('## OVERALL VERDICT: FAIL\\n')
    f.write(f'\\nTotal: {len(results)} checks\\n')

print(f'\\nOverall: {\"PASS\" if all_pass else \"FAIL\"} - {len(results)} checks')
"
```

### 3. Fix Critical Issues If Validation Fails

If validation fails, identify the specific structural issues and fix them in `.archon-artifacts/generated-skill.md` directly. Then re-run validation. Repeat until all checks pass or until only non-critical warnings remain.

```bash
python3 -c "
import json
with open('.archon-artifacts/validation.md') as f:
    content = f.read()
if 'OVERALL VERDICT: FAIL' in content:
    print('WARNING: Validation failures detected - review validation.md for details')
    # Count failures
    failures = content.count('FAIL')
    print(f'Total failures: {failures}')
else:
    print('All validation checks passed')
"
```
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] `.archon-artifacts/validation.md` exists
- [ ] Frontmatter validated (YAML delimiters, name, description, NOT-for)
- [ ] EXECUTION PROTOCOLS validated (SUBAGENT, VALIDATE, optional PARALLEL)
- [ ] All phases have required components (SUBAGENT, PROMPT, CHECKPOINT, VALIDATE)
- [ ] Report section present with banner
- [ ] No security issues (absolute paths, placeholders, secrets)

**Checkpoint passed?** Proceed to Phase 5.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/validation.md 2>/dev/null && echo "PASS: validation.md exists" || echo "FAIL: validation.md missing"
```
</VALIDATE>

---

## Phase 5: FINALIZE -- Write Skill & Report

<SUBAGENT>
description: archon-skill-builder: FINALIZE -- write skill and report
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/validation.md for validation status.
Read .archon-artifacts/generated-skill.md for the skill content.
Read .archon-artifacts/workflow.json for the skill name.

### 1. Check Validation Status

```bash
echo "=== Validation Status ==="
python3 -c "
with open('.archon-artifacts/validation.md') as f:
    content = f.read()
if 'OVERALL VERDICT: PASS' in content:
    print('Validation: PASS')
else:
    print('Validation: FAIL')
    print('ERROR: Cannot write skill - validation failed')
    exit(1)
"
if [ $? -ne 0 ]; then exit 1; fi
```

### 2. Read Skill Name and Determine Target Path

```bash
SKILL_NAME=$(python3 -c "
import json
with open('.archon-artifacts/workflow.json') as f:
    wf = json.load(f)
name = wf.get('name', 'unnamed-skill').lower().replace(' ', '-').replace('_', '-')
print(name[:50])
")
echo "Skill name: $SKILL_NAME"
```

### 3. Create Target Directory and Write Skill

```bash
TARGET_DIR=".opencode/skills/$SKILL_NAME"
echo "Creating target directory: $TARGET_DIR"
mkdir -p ".opencode/skills/$SKILL_NAME"
cp .archon-artifacts/generated-skill.md "$TARGET_DIR/SKILL.md"
echo "Written: $TARGET_DIR/SKILL.md"
wc -l "$TARGET_DIR/SKILL.md"

# Verify written file
if [ -s "$TARGET_DIR/SKILL.md" ]; then
    echo "PASS: Written file exists and is non-empty"
else
    echo "FAIL: Written file is empty or missing"
    exit 1
fi
```

### 4. Write Summary

```bash
python3 -c "
import json

with open('.archon-artifacts/workflow.json') as f:
    workflow = json.load(f)

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

summary = f'''# Skill Generation Summary

## Information
- Source Workflow: {workflow.get('source_path', 'unknown')}
- Skill Name: {phase_map['skill_name']}
- Skill Path: .opencode/skills/{phase_map['skill_name'].lower().replace(' ', '-').replace('_', '-')[:50]}/SKILL.md
- Validation: PASS

## Metrics
- Total Nodes: {phase_map['total_nodes']}
- Total Phases: {phase_map['total_phases']}
- Approval Gates: {len(phase_map['approval_gates'])}
- Command Nodes: {len(phase_map['command_nodes'])}

## Phases
'''

for p in phase_map['phases']:
    node_ids = ', '.join(p['node_ids'])
    summary += f\"\"\"- Phase {p['phase_number']}: {p['type']} [{node_ids}]
\"\"\"

with open('.archon-artifacts/summary.md', 'w') as f:
    f.write(summary)

print('Summary written to .archon-artifacts/summary.md')
"
```
</PROMPT>

### PHASE_5_CHECKPOINT
- [ ] Validation status from Phase 4 is PASS (do NOT write if failed)
- [ ] Target directory created: `.opencode/skills/{skill-name}/`
- [ ] SKILL.md written to target directory
- [ ] `.archon-artifacts/summary.md` written
- [ ] Written file is non-empty and has correct name

**Checkpoint passed?** Proceed to Report.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/summary.md 2>/dev/null && echo "PASS: summary.md exists" || echo "FAIL: summary.md missing"
```
</VALIDATE>

---

## Report

1. Read `.archon-artifacts/summary.md` for final report data
2. Output the EXACT text below, replacing `{placeholder}` values with actual content:

```
===============================================================
ARCHON SKILL BUILDER -- COMPLETE
===============================================================

Source: {source workflow path}
Skill: {generated skill name}
Path: .opencode/skills/{name}/SKILL.md
Validation: {PASS/FAIL}

-- Phases --
  [done] discover
  [done] map
  [done] generate
  [done] validate
  [done] finalize

-- Artifacts --
.archon-artifacts/workflow.json
.archon-artifacts/phase-map.json
.archon-artifacts/generated-skill.md
.archon-artifacts/generation-report.md
.archon-artifacts/validation.md
.archon-artifacts/summary.md
===============================================================
```

### REPORT_CHECKPOINT
- [ ] `.archon-artifacts/summary.md` read
- [ ] Banner displayed with exact formatting (`===` lines, `-- Phases --`, `-- Artifacts --`)
- [ ] Source, skill name, path, and validation status filled in correctly
- [ ] All 5 phases listed with `[done]` checkmarks
- [ ] All 6 artifact paths listed
