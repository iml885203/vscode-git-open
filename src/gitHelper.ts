import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitHelper {
    /**
     * Check if the given path is a Git repository
     */
    static async isGitRepository(path: string): Promise<boolean> {
        try {
            await execAsync('git rev-parse --is-inside-work-tree', { cwd: path });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the remote URL of the Git repository
     */
    static async getRemoteUrl(path: string): Promise<string> {
        try {
            // Get the remote URL
            const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', { cwd: path });
            
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
            throw new Error('Failed to get remote repository URL');
        }
    }
} 