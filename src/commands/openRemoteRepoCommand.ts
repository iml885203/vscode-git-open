import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper } from '../gitHelper';
import { UrlBuilder } from '../urlBuilder';

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
            const remoteInfo = await GitHelper.getRemoteInfo(projectPath);
            const url = UrlBuilder.buildRepoUrl(remoteInfo);

            await vscode.env.openExternal(vscode.Uri.parse(url));
            this.showSuccess('Opened remote repository');
        } catch (error) {
            await this.handleError(error);
        }
    }
} 