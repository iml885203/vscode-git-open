import * as vscode from 'vscode';
import { BaseCommand } from './baseCommand';
import { GitHelper, GitRemoteInfo } from '../gitHelper';

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
            const remoteInfo = await GitHelper.getRemoteInfo(projectPath);
            const currentBranch = await GitHelper.getCurrentBranch(projectPath);
            const defaultBranch = await GitHelper.getDefaultBranch(projectPath);
            
            const url = this.getCreateMergeRequestUrl(remoteInfo, currentBranch, defaultBranch);
            await vscode.env.openExternal(vscode.Uri.parse(url));
            
            vscode.window.showInformationMessage(`Creating merge request from ${currentBranch} into ${defaultBranch}`);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get the URL for creating a new merge request/pull request
     */
    private getCreateMergeRequestUrl(remoteInfo: GitRemoteInfo, sourceBranch: string, targetBranch: string): string {
        const { provider, baseUrl, owner, repo } = remoteInfo;

        switch (provider) {
            case 'github':
                return `${baseUrl}/${owner}/${repo}/compare/${targetBranch}...${sourceBranch}?expand=1`;
            case 'gitlab':
                return `${baseUrl}/${owner}/${repo}/-/merge_requests/new?merge_request[source_branch]=${sourceBranch}&merge_request[target_branch]=${targetBranch}`;
            case 'bitbucket':
                return `${baseUrl}/${owner}/${repo}/pull-requests/new?source=${sourceBranch}&dest=${targetBranch}`;
            case 'azure':
                return `${baseUrl}/${owner}/${repo}/pullrequestcreate?sourceRef=${sourceBranch}&targetRef=${targetBranch}`;
            default:
                throw new Error(`Unsupported Git provider. Current baseUrl: ${baseUrl}. If you're using a private GitLab instance, please configure it in Settings > git-open.providerDomains.`);
        }
    }
} 