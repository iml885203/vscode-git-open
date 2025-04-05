import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitError extends Error {
    constructor(message: string, public readonly command?: string) {
        super(message);
        this.name = 'GitError';
    }
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
} 