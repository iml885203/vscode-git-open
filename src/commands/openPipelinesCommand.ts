import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper } from '../gitHelper';
import { UrlBuilder } from '../urlBuilder';

export class OpenPipelinesCommand extends BaseCommand {
    public static readonly commandId = 'git-open.openPipelines';

    /**
     * Register the command with VS Code
     * @param context The extension context
     */
    public static register(context: vscode.ExtensionContext): void {
        const disposable = vscode.commands.registerCommand(
            this.commandId,
            async () => await new OpenPipelinesCommand().execute()
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
            const url = UrlBuilder.buildPipelinesUrl(remoteInfo);

            await vscode.env.openExternal(vscode.Uri.parse(url));
            vscode.window.showInformationMessage(`Opening pipelines/actions page: ${url}`);
        } catch (error) {
            await this.handleError(error);
        }
    }
} 