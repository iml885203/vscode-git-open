import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper } from '../gitHelper';

export class OpenRemoteRepoCommand extends BaseCommand {
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
    protected async execute(): Promise<void> {
        try {
            const projectPath = await this.getWorkspacePath();
            const remoteUrl = await GitHelper.getRemoteUrl(projectPath);

            await vscode.env.openExternal(vscode.Uri.parse(remoteUrl));
            vscode.window.showInformationMessage(`Opening remote repository: ${remoteUrl}`);
        } catch (error) {
            this.handleError(error);
        }
    }
} 