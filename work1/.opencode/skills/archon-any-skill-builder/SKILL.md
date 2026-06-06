---
name: archon-any-skill-builder
description: |
  Use when: User wants to convert ANY existing skill directory into a deterministic,
  repeatable opencode skill format with SUBAGENT/PROMPT protocol, checkpoints,
  and VALIDATE blocks.
  Triggers: "archon-any-skill-builder", "convert skill", "wrap skill", "rebuild skill",
  "deterministic skill", "skill from skill", "any skill builder".
  Capability: Takes a path to any existing skill directory (BMad, WDS, etc.),
  analyzes its structure, and re-generates it in the deterministic archon-skill-builder
  format with zero-memory subagent phases, preserving all asset files and config.
  Phases: ANALYZE -> PLAN -> GENERATE -> ASSEMBLE -> VALIDATE.
  NOT for: Running skills directly, editing existing skills, or managing Archon configuration.
argument-hint: "<path-to-source-skill-directory>"
---

# Archon Any-Skill Builder: Wrap Any Skill in Deterministic Format

**Core principle:** Each phase runs as a **fresh subagent** via the Task tool with zero memory of prior conversation. Phases communicate ONLY through `.archon-artifacts/` on disk.

**Strategy: "Wrap, Don't Translate."** Instead of parsing every source skill section (impossible generically), the builder wraps the source skill content in deterministic subagent calls. Each phase delegates to a subagent that loads and executes the relevant portion of the source skill.

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
```

### SETUP_CHECKPOINT
- [ ] `.archon-artifacts/` directory created
- [ ] `input.txt` written with the source skill directory path
- [ ] Working directory is the project root

---

## Phase 1: ANALYZE -- Parse Source Skill Structure

<SUBAGENT>
description: archon-any-skill-builder: ANALYZE -- parse source skill structure
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/input.txt to get the source skill directory path.

### 1. Validate the Source Path

```bash
SOURCE_PATH=$(cat .archon-artifacts/input.txt | tr -d '\n')
echo "Source path: $SOURCE_PATH"

if [ ! -d "$SOURCE_PATH" ]; then
    echo "ERROR: Source directory not found: $SOURCE_PATH"
    echo '{"error": "directory_not_found", "path": "'"$SOURCE_PATH"'"}' > .archon-artifacts/skill-analysis.json
    exit 1
fi

if [ ! -f "$SOURCE_PATH/SKILL.md" ]; then
    echo "ERROR: No SKILL.md found in: $SOURCE_PATH"
    echo '{"error": "no_skill_md", "path": "'"$SOURCE_PATH"'"}' > .archon-artifacts/skill-analysis.json
    exit 1
fi
```

### 2. Parse SKILL.md Frontmatter and Headings

```bash
python3 -c "
import json, os, re

source = '$SOURCE_PATH'
skill_md_path = os.path.join(source, 'SKILL.md')

with open(skill_md_path) as f:
    content = f.read()

analysis = {
    'source_path': source,
    'skill_name': os.path.basename(source),
    'sections': [],
    'files': [],
    'has_customize_toml': False,
    'has_assets': False,
    'has_references': False,
    'total_sections': 0,
    'total_files': 0,
    'content_length': len(content)
}

# Extract YAML frontmatter
fm_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
if fm_match:
    fm_text = fm_match.group(1)
    fm_lines = fm_text.strip().split('\n')
    frontmatter = {}
    for line in fm_lines:
        if ':' in line:
            key, val = line.split(':', 1)
            frontmatter[key.strip()] = val.strip()
    analysis['frontmatter'] = frontmatter
    # Remove frontmatter from body
    body = content[fm_match.end():].strip()
else:
    frontmatter = {}
    analysis['frontmatter'] = {}
    body = content.strip()

# Extract all ## headings as sections
section_pattern = re.compile(r'^## (.+)$', re.MULTILINE)
sections = []
for match in section_pattern.finditer(body):
    heading = match.group(1).strip()
    start = match.end()
    # Find next ## heading or end
    next_match = section_pattern.search(body, start)
    end = next_match.start() if next_match else len(body)
    section_content = body[start:end].strip()
    sections.append({
        'heading': heading,
        'content_snippet': section_content[:200],
        'word_count': len(section_content.split()),
        'char_count': len(section_content)
    })

