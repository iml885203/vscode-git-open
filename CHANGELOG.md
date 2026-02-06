# Change Log

## [2026.2.0] - 2026-02-06

### Added
- **Multi-repo workspace support**: Automatically prompts for repository selection when multiple Git repos are in workspace
- **Repo selection cache**: Remembers recently used repositories with 7-day TTL and frequency-based sorting
- **Smart error handling**: Actionable error messages with helpful buttons
  - "Not a Git repository" → [Initialize Git] button
  - "No remote URL" → [Add Remote] button
  - Network errors → [Retry] option
- **Enhanced Quick Pick UI**: Organized sections with separators (Repository, Pull Requests & Merge Requests, CI/CD)
- **Git command caching**: Performance improvements with TTL-based caching
  - Remote URL: 60s TTL
  - Current branch: 30s TTL
  - Default branch: 5min TTL
- **Configuration change listener**: Automatically clears cache when provider domains settings change

### Changed
- **Non-intrusive notifications**: Success messages now use status bar (5-second auto-dismiss) instead of popups
- **Parallel execution**: Git commands in CreateMergeRequest now run in parallel for faster execution
- **URL builder refactoring**: Centralized URL construction logic, removing 88 lines of duplicate code

### Fixed
- Repo selection cache sorting order (now shows most relevant repos first)
- Cache invalidation when provider domains configuration changes
- Mock storage implementation in RepoSelectionCache tests

### Performance
- ~60% faster CreateMergeRequest command via parallel Git operations
- Reduced Git command overhead through intelligent caching
- Improved multi-repo workspace UX with smart selection history

## [2025.5.0] - 2025-05-02

### Added
- Better error handling

## [2025.4.5] - 2024-04-07

### Added
- Added provider configuration support in settings

## [2025.4.4] - 2024-04-07

### Changed
- Use Quick Pick menu to use existing commands

## [2025.4.3] - 2024-04-05

### Changed
- Update github links

## [2025.4.2] - 2024-04-05

### Changed
- Updated extension page style


## [2025.4.1] - 2024-04-05

### Changed
- Updated README.md

## [2025.4.0] - 2024-04-05

### Added
- Open remote repository in browser (Alt+G Alt+O)
- Open merge requests/pull requests page (Alt+G Alt+M)
- Create new merge request/pull request (Alt+G Alt+R)
- Open pipelines/actions page (Alt+G Alt+P)
- Quick access to all commands via command palette (Alt+G Alt+G)
- Support for multiple Git providers:
  - GitHub
  - GitLab
  - Bitbucket
  - Azure DevOps