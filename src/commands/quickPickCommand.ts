import * as vscode from 'vscode';

interface CommandQuickPickItem extends vscode.QuickPickItem {
    command?: string;
}

export class QuickPickCommand {
    public static readonly commandId = 'git-open.showQuickPick';

    /**
     * Register the command with VS Code
     * @param context The extension context
     */
    public static register(context: vscode.ExtensionContext): void {
        const disposable = vscode.commands.registerCommand(
            this.commandId,
            async () => await new QuickPickCommand().execute()
        );
        context.subscriptions.push(disposable);
    }

    /**
     * Execute the command
     */
    private async execute(): Promise<void> {
        try {
            const items: CommandQuickPickItem[] = [
                {
                    label: '$(repo) Open Repository',
                    description: 'View repository homepage',
                    command: 'git-open.openRemoteRepo'
                },
                {
                    kind: vscode.QuickPickItemKind.Separator,
                    label: 'Pull Requests & Merge Requests'
                },
                {
                    label: '$(git-pull-request) Open Merge Requests',
                    description: 'Browse all open pull requests/merge requests',
                    command: 'git-open.openMergeRequests'
                },
                {
                    label: '$(git-merge) Create Merge Request',
                    description: 'Create new pull request from current branch',
                    command: 'git-open.createMergeRequest'
                },
                {
                    kind: vscode.QuickPickItemKind.Separator,
                    label: 'CI/CD'
                },
                {
                    label: '$(play) Open Pipelines',
                    description: 'View CI/CD pipeline runs and workflows',
                    command: 'git-open.openPipelines'
                }
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Choose a Git action (Tip: You can customize shortcuts in Keyboard Shortcuts settings)',
                matchOnDescription: true
            });

            if (selected?.command) {
                await vscode.commands.executeCommand(selected.command);
            }
        } catch (error) {
            let message = 'An unexpected error occurred';

            if (error instanceof Error) {
                message = error.message;
            }

            vscode.window.showErrorMessage(message);
        }
    }
} 