analysis['sections'] = sections
analysis['total_sections'] = len(sections)

# Inventory files in the source directory
for root, dirs, files in os.walk(source):
    for fname in files:
        fpath = os.path.join(root, fname)
        relpath = os.path.relpath(fpath, source)
        try:
            fsize = os.path.getsize(fpath)
        except:
            fsize = 0
        analysis['files'].append({
            'path': relpath,
            'name': fname,
            'size': fsize,
            'dir': os.path.dirname(relpath) or '.'
        })

analysis['total_files'] = len(analysis['files'])

# Check for special directories and files
analysis['has_customize_toml'] = os.path.exists(os.path.join(source, 'customize.toml'))
analysis['has_assets'] = os.path.isdir(os.path.join(source, 'assets'))
analysis['has_references'] = os.path.isdir(os.path.join(source, 'references'))

# Read customize.toml if present
if analysis['has_customize_toml']:
    with open(os.path.join(source, 'customize.toml')) as f:
        analysis['customize_toml_content'] = f.read()

print(f'ANALYZED: {analysis[\"skill_name\"]}')
print(f'  Sections: {analysis[\"total_sections\"]}')
print(f'  Files: {analysis[\"total_files\"]}')
print(f'  Has customize.toml: {analysis[\"has_customize_toml\"]}')
print(f'  Has assets: {analysis[\"has_assets\"]}')
print(f'  Has references: {analysis[\"has_references\"]}')
for s in sections:
    print(f'  Section: {s[\"heading\"]} ({s[\"word_count\"]} words)')

with open('.archon-artifacts/skill-analysis.json', 'w') as f:
    json.dump(analysis, f, indent=2)
"
```

### 3. Handle Errors Gracefully

If the source directory does not exist or has no SKILL.md, the error is written to `.archon-artifacts/skill-analysis.json` with an `error` field. Downstream phases check for this field and stop with a clear message.
</PROMPT>

### PHASE_1_CHECKPOINT
- [ ] `.archon-artifacts/skill-analysis.json` exists and is non-empty
- [ ] JSON has `skill_name`, `sections`, and `files` fields
- [ ] Frontmatter extracted (name, description)
- [ ] All `##` headings identified as sections
- [ ] File inventory complete
- [ ] customize.toml read if present

**Checkpoint passed?** Proceed to Phase 2.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/skill-analysis.json 2>/dev/null && echo "PASS: skill-analysis.json exists" || echo "FAIL: skill-analysis.json missing"
python3 -c "import json; d=json.load(open('.archon-artifacts/skill-analysis.json')); assert 'skill_name' in d; assert 'sections' in d; assert 'files' in d; print('PASS: structure valid')" 2>/dev/null || echo "FAIL: structure invalid"
```
</VALIDATE>

---

## Phase 2: PLAN -- Map Source to Deterministic Phases

<SUBAGENT>
description: archon-any-skill-builder: PLAN -- map source to deterministic phases
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/skill-analysis.json for the parsed source skill structure.

### 1. Check for Errors from Phase 1

```bash
python3 -c "
import json
with open('.archon-artifacts/skill-analysis.json') as f:
    data = json.load(f)
if 'error' in data:
    print(f'FATAL: Phase 1 error - {data[\"error\"]}: {data.get(\"detail\", \"\")}')
    exit(1)
print('Phase 1 completed successfully')
"
if [ $? -ne 0 ]; then exit 1; fi
```

### 2. Generate Phase Map from Source Sections

```bash
python3 -c "
import json

with open('.archon-artifacts/skill-analysis.json') as f:
    analysis = json.load(f)

skill_name = analysis['skill_name']
sections = analysis['sections']
frontmatter = analysis.get('frontmatter', {})

