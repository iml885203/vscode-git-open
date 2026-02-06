# CLAUDE.md

## Project Overview

**Git Open** is a VS Code extension that opens Git remote repository pages (repos, PRs, pipelines) directly from the editor. It supports GitHub, GitLab, Bitbucket, and Azure DevOps, including self-hosted instances via configurable domain mappings.

- **Publisher**: loganguo
- **VS Code requirement**: ^1.96.0
- **License**: MIT

## Quick Reference

```bash
pnpm install          # Install dependencies
pnpm run compile      # Type-check + lint + build
pnpm run lint         # ESLint on src/
pnpm run check-types  # TypeScript type checking (no emit)
pnpm run test         # Run tests (requires compile-tests + compile + lint first)
pnpm run package      # Production build (type-check + lint + minified bundle)
pnpm run watch        # Dev mode: parallel esbuild + tsc watch
```

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm (lock file: `pnpm-lock.yaml`)
- **Bundler**: esbuild (`esbuild.js`) — bundles `src/extension.ts` → `dist/extension.js` (CommonJS)
- **Test framework**: Mocha via `@vscode/test-cli` + `@vscode/test-electron`
- **Linter**: ESLint 9 (flat config in `eslint.config.mjs`)

## Project Structure

```
src/
├── extension.ts              # Entry point: activate() registers all commands
├── gitHelper.ts              # Git CLI operations (remote URL, branch, repo detection)
├── configuration.ts          # VS Code settings access (provider domain mappings)
├── commands/
│   ├── baseCommand.ts        # Abstract base class with error handling + workspace path
│   ├── openRemoteRepoCommand.ts    # Opens repo homepage in browser
│   ├── openMergeRequestsCommand.ts # Opens MR/PR listing page
│   ├── createMergeRequestCommand.ts# Opens MR/PR creation page
│   ├── openPipelinesCommand.ts     # Opens CI/CD pipelines page
│   └── quickPickCommand.ts         # Interactive menu of all commands
└── test/
    ├── extension.test.ts     # Basic extension activation test
    └── suite/
        ├── index.ts          # Mocha test runner setup
        ├── commands.test.ts  # Command registration tests
        └── gitHelper.test.ts # Git helper unit tests
```

**Build outputs**:
- `dist/` — Production bundle (esbuild)
- `out/` — Compiled test files (tsc)

## Architecture

### Command Pattern
Each command extends `BaseCommand` (abstract class) and implements:
- `static register(context)` — Registers with VS Code command system
- `protected execute()` — Command logic (async)
- Inherits `getWorkspacePath()` and `handleError()` from base

### Git Operations
`GitHelper` is a static utility class that shells out to `git` via `child_process.exec`. It handles:
- SSH-to-HTTPS URL conversion (`git@` → `https://`)
- Remote URL parsing to extract owner/repo
- GitLab subgroup path preservation
- Provider detection via configurable domain mappings

### Configuration
Single setting: `git-open.providerDomains` — maps domains to provider types (`github`, `gitlab`, `bitbucket`, `azure`). Managed via `Configuration` class.

## Extension Commands

| Command ID | Keybinding | Description |
|---|---|---|
| `git-open.showQuickPick` | `Alt+G Alt+G` | Quick pick menu |
| `git-open.openRemoteRepo` | `Alt+G Alt+O` | Open remote repo |
| `git-open.openMergeRequests` | `Alt+G Alt+M` | Open MR/PR list |
| `git-open.createMergeRequest` | `Alt+G Alt+R` | Create MR/PR |
| `git-open.openPipelines` | `Alt+G Alt+P` | Open pipelines |

## Code Conventions

- **Semicolons**: Required (ESLint enforced)
- **Equality**: Strict (`===`/`!==`) only (ESLint enforced)
- **Curly braces**: Required for all control flow (ESLint enforced)
- **Import naming**: camelCase or PascalCase (ESLint enforced)
- **Error throwing**: No throw literals — use `Error` or `GitError` class
- **Indentation**: Tabs (per `.vscode/settings.json`)
- **TypeScript**: Strict mode, target ES2022, module Node16

## Testing

Tests use Mocha + Node.js `assert` module and run inside VS Code's test electron environment.

```bash
pnpm run compile-tests   # Compile tests to out/
pnpm run test            # Full pipeline: compile-tests + compile + lint + vscode-test
```

Test config is in `.vscode-test.mjs`: picks up `out/test/**/*.test.js`.

**Note**: Tests require a VS Code instance (electron) — they cannot run in a plain Node.js environment.

## Development Workflow

1. `pnpm install` to set up dependencies
2. `pnpm run watch` for development (parallel esbuild + type checking)
3. Press `F5` in VS Code to launch Extension Development Host for manual testing
4. `pnpm run lint` to check for lint errors
5. `pnpm run check-types` to verify types
6. `pnpm run package` for a production-ready build

## Publishing

```bash
pnpm run vscode:publish   # Runs vsce publish --no-dependencies
```

The `vscode:prepublish` hook automatically runs `pnpm run package` before publishing.

## Key Files to Know

- `package.json` — Extension manifest (commands, keybindings, configuration schema, scripts)
- `esbuild.js` — Build configuration (entry point, externals, minification)
- `eslint.config.mjs` — ESLint flat config with TypeScript rules
- `tsconfig.json` — TypeScript compiler options (strict, ES2022, Node16)
- `.vscode-test.mjs` — Test runner configuration
- `.vscodeignore` — Files excluded from the packaged extension
