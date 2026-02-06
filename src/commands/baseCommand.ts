import * as vscode from 'vscode';
import { GitError, GitHelper } from '../gitHelper';
import { UrlBuilder, UnsupportedProviderError } from '../urlBuilder';
import { RepoSelectionCache } from '../repoSelectionCache';

export interface WorkspaceFolderItem {
    label: string;
    description: string;
    folder: vscode.WorkspaceFolder;
}

export abstract class BaseCommand {
    private static repoCache: RepoSelectionCache | null = null;

    /**
     * Set the repo selection cache instance
     */
    public static setRepoCache(cache: RepoSelectionCache): void {
        BaseCommand.repoCache = cache;
    }

    /**
     * Show a non-intrusive success message in the status bar
     */
    protected showSuccess(message: string, timeout: number = 5000): void {
        vscode.window.setStatusBarMessage(`$(check) ${message}`, timeout);
    }

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

        // Get workspace identifier for cache
        const workspaceIdentifier = vscode.workspace.workspaceFile?.fsPath ||
            (workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : '');

        const selectedPath = await BaseCommand.resolveWorkspacePath(
            workspaceFolders,
            (path) => GitHelper.isGitRepository(path),
            async (items) => {
                // Enhance items with recent selection indicator
                if (BaseCommand.repoCache && items.length > 1) {
                    const lastSelected = BaseCommand.repoCache.getLastSelected(workspaceIdentifier);
                    if (lastSelected) {
                        const enhancedItems = items.map(item => ({
                            ...item,
                            label: item.folder.uri.fsPath === lastSelected
                                ? `$(history) ${item.label}` // Add history icon
                                : item.label,
                            description: item.folder.uri.fsPath === lastSelected
                                ? `${item.description} • Recently used`
                                : item.description
                        }));
                        return Promise.resolve(vscode.window.showQuickPick(enhancedItems, {
                            placeHolder: 'Select a Git repository'
                        }));
                    }
                }
                return Promise.resolve(vscode.window.showQuickPick(items, {
                    placeHolder: 'Select a Git repository'
                }));
            }
        );

        // Record the selection
        if (BaseCommand.repoCache && workspaceFolders.length > 1) {
            BaseCommand.repoCache.recordSelection(workspaceIdentifier, selectedPath);
        }

        return selectedPath;
    }

    /**
     * Handle command execution errors
     * @param error The error to handle
     */
    protected async handleError(error: unknown): Promise<void> {
        // Handle unsupported provider errors with custom UI
        if (error instanceof UnsupportedProviderError) {
            await UrlBuilder.showUnsupportedProviderError(error.baseUrl);
            return;
        }

        // Handle Git-specific errors with actionable guidance
        if (error instanceof GitError) {
            await this.handleGitError(error);
            return;
        }

        // Handle generic errors
        if (error instanceof Error) {
            await this.handleGenericError(error);
            return;
        }

        // Fallback for unknown errors
        vscode.window.showErrorMessage('An unexpected error occurred');
    }

    /**
     * Handle Git-specific errors with actionable buttons
     */
    private async handleGitError(error: GitError): Promise<void> {
        const message = error.message.toLowerCase();

        // Not a Git repository
        if (message.includes('not a git repository')) {
            const selection = await vscode.window.showErrorMessage(
                'This folder is not a Git repository',
                'Initialize Git',
                'Learn More'
            );

            if (selection === 'Initialize Git') {
                vscode.commands.executeCommand('git.init');
            } else if (selection === 'Learn More') {
                vscode.env.openExternal(vscode.Uri.parse('https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository'));
            }
            return;
        }

        // No remote URL found
        if (message.includes('no remote') || message.includes('remote url')) {
            const selection = await vscode.window.showErrorMessage(
                'No remote repository configured',
                'Add Remote',
                'Learn More'
            );

            if (selection === 'Add Remote') {
                vscode.commands.executeCommand('git.addRemote');
            } else if (selection === 'Learn More') {
                vscode.env.openExternal(vscode.Uri.parse('https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes'));
            }
            return;
        }

        // Default Git error
        vscode.window.showErrorMessage(`Git error: ${error.message}`);
    }

    /**
     * Handle generic errors
     */
    private async handleGenericError(error: Error): Promise<void> {
        const message = error.message.toLowerCase();

        // Network errors
        if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
            const selection = await vscode.window.showErrorMessage(
                'Network error occurred. Please check your connection.',
                'Retry',
                'Dismiss'
            );

            if (selection === 'Retry') {
                // Note: Retry logic would need to be implemented in calling code
                vscode.window.showInformationMessage('Please try the command again');
            }
            return;
        }

        // No workspace folder
        if (message.includes('no workspace folder')) {
            vscode.window.showErrorMessage('Please open a folder or workspace first');
            return;
        }

        // User cancelled selection
        if (message.includes('no repository selected')) {
            // Silent - user intentionally cancelled
            return;
        }

        // Default error message
        vscode.window.showErrorMessage(error.message);
    }
} 