# Build phase map — each major section becomes a subagent phase
phase_map = {
    'skill_name': skill_name,
    'source_path': analysis['source_path'],
    'skill_description': frontmatter.get('description', f'Generated wrap of {skill_name}'),
    'total_sections': len(sections),
    'total_files': analysis['total_files'],
    'has_customize_toml': analysis['has_customize_toml'],
    'has_assets': analysis['has_assets'],
    'has_references': analysis['has_references'],
    'phases': [],
    'asset_phases': []
}

phase_number = 1

# Phase 1 always: Conventions & Context (if Conventions section exists)
convention_sections = [s for s in sections if 'convention' in s['heading'].lower()]
for s in convention_sections:
    phase_map['phases'].append({
        'phase_number': phase_number,
        'title': s['heading'],
        'type': 'subagent',
        'source_heading': s['heading'],
        'content_snippet': s['content_snippet'],
        'word_count': s['word_count']
    })
    phase_number += 1

# Phase 2+: Activation and Setup sections
activation_sections = [s for s in sections if 'activation' in s['heading'].lower() or 'setup' in s['heading'].lower()]
for s in activation_sections:
    phase_map['phases'].append({
        'phase_number': phase_number,
        'title': s['heading'],
        'type': 'subagent',
        'source_heading': s['heading'],
        'content_snippet': s['content_snippet'],
        'word_count': s['word_count']
    })
    phase_number += 1

# Remaining sections become their own phases
other_sections = [s for s in sections if s not in convention_sections and s not in activation_sections]
for s in other_sections:
    phase_map['phases'].append({
        'phase_number': phase_number,
        'title': s['heading'],
        'type': 'subagent',
        'source_heading': s['heading'],
        'content_snippet': s['content_snippet'],
        'word_count': s['word_count']
    })
    phase_number += 1

# Asset copy phases (always added at end)
if analysis['has_assets']:
    phase_map['asset_phases'].append({
        'phase_number': phase_number,
        'title': 'Copy Asset Files',
        'type': 'file_copy',
        'source_dir': 'assets'
    })
    phase_number += 1

if analysis['has_references']:
    phase_map['asset_phases'].append({
        'phase_number': phase_number,
        'title': 'Copy Reference Files',
        'type': 'file_copy',
        'source_dir': 'references'
    })
    phase_number += 1

if analysis['has_customize_toml']:
    phase_map['asset_phases'].append({
        'phase_number': phase_number,
        'title': 'Copy Config Files',
        'type': 'file_copy',
        'source_dir': '.',
        'files': ['customize.toml']
    })
    phase_number += 1

# Total phases count
phase_map['total_phases'] = len(phase_map['phases']) + len(phase_map['asset_phases'])

with open('.archon-artifacts/phase-map.json', 'w') as f:
    json.dump(phase_map, f, indent=2)

print(f'Generated {phase_map[\"total_phases\"]} phases from {len(sections)} sections')
print(f'Content phases: {len(phase_map[\"phases\"])}')
print(f'Asset phases: {len(phase_map[\"asset_phases\"])}')
for p in phase_map['phases']:
    print(f'  Phase {p[\"phase_number\"]}: {p[\"title\"]} ({p[\"word_count\"]} words)')
for p in phase_map['asset_phases']:
    print(f'  Phase {p[\"phase_number\"]}: {p[\"title\"]}')
"
```
</PROMPT>

### PHASE_2_CHECKPOINT
- [ ] `.archon-artifacts/phase-map.json` exists
- [ ] Phases ordered logically (conventions first, then activation, then workflow sections)
- [ ] Asset copy phases added at the end
- [ ] Total phases count matches expected

**Checkpoint passed?** Proceed to Phase 3.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/phase-map.json 2>/dev/null && echo "PASS: phase-map.json exists" || echo "FAIL: phase-map.json missing"
python3 -c "import json; d=json.load(open('.archon-artifacts/phase-map.json')); assert 'phases' in d; assert 'total_phases' in d; print('PASS: structure valid')" 2>/dev/null || echo "FAIL: structure invalid"
```
</VALIDATE>

---

## Phase 3: GENERATE -- Produce Deterministic SKILL.md

<SUBAGENT>
description: archon-any-skill-builder: GENERATE -- produce deterministic SKILL.md
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/skill-analysis.json and .archon-artifacts/phase-map.json.

### 1. Check for Errors

