# AGENTS.md

## Project
- **JobScraper** — online job aggregator web app (see `work1/prd.md` for full spec)
- Greenfield project: no application code exists yet

## Repository structure
- `/home/user/archontesting` — repo root (Firebase Studio workspace)
- `work1/` — active workspace directory (all project work goes here)
- `work1/prd.md` — product requirements document (single source of truth for scope)
- `work1/.opencode/skills/` — OpenCode skill definitions for assisted workflows
- `.idx/dev.nix` — Firebase Studio environment config (packages, extensions, lifecycle hooks)
- `opencode.json` — OpenCode config; loads `superpowers` plugin

## Tooling
- No build/test/lint tooling installed yet
- No package.json or language-specific config outside `.opencode/`
- No remote git repository configured

## Firebase Studio / Nix environment (`./.idx/dev.nix`)

**Adding system packages:**
- Search for packages at https://search.nixos.org/packages (channel defaults to `stable-24.11` in `.idx/dev.nix`)
- Example: `pkgs.nodejs_22`, `pkgs.python3`, `pkgs.go`
- Add them to the `packages` list prefixed with `pkgs.`
- To switch channel: set `channel = "unstable"` for latest (may break), or `"stable-25.05"` for newer stable

**Adding services** (databases, containers, etc.):
```nix
services.postgres = { enable = true; extensions = ["pgvector"]; };
services.mysql = { enable = true; };
services.redis = { enable = true; };
services.mongodb = { enable = true; };
services.docker = { enable = true; };
services.pubsub = { enable = true; };
services.spanner = { enable = true; };
```
- Postgres listens on TCP by default; Redis/MongoDB listen on Unix socket by default (set `port` to enable TCP)

**Adding IDE extensions:**
- Find extensions at https://open-vsx.org/ using `"publisher.id"` format
- Example: `"angular.ng-template"`, `"dbaeumer.vscode-eslint"`

**Adding `gcloud` components:**
```nix
packages = [
  (pkgs.google-cloud-sdk.withExtraComponents [
    pkgs.google-cloud-sdk.components.cloud-datastore-emulator
  ])
];
```

**Rebuild workflow:**
1. Edit `.idx/dev.nix` → Firebase Studio shows a "Rebuild environment" prompt
2. Click to rebuild — time depends on package count
3. If build fails, Firebase Studio offers a **Recovery environment** (basic Code OSS without config) to fix errors
4. Local `node_modules` binaries work directly (no `npx` needed) when in a dir with `node_modules`

**Environment variables:**
```nix
env = { API_KEY = "secret"; PATH = ["/some/path/bin"]; };
```
- `PATH` must be a list (always extended, never replaced)

**Previews (web app dev server):**
```nix
idx.previews = {
  enable = true;
  previews.web = {
    command = ["npm", "run", "dev", "--", "--port", "$PORT"];
    manager = "web";
    # cwd = "app/client";  # optional subdirectory
  };
};
```

**Lifecycle hooks:**
```nix
idx.workspace.onCreate = { npm-install = "npm install"; };
idx.workspace.onStart = { watch-backend = "npm run watch:backend"; };
```

**Modular config** (split large dev.nix):
```nix
imports = [ ./env-cfg.nix ];
imports = lib.optionals (builtins.pathExists ./dev.local.nix) [ ./dev.local.nix ];
```

**Common web dev packages:**
| Need | Nix package name |
|------|-----------------|
| Node.js 22 | `pkgs.nodejs_22` |
| Python 3 | `pkgs.python3` |
| Go | `pkgs.go` |
| Java / Maven | `pkgs.jdk`, `pkgs.maven` |
| Rust | `pkgs.rustc`, `pkgs.cargo` |
| Docker | via `services.docker.enable = true;` |
| PostgreSQL client | `pkgs.postgresql` (or `services.postgres`) |
