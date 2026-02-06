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

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

export class GitHelper {
    // Cache for remote URLs (60 seconds TTL)
    private static remoteUrlCache = new Map<string, CacheEntry<string>>();
    // Cache for current branches (30 seconds TTL)
    private static currentBranchCache = new Map<string, CacheEntry<string>>();
    // Cache for default branches (5 minutes TTL)
    private static defaultBranchCache = new Map<string, CacheEntry<string>>();
    // Cache for remote info (60 seconds TTL)
    private static remoteInfoCache = new Map<string, CacheEntry<GitRemoteInfo>>();

    private static readonly REMOTE_URL_TTL = 60 * 1000; // 60 seconds
    private static readonly CURRENT_BRANCH_TTL = 30 * 1000; // 30 seconds
    private static readonly DEFAULT_BRANCH_TTL = 5 * 60 * 1000; // 5 minutes
    private static readonly REMOTE_INFO_TTL = 60 * 1000; // 60 seconds
    /**
     * Get the current domain configuration from VSCode settings
     */
    private static getDomainConfig(): GitProviderDomainConfig {
        return Configuration.getProviderDomains();
    }

    /**
     * Check if a cache entry is still valid
     */
    private static isCacheValid<T>(entry: CacheEntry<T> | undefined, ttl: number): boolean {
        if (!entry) {
            return false;
        }
        return Date.now() - entry.timestamp < ttl;
    }

    /**
     * Clear all caches
     */
    static clearCache(): void {
        this.remoteUrlCache.clear();
        this.currentBranchCache.clear();
        this.defaultBranchCache.clear();
        this.remoteInfoCache.clear();
    }

    /**
     * Clear cache for a specific path
     */
    static clearCacheForPath(path: string): void {
        this.remoteUrlCache.delete(path);
        this.currentBranchCache.delete(path);
        this.defaultBranchCache.delete(path);
        this.remoteInfoCache.delete(path);
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

        // Check cache first
        const cached = this.remoteUrlCache.get(path);
        if (this.isCacheValid(cached, this.REMOTE_URL_TTL)) {
            return cached!.value;
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

            // Cache the result
            this.remoteUrlCache.set(path, {
                value: cleanUrl,
                timestamp: Date.now()
            });

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
        // Check cache first
        const cached = this.remoteInfoCache.get(path);
        if (this.isCacheValid(cached, this.REMOTE_INFO_TTL)) {
            return cached!.value;
        }

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

        // Cache the result
        this.remoteInfoCache.set(path, {
            value: info,
            timestamp: Date.now()
        });

        return info;
    }

    /**
     * Get the current branch name
     * @param path - The filesystem path of the Git repository
     * @returns Promise<string> - The current branch name
     */
    static async getCurrentBranch(path: string): Promise<string> {
        // Check cache first
        const cached = this.currentBranchCache.get(path);
        if (this.isCacheValid(cached, this.CURRENT_BRANCH_TTL)) {
            return cached!.value;
        }

        try {
            const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: path });
            const branch = stdout.trim();

            // Cache the result
            this.currentBranchCache.set(path, {
                value: branch,
                timestamp: Date.now()
            });

            return branch;
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
        // Check cache first
        const cached = this.defaultBranchCache.get(path);
        if (this.isCacheValid(cached, this.DEFAULT_BRANCH_TTL)) {
            return cached!.value;
        }

        try {
            // First try to get the default branch from remote show
            const { stdout: remoteInfo } = await execAsync('git remote show origin', { cwd: path });
            const match = remoteInfo.match(/HEAD branch:\s+(\S+)/);
            if (match && match[1]) {
                const branch = match[1];
                // Cache the result
                this.defaultBranchCache.set(path, {
                    value: branch,
                    timestamp: Date.now()
                });
                return branch;
            }

            // If that fails, try to find main or master in remote branches
            const { stdout: branches } = await execAsync('git branch -r', { cwd: path });
            const branchList = branches.split('\n').map(b => b.trim());

            // Look for main or master
            const defaultBranch = branchList.find(b => b === 'origin/main' || b === 'origin/master');
            if (defaultBranch) {
                const branch = defaultBranch.replace('origin/', '');
                // Cache the result
                this.defaultBranchCache.set(path, {
                    value: branch,
                    timestamp: Date.now()
                });
                return branch;
            }

            // If all else fails, return main as default
            const fallbackBranch = 'main';
            // Cache the fallback result
            this.defaultBranchCache.set(path, {
                value: fallbackBranch,
                timestamp: Date.now()
            });
            return fallbackBranch;
        } catch {
            // If we can't determine the default branch, return main
            const fallbackBranch = 'main';
            // Cache the fallback result
            this.defaultBranchCache.set(path, {
                value: fallbackBranch,
                timestamp: Date.now()
            });
            return fallbackBranch;
        }
    }
} 