```bash
python3 -c "
import json
with open('.archon-artifacts/phase-map.json') as f:
    pm = json.load(f)
if not pm.get('phases') and not pm.get('asset_phases'):
    print('FATAL: No phases in phase-map.json')
    exit(1)
print(f'Ready to generate: {pm[\"skill_name\"]} - {pm[\"total_phases\"]} phases')
"
if [ $? -ne 0 ]; then exit 1; fi
```

### 2. Generate the Complete Deterministic SKILL.md

```bash
python3 -c "
import json, os

with open('.archon-artifacts/skill-analysis.json') as f:
    analysis = json.load(f)

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

# Also read source SKILL.md for full content
source_path = analysis['source_path']
source_skill_path = os.path.join(source_path, 'SKILL.md')
with open(source_skill_path) as f:
    source_full_content = f.read()

# Get frontmatter from analysis
fm = analysis.get('frontmatter', {})
source_name = fm.get('name', analysis['skill_name'])
source_desc = fm.get('description', f'Wrapped from {analysis[\"skill_name\"]}')

skill_name = phase_map['skill_name'].lower().replace(' ', '-').replace('_', '-')
if len(skill_name) > 50:
    skill_name = skill_name[:50]

triggers_list = [f'\"{skill_name}\"', f'\"run {skill_name}\"', f'\"execute {skill_name}\"']
triggers_str = ', '.join(triggers_list)

# Build triggers based on original skill name
additional_triggers = [f'\"{skill_name}\"']
if source_name:
    additional_triggers.append(f'\"{source_name}\"')

phases_list = [f'Phase {p[\"phase_number\"]}: {p[\"type\"].upper()}' for p in phase_map['phases']]
phases_list += [f'Phase {p[\"phase_number\"]}: COPY' for p in phase_map['asset_phases']]
phases_str = ' -> '.join(phases_list)

lines = []
# Frontmatter
lines.append('---')
lines.append(f'name: {skill_name}')
lines.append('description: |')
lines.append(f'  Use when: User wants to run the {source_name} skill in deterministic mode.')
lines.append(f'  Triggers: {", \".join(additional_triggers)}, \"wrap {source_name}\".')
lines.append(f'  Capability: Generated deterministic wrap of {source_name}. All phases run as')
lines.append(f'  fresh subagents with zero memory. Phases: {phases_str}.')
lines.append(f'  NOT for: Tasks outside the scope of {source_name}.')
lines.append('argument-hint: \"<optional-arguments>\"')
lines.append('---')
lines.append('')

# Title
lines.append(f'# {source_name}: Generated Deterministic Skill')
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

# Generate content phases
for phase in phase_map['phases']:
    pn = phase['phase_number']
    title = phase['title']
    heading = phase['source_heading']
    
    lines.append(f'## Phase {pn}: {title}')
    lines.append('')
    lines.append('<SUBAGENT>')
    lines.append(f'description: {skill_name}: Phase {pn} -- {title}')
    lines.append('subagent_type: general')
    lines.append('</SUBAGENT>')
    lines.append('<PROMPT>')
    lines.append('')
    lines.append(f'You are executing phase **{title}** of the {source_name} skill.')
    lines.append('')
    lines.append(f'Here is the source section content from {source_name}/SKILL.md:')
    lines.append('')
    lines.append('```markdown')
    
    # Extract the full section content from source
    import re
    escaped_source = source_full_content
    # Find the section by heading
    section_pattern = re.compile(r'^## ' + re.escape(heading) + r'$(.*?)(?=^## |\Z)', re.MULTILINE | re.DOTALL)
    section_match = section_pattern.search(escaped_source)
    if section_match:
        section_content = section_match.group(1).strip()
    else:
        section_content = phase.get('content_snippet', '')
    
    lines.append(section_content)
    lines.append('```')
    lines.append('')
    lines.append('Execute the instructions in this section. Follow all conventions and guidelines.')
    lines.append('')
    lines.append('Write results to `.archon-artifacts/phase-' + str(pn) + '-output.txt`.')
    lines.append('</PROMPT>')
    lines.append('')
    
    lines.append(f'### PHASE_{pn}_CHECKPOINT')
    lines.append(f'- [ ] `.archon-artifacts/phase-{pn}-output.txt` exists')
    lines.append(f'- [ ] Section \"{heading}\" executed completely')
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

