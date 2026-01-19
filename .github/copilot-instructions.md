# Explorer-with-Commits: AI Agent Instructions

## Project Overview
VSCode extension that enhances the Files Explorer by displaying the latest commit message for each file and directory, providing a GitHub-like experience within VSCode.

## Architecture & Key Components

### Extension Architecture (Recommended Pattern)
- **Manifest**: `package.json` - Extension metadata, activation events (`onView:workbench.explorer.fileView`), contributed commands and decorations
- **Entry Point**: `src/extension.ts` - Exports `activate()` and `deactivate()` lifecycle hooks
- **FileDecorationProvider**: Implements `vscode.FileDecorationProvider` interface to decorate Explorer items
- **Git API**: Use `vscode.extensions.getExtension('vscode.git')?.exports` to access built-in Git extension API
- **Cache Layer**: In-memory Map/WeakMap for commit data, invalidated on workspace file changes
- **Disposables Pattern**: Store all subscriptions in `context.subscriptions` for proper cleanup

### Data Flow
1. Extension activates on Explorer view load (`onView:workbench.explorer.fileView`)
2. Register FileDecorationProvider via `vscode.window.registerFileDecorationProvider()`
3. On decoration request: Check cache → Query Git API → Format commit message → Return FileDecoration
4. Listen to `vscode.workspace.onDidChangeTextDocument` and Git events to invalidate cache

## Critical Development Workflows

### Setup & Testing
```bash
npm install                    # Install dependencies
npm run compile              # Build extension
npm run watch                # Watch for changes (development)
npm test                     # Run tests (when available)
```

### Running & Debugging
- Press F5 to launch Extension Development Host (separate VSCode window)
- Set breakpoints in TypeScript source - they map automatically
- Use Debug Console for `console.log()` output from extension
- Reload extension with `Ctrl+R` (Cmd+R on Mac) in Extension Host window

### Git Integration (Built-in API)
```typescript
// Get Git extension API
const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
const git = gitExtension.getAPI(1);
const repository = git.repositories[0]; // Active repo

// Get commit for file
const log = await repository.log({ maxEntries: 1, path: filePath });
const latestCommit = log[0]; // { hash, message, authorName, authorDate }
```

## Project-Specific Patterns & Conventions

### Performance Optimizations
- **Cache Structure**: `Map<string, { message: string, timestamp: number }>` keyed by file URI
- **Batch Requests**: Collect decoration requests and batch Git queries (avoid N+1 queries)
- **Debouncing**: Use `setTimeout()` with 300ms delay for rapid file change events
- **Lazy Initialization**: Defer Git API access until first decoration request

### VSCode Extension Patterns
- **Activation**: Use `activationEvents: ["onView:workbench.explorer.fileView"]` in package.json
- **Disposables**: Always push to `context.subscriptions` - VSCode handles cleanup on deactivate
- **FileDecoration**: Return `{ badge: "📝", tooltip: "commit message" }` or `{ color: themeColor }`
- **Configuration**: Define in `package.json` → `contributes.configuration`, access via `vscode.workspace.getConfiguration('explorerWithCommits')`

## Integration Points & Dependencies

### VSCode APIs Used
- **FileDecorationProvider**: Decorate files in Explorer with commit metadata
- **SCM API** or **Git Extension API**: Access git repository data
- **File System Watcher**: Detect file/repo changes to invalidate cache
- **StatusBar**: Optional - show commit info for selected file

### External Dependencies (to evaluate)
- `simple-git` - Node.js wrapper for git commands
- VSCode's built-in `git` extension (via `vscode.extensions.getExtension`)
- Standard Node.js `child_process` module

## Dependencies
- **Runtime**: `@types/vscode` (dev), `@types/node` (dev) - No runtime dependencies needed
- **Git API**: Access built-in Git extension API at runtime (no npm package)
- **Testing**: `@vscode/test-electron`, `mocha`, `@types/mocha`

## File Organization

Organize naturally as the codebase grows. Typical structure:
- `src/extension.ts` - Entry point, registers provider
- `src/decorationProvider.ts` - FileDecorationProvider implementation
- `src/gitService.ts` - Git API wrapper with caching
- `package.json` - Manifest with activation events and contributions
- `test/` - Integration tests

## Key Directories & Files (when created)

| Path | Purpose |
|------|---------|
| `src/extension.ts` | Extension entry point, activation logic |
| `src/providers/` | FileDecorationProvider implementations |
| `src/git/` | Git command execution & data fetching |
| `src/cache/` | Caching layer for commit data |
| `package.json` | Dependencies, activation events, commands |

## Testing & Validation

When implementing:
- Test with small repos (5-10 files) and large repos (1000+ files)
- Verify performance doesn't degrade with repo size
- Test with different git states (uncommitted changes, no history, detached HEAD)
- Validate decoration appears correctly with VSCode light/dark themes

## Testing Strategy

### Test Setup (VSCode Extension Pattern)
```bash
npm install --save-dev @vscode/test-electron mocha @types/mocha
```

---

**Status**: Initial architecture guidance. Update as implementation progresses.
