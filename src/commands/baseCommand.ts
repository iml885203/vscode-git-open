import * as vscode from 'vscode';
import { GitError } from '../gitHelper';

export abstract class BaseCommand {
    /**
     * Register the command with VS Code
     * @param context The extension context
     */
    public static register(context: vscode.ExtensionContext): void {
        throw new Error('register() must be implemented by subclass');
    }

    /**
     * Execute the command
     */
    protected abstract execute(): Promise<void>;

    /**
     * Get the workspace path
     * @throws {Error} If no workspace folder is found
     */
    protected async getWorkspacePath(): Promise<string> {
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
    protected handleError(error: unknown): void {
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