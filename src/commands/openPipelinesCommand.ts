import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper, GitRemoteInfo } from '../gitHelper';

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
            
            const url = this.getPipelinesUrl(remoteInfo);
            await vscode.env.openExternal(vscode.Uri.parse(url));
            
            vscode.window.showInformationMessage(`Opening pipelines/actions page: ${url}`);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get the URL for viewing pipelines/actions
     */
    private getPipelinesUrl(remoteInfo: GitRemoteInfo): string {
        const { provider, baseUrl, owner, repo } = remoteInfo;

        switch (provider) {
            case 'github':
                return `${baseUrl}/${owner}/${repo}/actions`;
            case 'gitlab':
                return `${baseUrl}/${owner}/${repo}/-/pipelines`;
            case 'bitbucket':
                return `${baseUrl}/${owner}/${repo}/pipelines`;
            case 'azure':
                return `${baseUrl}/${owner}/${repo}/_build`;
            default:
                throw new Error('Unsupported Git provider');
        }
    }
} 