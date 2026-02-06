import * as vscode from 'vscode';
import { GitError, GitHelper } from '../gitHelper';
import { UrlBuilder } from '../urlBuilder';

export interface WorkspaceFolderItem {
    label: string;
    description: string;
    folder: vscode.WorkspaceFolder;
}

export abstract class BaseCommand {
    /**
     * Register the command with VS Code
     * @param context The extension context
     */
    public static register(_context: vscode.ExtensionContext): void {
        throw new Error('register() must be implemented by subclass');
    }

    /**
     * Execute the command
     */
    protected abstract execute(): Promise<void>;

    /**
     * Resolve the workspace path from a list of workspace folders.
     * If multiple git repos exist, prompts the user to select one.
     */
    static async resolveWorkspacePath(
        folders: readonly vscode.WorkspaceFolder[],
        isGitRepo: (path: string) => Promise<boolean>,
        pickFolder: (items: WorkspaceFolderItem[]) => Promise<WorkspaceFolderItem | undefined>
    ): Promise<string> {
        if (folders.length === 0) {
            throw new Error('No workspace folder found');
        }

        if (folders.length === 1) {
            return folders[0].uri.fsPath;
        }

        // Multiple workspace folders — filter to git repos and let user pick
        const gitFolders: vscode.WorkspaceFolder[] = [];
        for (const folder of folders) {
            if (await isGitRepo(folder.uri.fsPath)) {
                gitFolders.push(folder);
            }
        }

        if (gitFolders.length === 0) {
            throw new Error('No Git repository found in workspace folders');
        }

        if (gitFolders.length === 1) {
            return gitFolders[0].uri.fsPath;
        }

        const items = gitFolders.map(folder => ({
            label: folder.name,
            description: folder.uri.fsPath,
            folder
        }));

        const selected = await pickFolder(items);

        if (!selected) {
            throw new Error('No repository selected');
        }

        return selected.folder.uri.fsPath;
    }

    /**
     * Get the workspace path, prompting the user to select one if multiple git repos exist
     * @throws {Error} If no workspace folder is found or user cancels selection
     */
    protected async getWorkspacePath(): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        return BaseCommand.resolveWorkspacePath(
            workspaceFolders,
            (path) => GitHelper.isGitRepository(path),
            (items) => Promise.resolve(vscode.window.showQuickPick(items, { placeHolder: 'Select a Git repository' }))
        );
    }

    /**
     * Handle command execution errors
     * @param error The error to handle
     */
    protected async handleError(error: unknown): Promise<void> {
        let message = 'An unexpected error occurred';

        if (error instanceof GitError) {
            message = `Git error: ${error.message}`;
            if (error.command) {
                message += ` (${error.command})`;
            }
            vscode.window.showErrorMessage(message);
        } else if (error instanceof Error) {
            message = error.message;

            // Check if this is an unsupported provider error
            if (message.includes('Unsupported Git provider')) {
                // Extract baseUrl from error message
                const match = message.match(/baseUrl:\s+([^\s.]+)/);
                if (match && match[1]) {
                    await UrlBuilder.showUnsupportedProviderError(match[1]);
                    return;
                }
            }

            vscode.window.showErrorMessage(message);
        } else {
            vscode.window.showErrorMessage(message);
        }
    }
} 