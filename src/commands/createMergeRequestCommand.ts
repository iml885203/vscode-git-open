import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper } from '../gitHelper';
import { UrlBuilder } from '../urlBuilder';

export class CreateMergeRequestCommand extends BaseCommand {
    public static readonly commandId = 'git-open.createMergeRequest';

    /**
     * Register the command with VS Code
     * @param context The extension context
     */
    public static register(context: vscode.ExtensionContext): void {
        const disposable = vscode.commands.registerCommand(
            this.commandId,
            async () => await new CreateMergeRequestCommand().execute()
        );
        context.subscriptions.push(disposable);
    }

    /**
     * Execute the command
     */
    protected async execute(): Promise<void> {
        try {
            const projectPath = await this.getWorkspacePath();

            // Fetch all required information in parallel
            const [remoteInfo, currentBranch, defaultBranch] = await Promise.all([
                GitHelper.getRemoteInfo(projectPath),
                GitHelper.getCurrentBranch(projectPath),
                GitHelper.getDefaultBranch(projectPath)
            ]);

            const url = UrlBuilder.buildCreateMergeRequestUrl(remoteInfo, currentBranch, defaultBranch);
            await vscode.env.openExternal(vscode.Uri.parse(url));

            vscode.window.showInformationMessage(`Creating merge request from ${currentBranch} into ${defaultBranch}`);
        } catch (error) {
            this.handleError(error);
        }
    }
} 