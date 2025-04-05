# Git Open - VS Code Extension

Quickly open Git repository pages in your browser. Support for GitHub, GitLab, Bitbucket, and Azure DevOps.

## Features

- **Open Repository**: Quickly open the current Git repository in your browser
- **Merge Requests/Pull Requests**: View and create merge requests/pull requests
- **CI/CD**: Access your pipelines and actions directly
- **Multiple Git Providers**: Support for GitHub, GitLab, Bitbucket, and Azure DevOps
- **Keyboard Shortcuts**: Quick access to all features

## Keyboard Shortcuts

| Command | Shortcut | Description |
|---------|----------|-------------|
| Open Repository | `Alt+G Alt+O` | Open current repository in browser |
| Open Merge Requests | `Alt+G Alt+M` | View merge requests/pull requests |
| Create Merge Request | `Alt+G Alt+R` | Create a new merge request |
| Open Pipelines | `Alt+G Alt+P` | View CI/CD pipelines |
| Quick Access | `Alt+G Alt+G` | Show all Git Open commands |

## Requirements

- Git installed and available in PATH
- Active Git repository with remote configured

## Extension Settings

This extension contributes the following commands:

* `git-open.openRemoteRepo`: Open Remote Repository
* `git-open.openMergeRequests`: Open Merge Requests/Pull Requests
* `git-open.createMergeRequest`: Create Merge Request/Pull Request
* `git-open.openPipelines`: Open Pipelines/Actions

## Known Issues

Please report issues on our [GitHub repository](https://github.com/logan/vscode-git-open/issues).

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### 2025.4.0

Initial release with support for:
- Opening remote repository
- Managing merge requests
- Accessing CI/CD pipelines
- Multiple Git provider support

## License

This extension is licensed under the [MIT License](LICENSE).

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
