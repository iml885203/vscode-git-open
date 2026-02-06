import * as vscode from 'vscode';

interface RepoSelectionRecord {
    repoPath: string;
    timestamp: number;
    count: number;
}

interface WorkspaceRepoHistory {
    [workspacePath: string]: RepoSelectionRecord[];
}

/**
 * Manages recently selected repositories in multi-repo workspaces
 * Helps users quickly access their most frequently used repos
 */
export class RepoSelectionCache {
    private static readonly STORAGE_KEY = 'git-open.repoSelectionHistory';
    private static readonly MAX_HISTORY_PER_WORKSPACE = 5;
    private static readonly HISTORY_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Record a repository selection
     */
    recordSelection(workspacePath: string, repoPath: string): void {
        const history = this.getHistory();

        if (!history[workspacePath]) {
            history[workspacePath] = [];
        }

        const workspaceHistory = history[workspacePath];
        const existingIndex = workspaceHistory.findIndex(r => r.repoPath === repoPath);

        if (existingIndex >= 0) {
            // Update existing record
            workspaceHistory[existingIndex].timestamp = Date.now();
            workspaceHistory[existingIndex].count++;
        } else {
            // Add new record
            workspaceHistory.push({
                repoPath,
                timestamp: Date.now(),
                count: 1
            });
        }

        // Sort by frequency and recency (count * recency_score)
        workspaceHistory.sort((a, b) => {
            const scoreA = a.count * (1 + (Date.now() - a.timestamp) / RepoSelectionCache.HISTORY_TTL);
            const scoreB = b.count * (1 + (Date.now() - b.timestamp) / RepoSelectionCache.HISTORY_TTL);
            return scoreA - scoreB;
        });

        // Keep only top N
        history[workspacePath] = workspaceHistory.slice(0, RepoSelectionCache.MAX_HISTORY_PER_WORKSPACE);

        this.saveHistory(history);
    }

    /**
     * Get the most recently selected repo for a workspace
     */
    getLastSelected(workspacePath: string): string | undefined {
        const history = this.getHistory();
        const workspaceHistory = history[workspacePath];

        if (!workspaceHistory || workspaceHistory.length === 0) {
            return undefined;
        }

        // Check if the most recent selection is still valid (within TTL)
        const mostRecent = workspaceHistory[0];
        if (Date.now() - mostRecent.timestamp > RepoSelectionCache.HISTORY_TTL) {
            return undefined;
        }

        return mostRecent.repoPath;
    }

    /**
     * Get sorted repo suggestions for a workspace
     * @returns Array of repo paths, sorted by frequency and recency
     */
    getSuggestions(workspacePath: string): string[] {
        const history = this.getHistory();
        const workspaceHistory = history[workspacePath];

        if (!workspaceHistory) {
            return [];
        }

        // Filter out expired entries
        const now = Date.now();
        return workspaceHistory
            .filter(r => now - r.timestamp <= RepoSelectionCache.HISTORY_TTL)
            .map(r => r.repoPath);
    }

    /**
     * Clear selection history for a workspace
     */
    clearWorkspace(workspacePath: string): void {
        const history = this.getHistory();
        delete history[workspacePath];
        this.saveHistory(history);
    }

    /**
     * Clear all selection history
     */
    clearAll(): void {
        this.context.globalState.update(RepoSelectionCache.STORAGE_KEY, {});
    }

    /**
     * Get all history from storage
     */
    private getHistory(): WorkspaceRepoHistory {
        return this.context.globalState.get<WorkspaceRepoHistory>(
            RepoSelectionCache.STORAGE_KEY,
            {}
        );
    }

    /**
     * Save history to storage
     */
    private saveHistory(history: WorkspaceRepoHistory): void {
        this.context.globalState.update(RepoSelectionCache.STORAGE_KEY, history);
    }

    /**
     * Clean up expired entries across all workspaces
     */
    cleanup(): void {
        const history = this.getHistory();
        const now = Date.now();
        let modified = false;

        for (const workspacePath in history) {
            const originalLength = history[workspacePath].length;
            history[workspacePath] = history[workspacePath].filter(
                r => now - r.timestamp <= RepoSelectionCache.HISTORY_TTL
            );

            if (history[workspacePath].length === 0) {
                delete history[workspacePath];
                modified = true;
            } else if (history[workspacePath].length !== originalLength) {
                modified = true;
            }
        }

        if (modified) {
            this.saveHistory(history);
        }
    }
}
