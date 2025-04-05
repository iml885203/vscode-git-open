import { exec } from 'child_process';
import { promisify } from 'util';

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

export class GitHelper {
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
            if (error instanceof Error && error.message.includes('not a git repository')) {
                return false;
            }
            throw new GitError(`Failed to check Git repository status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'git rev-parse');
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

        const info: GitRemoteInfo = {
            provider: 'unknown',
            owner: parts[0],
            repo: parts[1],
            baseUrl: `${url.protocol}//${url.host}`
        };

        // Determine the provider
        if (url.host === 'github.com') {
            info.provider = 'github';
        } else if (url.host === 'gitlab.com' || url.host.includes('gitlab')) {
            info.provider = 'gitlab';
        } else if (url.host.includes('bitbucket')) {
            info.provider = 'bitbucket';
        } else if (url.host.includes('azure') || url.host.includes('visualstudio')) {
            info.provider = 'azure';
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
            const { stdout } = await execAsync('git remote show origin | grep "HEAD branch" | cut -d: -f2', { cwd: path });
            return stdout.trim();
        } catch (error) {
            // Fallback to main or master
            try {
                const { stdout } = await execAsync('git branch -r | grep -E "origin/(main|master)" | head -1 | sed "s/.* origin\\///"', { cwd: path });
                return stdout.trim() || 'main';
            } catch {
                return 'main'; // Default fallback
            }
        }
    }
} 