import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper } from '../gitHelper';
import { UrlBuilder } from '../urlBuilder';

export class OpenMergeRequestsCommand extends BaseCommand {
    public static readonly commandId = 'git-open.openMergeRequests';

    /**
     * Register the command with VS Code
     * @param context The extension context
     */
    public static register(context: vscode.ExtensionContext): void {
        const disposable = vscode.commands.registerCommand(
            this.commandId,
            async () => await new OpenMergeRequestsCommand().execute()
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
            const url = UrlBuilder.buildMergeRequestsUrl(remoteInfo);

            await vscode.env.openExternal(vscode.Uri.parse(url));
            this.showSuccess('Opened merge requests page');
        } catch (error) {
            await this.handleError(error);
        }
    }
} 