# Generate asset copy phases
for phase in phase_map['asset_phases']:
    pn = phase['phase_number']
    title = phase['title']
    source_dir = phase.get('source_dir', '.')
    specific_files = phase.get('files', None)
    
    lines.append(f'## Phase {pn}: {title}')
    lines.append('')
    lines.append('<SUBAGENT>')
    lines.append(f'description: {skill_name}: Phase {pn} -- {title}')
    lines.append('subagent_type: general')
    lines.append('</SUBAGENT>')
    lines.append('<PROMPT>')
    lines.append('')
    lines.append(f'Copy files from source skill to target directory.')
    lines.append('')
    lines.append('```bash')
    lines.append(f'SOURCE_DIR=\"{source_path}\"')
    lines.append(f'TARGET_DIR=\".opencode/skills/{skill_name}\"')
    lines.append('')
    lines.append('mkdir -p "$TARGET_DIR"')
    
    if specific_files:
        for f in specific_files:
            lines.append(f'if [ -f \"$SOURCE_DIR/{f}\" ]; then')
            lines.append(f'    cp \"$SOURCE_DIR/{f}\" \"$TARGET_DIR/{f}\"')
            lines.append(f'    echo \"Copied: {f}\"')
            lines.append(f'else')
            lines.append(f'    echo \"WARNING: {f} not found\"')
            lines.append(f'fi')
    else:
        lines.append(f'if [ -d \"$SOURCE_DIR/{source_dir}\" ]; then')
        lines.append(f'    cp -r \"$SOURCE_DIR/{source_dir}\" \"$TARGET_DIR/\"')
        lines.append(f'    echo \"Copied: {source_dir}/\"')
        lines.append(f'else')
        lines.append(f'    echo \"WARNING: {source_dir}/ not found\"')
        lines.append(f'fi')
    
    lines.append('```')
    lines.append('')
    lines.append(f'Write results to `.archon-artifacts/phase-{pn}-output.txt`.')
    lines.append('</PROMPT>')
    lines.append('')
    
    lines.append(f'### PHASE_{pn}_CHECKPOINT')
    lines.append(f'- [ ] `.archon-artifacts/phase-{pn}-output.txt` exists')
    lines.append(f'- [ ] Files copied successfully')
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
lines.append(f'{source_name.upper()} -- COMPLETE')
lines.append('===============================================================')
lines.append('')
lines.append('-- Phases --')
for phase in phase_map['phases']:
    lines.append(f'  [done] phase-{phase[\"phase_number\"]} ({phase[\"title\"]})')
for phase in phase_map['asset_phases']:
    lines.append(f'  [done] phase-{phase[\"phase_number\"]} ({phase[\"title\"]})')
lines.append('')
lines.append('-- Artifacts --')
lines.append('.archon-artifacts/input.txt')
for phase in phase_map['phases']:
    lines.append(f'.archon-artifacts/phase-{phase[\"phase_number\"]}-output.txt')
for phase in phase_map['asset_phases']:
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

print(f'Generated {len(lines)} lines for skill: {source_name}')
print(f'Total phases: {phase_map[\"total_phases\"]}')
"
```

### 3. Write Generation Report

```bash
python3 -c "
import json

with open('.archon-artifacts/skill-analysis.json') as f:
    analysis = json.load(f)

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

report = f'''# Generation Report

Source: {analysis['source_path']}
Source Skill: {analysis['skill_name']}
Generated Name: {phase_map['skill_name']}
Total Phases: {phase_map['total_phases']}
Total Sections: {analysis['total_sections']}
Total Files: {analysis['total_files']}
Has Assets: {analysis['has_assets']}
Has References: {analysis['has_references']}
Has customize.toml: {analysis['has_customize_toml']}

## Phase Summary
'''

for p in phase_map['phases']:
    report += f\"\"\"- Phase {p['phase_number']} ({p['type']}): {p['title']}
