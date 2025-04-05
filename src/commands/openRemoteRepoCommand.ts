import * as vscode from 'vscode';
import { GitHelper, GitError } from '../gitHelper';

export class OpenRemoteRepoCommand {
    public static readonly commandId = 'git-open.openRemoteRepo';

    /**
     * Register the command with VS Code
     * @param context The extension context
     */
    public static register(context: vscode.ExtensionContext): void {
        const disposable = vscode.commands.registerCommand(
            this.commandId,
            async () => await new OpenRemoteRepoCommand().execute()
        );
        context.subscriptions.push(disposable);
    }

    /**
     * Execute the command
     */
    private async execute(): Promise<void> {
        try {
            const projectPath = await this.getWorkspacePath();
            const remoteUrl = await GitHelper.getRemoteUrl(projectPath);
            
            await vscode.env.openExternal(vscode.Uri.parse(remoteUrl));
            vscode.window.showInformationMessage(`Opening remote repository: ${remoteUrl}`);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get the workspace path
     * @throws {Error} If no workspace folder is found
     */
    private async getWorkspacePath(): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Handle command execution errors
     * @param error The error to handle
     */
    private handleError(error: unknown): void {
        let message = 'An unexpected error occurred';
        
        if (error instanceof GitError) {
            message = `Git error: ${error.message}`;
            if (error.command) {
                message += ` (${error.command})`;
            }
        } else if (error instanceof Error) {
            message = error.message;
        }

        vscode.window.showErrorMessage(message);
    }
} 