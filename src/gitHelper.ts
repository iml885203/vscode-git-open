import { exec } from 'child_process';
import { promisify } from 'util';
import { Configuration } from './configuration';

const execAsync = promisify(exec);

export class GitError extends Error {
    constructor(message: string, public readonly command?: string) {
        super(message);
        this.name = 'GitError';
    }
}

export interface GitRemoteInfo {
    provider: 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'unknown';
    owner: string;
    repo: string;
    baseUrl: string;
}

export interface GitProviderDomainConfig {
    [domain: string]: GitRemoteInfo['provider'];
}

export class GitHelper {
    /**
     * Get the current domain configuration from VSCode settings
     */
    private static getDomainConfig(): GitProviderDomainConfig {
        return Configuration.getProviderDomains();
    }

    /**
     * Check if the given path is a Git repository
     * @param path - The filesystem path to check
     * @throws {GitError} If the path is invalid or inaccessible
     * @returns Promise<boolean> - True if the path is a Git repository
     */
    static async isGitRepository(path: string): Promise<boolean> {
        if (!path) {
            throw new GitError('Path is required');
        }

        try {
            await execAsync('git rev-parse --is-inside-work-tree', { cwd: path });
            return true;
        } catch (error) {
            // Check if the error is because it's not a git repo
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();
                if (errorMessage.includes('not a git repository') || 
                    errorMessage.includes('no such file or directory') ||
                    errorMessage.includes('enoent')) {
                    return false;
                }
            }
            throw new GitError(
                `Failed to check Git repository status: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'git rev-parse'
            );
        }
    }

    /**
     * Get the remote URL of the Git repository
     * @param path - The filesystem path of the Git repository
     * @throws {GitError} If the repository has no remote URL or if the operation fails
     * @returns Promise<string> - The cleaned remote URL
     */
    static async getRemoteUrl(path: string): Promise<string> {
        if (!path) {
            throw new GitError('Path is required');
        }

        try {
            // Verify it's a git repository first
            const isGitRepo = await this.isGitRepository(path);
            if (!isGitRepo) {
                throw new GitError('Not a Git repository');
            }

            // Get the remote URL
            const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', { cwd: path });
            
            if (!remoteUrl.trim()) {
                throw new GitError('No remote URL found');
            }

            // Clean and convert the URL
            let cleanUrl = remoteUrl.trim().replace(/\.git$/, '');
            
            // Convert SSH URL to HTTP URL if necessary
            if (cleanUrl.startsWith('git@')) {
                cleanUrl = cleanUrl
                    .replace(':', '/')
                    .replace('git@', 'https://');
            }
            
            return cleanUrl;
        } catch (error) {
            if (error instanceof GitError) {
                throw error;
            }
            throw new GitError(
                `Failed to get remote repository URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'git config'
            );
        }
    }

    /**
     * Get information about the Git remote repository
     * @param path - The filesystem path of the Git repository
     * @returns Promise<GitRemoteInfo> - Information about the remote repository
     */
    static async getRemoteInfo(path: string): Promise<GitRemoteInfo> {
        const remoteUrl = await this.getRemoteUrl(path);
        const url = new URL(remoteUrl);
        const parts = url.pathname.split('/').filter(Boolean);

        if (parts.length < 2) {
            throw new GitError('Invalid remote URL format');
        }

        // For GitLab with subgroups, we want to preserve the full path structure
        // The last part is always the repo name
        const repo = parts[parts.length - 1];
        // Everything before the repo name is the owner/group path
        const owner = parts.slice(0, parts.length - 1).join('/');

        const info: GitRemoteInfo = {
            provider: 'unknown',
            owner: owner,
            repo: repo,
            baseUrl: `${url.protocol}//${url.host}`
        };

        // Check domain against configured mappings
        const domainConfig = this.getDomainConfig();
        const matchingDomain = Object.keys(domainConfig).find(domain => 
            url.host === domain || url.host.endsWith(`.${domain}`)
        );

        if (matchingDomain) {
            info.provider = domainConfig[matchingDomain];
        }

        return info;
    }

    /**
     * Get the current branch name
     * @param path - The filesystem path of the Git repository
     * @returns Promise<string> - The current branch name
     */
    static async getCurrentBranch(path: string): Promise<string> {
        try {
            const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: path });
            return stdout.trim();
        } catch (error) {
            throw new GitError(
                `Failed to get current branch: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'git rev-parse'
            );
        }
    }

    /**
     * Get the default remote branch name (usually main or master)
     * @param path - The filesystem path of the Git repository
     * @returns Promise<string> - The default branch name
     */
    static async getDefaultBranch(path: string): Promise<string> {
        try {
            // First try to get the default branch from remote show
            const { stdout: remoteInfo } = await execAsync('git remote show origin', { cwd: path });
            const match = remoteInfo.match(/HEAD branch:\s+(\S+)/);
            if (match && match[1]) {
                return match[1];
            }

            // If that fails, try to find main or master in remote branches
            const { stdout: branches } = await execAsync('git branch -r', { cwd: path });
            const branchList = branches.split('\n').map(b => b.trim());
            
            // Look for main or master
            const defaultBranch = branchList.find(b => b === 'origin/main' || b === 'origin/master');
            if (defaultBranch) {
                return defaultBranch.replace('origin/', '');
            }

            // If all else fails, return main as default
            return 'main';
        } catch (error) {
            // If we can't determine the default branch, return main
            return 'main';
        }
    }
} 