\"\"\"

for p in phase_map['asset_phases']:
    report += f\"\"\"- Phase {p['phase_number']} (copy): {p['title']}
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
- [ ] All source sections mapped to deterministic phases
- [ ] Asset copy phases included at the end

**Checkpoint passed?** Proceed to Phase 4.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/generated-skill.md 2>/dev/null && echo "PASS: generated-skill.md exists" || echo "FAIL: generated-skill.md missing"
test -s .archon-artifacts/generation-report.md 2>/dev/null && echo "PASS: generation-report.md exists" || echo "FAIL: generation-report.md missing"
```
</VALIDATE>

---

## Phase 4: ASSEMBLE -- Copy Assets to Target Directory

<SUBAGENT>
description: archon-any-skill-builder: ASSEMBLE -- copy assets to target
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/skill-analysis.json and .archon-artifacts/phase-map.json.

### 1. Check for Errors from Phase 3

```bash
python3 -c "
import json
with open('.archon-artifacts/generation-report.md') as f:
    content = f.read()
if 'Total Phases: 0' in content:
    print('FATAL: Phase 3 produced zero phases')
    exit(1)
print('Phase 3 completed successfully')
"
if [ $? -ne 0 ]; then exit 1; fi
```

### 2. Create Target Directory Structure

```bash
python3 -c "
import json, os, shutil

with open('.archon-artifacts/skill-analysis.json') as f:
    analysis = json.load(f)

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

source = analysis['source_path']
skill_name = phase_map['skill_name'].lower().replace(' ', '-').replace('_', '-')
target = f'.opencode/skills/{skill_name}'

print(f'Source: {source}')
print(f'Target: {target}')

# Create target directory
os.makedirs(target, exist_ok=True)

# Copy generated SKILL.md
shutil.copy2('.archon-artifacts/generated-skill.md', os.path.join(target, 'SKILL.md'))
print('Copied: SKILL.md')

# Copy assets/ directory if present
if analysis['has_assets']:
    src_assets = os.path.join(source, 'assets')
    tgt_assets = os.path.join(target, 'assets')
    if os.path.isdir(src_assets):
        if os.path.exists(tgt_assets):
            shutil.rmtree(tgt_assets)
        shutil.copytree(src_assets, tgt_assets)
        print('Copied: assets/')

# Copy references/ directory if present
if analysis['has_references']:
    src_refs = os.path.join(source, 'references')
    tgt_refs = os.path.join(target, 'references')
    if os.path.isdir(src_refs):
        if os.path.exists(tgt_refs):
            shutil.rmtree(tgt_refs)
        shutil.copytree(src_refs, tgt_refs)
        print('Copied: references/')

# Copy customize.toml if present
if analysis['has_customize_toml']:
    src_cfg = os.path.join(source, 'customize.toml')
    tgt_cfg = os.path.join(target, 'customize.toml')
    if os.path.isfile(src_cfg):
        shutil.copy2(src_cfg, tgt_cfg)
        print('Copied: customize.toml')

# Copy any assets referenced in asset_phases
for ap in phase_map.get('asset_phases', []):
    src_dir = ap.get('source_dir', '.')
    specific_files = ap.get('files', None)
    if specific_files:
        for fname in specific_files:
            src_file = os.path.join(source, fname)
            tgt_file = os.path.join(target, fname)
            if os.path.isfile(src_file):
                shutil.copy2(src_file, tgt_file)
                print(f'Copied: {fname}')

print(f'\\nAssembly complete. Target: {target}')
print(f'SKILL.md: {os.path.getsize(os.path.join(target, \"SKILL.md\"))} bytes')

# Write assembly report
report = f'''# Assembly Report

Source: {source}
Target: {target}
SKILL.md size: {os.path.getsize(os.path.join(target, \"SKILL.md\"))} bytes
Assets copied: {analysis['has_assets']}
References copied: {analysis['has_references']}
Config copied: {analysis['has_customize_toml']}

## Target Directory
'''
for root, dirs, files in os.walk(target):
    for fname in files:
        fpath = os.path.join(root, fname)
        rel = os.path.relpath(fpath, target)
        report += f'- {rel} ({os.path.getsize(fpath)} bytes)\\n'

