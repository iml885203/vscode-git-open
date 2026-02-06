import * as vscode from 'vscode';
import { GitRemoteInfo } from './gitHelper';

/**
 * Centralized URL builder for all Git providers
 * Supports GitHub, GitLab, Bitbucket, and Azure DevOps
 */
export class UrlBuilder {
    /**
     * Build the repository home page URL
     */
    static buildRepoUrl(remoteInfo: GitRemoteInfo): string {
        const { baseUrl, owner, repo } = remoteInfo;
        return `${baseUrl}/${owner}/${repo}`;
    }

    /**
     * Build the URL for viewing merge requests/pull requests
     */
    static buildMergeRequestsUrl(remoteInfo: GitRemoteInfo): string {
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
                throw this.createUnsupportedProviderError(baseUrl);
        }
    }

    /**
     * Build the URL for creating a new merge request/pull request
     */
    static buildCreateMergeRequestUrl(
        remoteInfo: GitRemoteInfo,
        sourceBranch: string,
        targetBranch: string
    ): string {
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
                throw this.createUnsupportedProviderError(baseUrl);
        }
    }

    /**
     * Build the URL for viewing pipelines/CI/CD actions
     */
    static buildPipelinesUrl(remoteInfo: GitRemoteInfo): string {
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
                throw this.createUnsupportedProviderError(baseUrl);
        }
    }

    /**
     * Create a standardized error for unsupported providers with actionable guidance
     */
    private static createUnsupportedProviderError(baseUrl: string): Error {
        return new Error(
            `Unsupported Git provider. Current baseUrl: ${baseUrl}. ` +
            `If you're using a private GitLab instance, please configure it in Settings > git-open.providerDomains.`
        );
    }

    /**
     * Show error message with actionable buttons
     */
    static async showUnsupportedProviderError(baseUrl: string): Promise<void> {
        // Extract only the host (domain) from baseUrl for cleaner display
        const url = new URL(baseUrl);
        const domain = url.host;

        // Detect likely provider type based on domain patterns
        let suggestion = '';
        if (domain.includes('gitlab')) {
            suggestion = ' (Looks like GitLab)';
        } else if (domain.includes('github')) {
            suggestion = ' (Looks like GitHub)';
        } else if (domain.includes('bitbucket')) {
            suggestion = ' (Looks like Bitbucket)';
        } else if (domain.includes('azure')) {
            suggestion = ' (Looks like Azure DevOps)';
        }

        const selection = await vscode.window.showErrorMessage(
            `Unknown Git provider: ${domain}${suggestion}`,
            'Configure Provider',
            'Learn More'
        );

        if (selection === 'Configure Provider') {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'git-open.providerDomains'
            );
        } else if (selection === 'Learn More') {
            vscode.env.openExternal(
                vscode.Uri.parse('https://github.com/iml885203/vscode-git-open#extension-settings')
            );
        }
    }
}
