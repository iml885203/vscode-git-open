import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper, GitRemoteInfo } from '../gitHelper';

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
            
            const url = this.getMergeRequestsUrl(remoteInfo);
            await vscode.env.openExternal(vscode.Uri.parse(url));
            
            vscode.window.showInformationMessage(`Opening merge requests page: ${url}`);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get the URL for viewing merge requests/pull requests
     */
    private getMergeRequestsUrl(remoteInfo: GitRemoteInfo): string {
        const { provider, baseUrl, owner, repo } = remoteInfo;

        switch (provider) {
            case 'github':
                return `${baseUrl}/${owner}/${repo}/pulls`;
            case 'gitlab':
                return `${baseUrl}/${owner}/${repo}/-/merge_requests`;
            case 'bitbucket':
                return `${baseUrl}/${owner}/${repo}/pull-requests`;
            case 'azure':
                return `${baseUrl}/${owner}/${repo}/pullrequests`;
            default:
                throw new Error(`Unsupported Git provider. Current baseUrl: ${baseUrl}. If you're using a private GitLab instance, please configure it in Settings > git-open.providerDomains.`);
        }
    }
} 