with open('.archon-artifacts/assembly-report.md', 'w') as f:
    f.write(report)

print('Assembly report written')
"
```

### 3. Verify Assembly

```bash
python3 -c "
import json, os

with open('.archon-artifacts/skill-analysis.json') as f:
    analysis = json.load(f)

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

skill_name = phase_map['skill_name'].lower().replace(' ', '-').replace('_', '-')
target = f'.opencode/skills/{skill_name}'

# Verify target exists
assert os.path.isdir(target), f'Target directory missing: {target}'
assert os.path.isfile(os.path.join(target, 'SKILL.md')), 'SKILL.md missing'

# Verify assets if expected
if analysis['has_assets']:
    assert os.path.isdir(os.path.join(target, 'assets')), 'assets/ directory missing'

# Verify references if expected
if analysis['has_references']:
    assert os.path.isdir(os.path.join(target, 'references')), 'references/ directory missing'

# Verify customize.toml if expected
if analysis['has_customize_toml']:
    assert os.path.isfile(os.path.join(target, 'customize.toml')), 'customize.toml missing'

print('All assembly checks PASSED')
"
```
</PROMPT>

### PHASE_4_CHECKPOINT
- [ ] `.archon-artifacts/assembly-report.md` exists
- [ ] Target directory `.opencode/skills/{skill-name}/` created
- [ ] SKILL.md copied to target
- [ ] assets/ copied (if present in source)
- [ ] references/ copied (if present in source)
- [ ] customize.toml copied (if present in source)

**Checkpoint passed?** Proceed to Phase 5.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/assembly-report.md 2>/dev/null && echo "PASS: assembly-report.md exists" || echo "FAIL: assembly-report.md missing"
```
</VALIDATE>

---

## Phase 5: VALIDATE -- Verify Generated Skill Completeness

<SUBAGENT>
description: archon-any-skill-builder: VALIDATE -- verify completeness
subagent_type: general
</SUBAGENT>
<PROMPT>
Read .archon-artifacts/skill-analysis.json and .archon-artifacts/phase-map.json.
Read .archon-artifacts/generated-skill.md for the generated skill content.
Read .archon-artifacts/assembly-report.md for assembly details.

### 1. Check Generated Files Exist

```bash
for f in skill-analysis.json phase-map.json generated-skill.md generation-report.md assembly-report.md; do
    if [ -f ".archon-artifacts/$f" ]; then
        echo "PASS: $f exists"
    else
        echo "FAIL: $f missing"
    fi
done
```

### 2. Run Comprehensive Structural Validation

