import * as vscode from 'vscode';

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
            const items = [
                {
                    label: '$(repo) Open Repository',
                    description: 'Open the remote repository in browser',
                    command: 'git-open.openRemoteRepo'
                },
                {
                    label: '$(git-pull-request) Open Merge Requests',
                    description: 'Open merge requests/pull requests page',
                    command: 'git-open.openMergeRequests'
                },
                {
                    label: '$(git-merge) Create Merge Request',
                    description: 'Create a new merge request/pull request',
                    command: 'git-open.createMergeRequest'
                },
                {
                    label: '$(play) Open Pipelines',
                    description: 'Open pipelines/actions page',
                    command: 'git-open.openPipelines'
                }
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select an action to perform'
            });

            if (selected) {
                await vscode.commands.executeCommand(selected.command);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Handle command execution errors
     * @param error The error to handle
     */
    private handleError(error: unknown): void {
        let message = 'An unexpected error occurred';
        
        if (error instanceof Error) {
            message = error.message;
        }

        vscode.window.showErrorMessage(message);
    }
} 