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

        // Handle other errors
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