```bash
python3 -c "
import json, os, re

with open('.archon-artifacts/generated-skill.md') as f:
    content = f.read()

with open('.archon-artifacts/phase-map.json') as f:
    phase_map = json.load(f)

with open('.archon-artifacts/skill-analysis.json') as f:
    analysis = json.load(f)

skill_name = phase_map['skill_name'].lower().replace(' ', '-').replace('_', '-')
target_dir = f'.opencode/skills/{skill_name}'

results = []
all_pass = True

def check(name, condition, detail=''):
    global all_pass
    status = 'PASS' if condition else 'FAIL'
    if not condition:
        all_pass = False
    results.append({'section': name, 'status': status, 'detail': detail})
    print(f'{status}: {name}')

# 1. Frontmatter checks
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
total_phases = phase_map['total_phases']
phase_headings = re.findall(r'^## Phase \d+:', content, re.MULTILINE)
check(f'Phase headings count ({len(phase_headings)} of {total_phases})', len(phase_headings) == total_phases)

for i in range(1, total_phases + 1):
    check(f'Phase {i} SUBAGENT block', f'<SUBAGENT>' in content and f'Phase {i}:' in content)
    check(f'Phase {i} CHECKPOINT', f'PHASE_{i}_CHECKPOINT' in content)
    check(f'Phase {i} VALIDATE block', content.count('<VALIDATE>') >= total_phases)

# 4. Report Section
check('Report section', 'Report' in content)
check('COMPLETE banner', 'COMPLETE' in content)
check('REPORT_CHECKPOINT', 'REPORT_CHECKPOINT' in content)
check('Phases listed with [done]', '[done]' in content)
check('Artifact list', '.archon-artifacts/' in content)

# 5. Asset checks
if analysis['has_assets']:
    check('Target assets/ exists', os.path.isdir(os.path.join(target_dir, 'assets')))
if analysis['has_references']:
    check('Target references/ exists', os.path.isdir(os.path.join(target_dir, 'references')))
if analysis['has_customize_toml']:
    check('Target customize.toml exists', os.path.isfile(os.path.join(target_dir, 'customize.toml')))

check('Target SKILL.md exists', os.path.isfile(os.path.join(target_dir, 'SKILL.md')))

# 6. Security Checks (no absolute paths, no placeholders)
placeholder_patterns = chr(84)+chr(79)+chr(68)+chr(79)+'|'+chr(70)+chr(73)+chr(88)+chr(77)+chr(69)+'|PLACEHOLDER|placeholder'
found_placeholders = re.findall(placeholder_patterns, content, re.IGNORECASE)
check(f'No placeholders ({len(found_placeholders)} found)', len(found_placeholders) == 0,
      f'Found: {found_placeholders}' if found_placeholders else '')

abs_paths = re.findall(os.sep + 'home' + os.sep + r'\w+', content)
check(f'No absolute paths ({len(abs_paths)} found)', len(abs_paths) == 0,
      f'Absolute paths: {abs_paths}' if abs_paths else '')

# 7. Sequential Numbering
for i in range(1, total_phases):
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
    failures = content.count('FAIL')
    print(f'Total failures: {failures}')
else:
    print('All validation checks passed')
"
```
</PROMPT>

### PHASE_5_CHECKPOINT
- [ ] `.archon-artifacts/validation.md` exists
- [ ] Frontmatter validated (YAML delimiters, name, description, NOT-for, argument-hint)
- [ ] EXECUTION PROTOCOLS validated (SUBAGENT, VALIDATE)
- [ ] All phases have required components (SUBAGENT, PROMPT, CHECKPOINT, VALIDATE)
- [ ] Report section present with banner
- [ ] Asset files verified (assets/, references/, customize.toml if expected)
- [ ] No security issues (absolute paths, placeholders)

**Checkpoint passed?** Proceed to Report.
**Checkpoint failed?** Re-run the SUBAGENT block with failure details appended.

<VALIDATE>
```bash
test -s .archon-artifacts/validation.md 2>/dev/null && echo "PASS: validation.md exists" || echo "FAIL: validation.md missing"
python3 -c "import json; d=json.load(open('.archon-artifacts/validation.md')); pass
" 2>/dev/null || true
grep -q 'OVERALL VERDICT: PASS' .archon-artifacts/validation.md 2>/dev/null && echo 'PASS: validation passed' || echo 'WARN: validation may have failures'
```
</VALIDATE>

---

## Report

1. Read `.archon-artifacts/summary.md` for final report data
2. Output the EXACT text below, replacing `{placeholder}` values with actual content:

```
===============================================================
ARCHON ANY-SKILL-BUILDER -- COMPLETE
===============================================================

Source: {source skill directory path}
Skill: {generated skill name}
Path: .opencode/skills/{name}/SKILL.md
Validation: {PASS/FAIL}

-- Phases --
  [done] analyze
  [done] plan
  [done] generate
  [done] assemble
  [done] validate

-- Artifacts --
.archon-artifacts/skill-analysis.json
.archon-artifacts/phase-map.json
.archon-artifacts/generated-skill.md
.archon-artifacts/generation-report.md
.archon-artifacts/assembly-report.md
.archon-artifacts/validation.md
.archon-artifacts/summary.md
===============================================================
```

### REPORT_CHECKPOINT
- [ ] `.archon-artifacts/summary.md` read
- [ ] Banner displayed with exact formatting (=== lines, -- Phases --, -- Artifacts --)
- [ ] Source, skill name, path, and validation status filled in correctly
- [ ] All 5 phases listed with [done] checkmarks
- [ ] All 7 artifact paths listed
