// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { OpenRemoteRepoCommand } from './commands/openRemoteRepoCommand';
import { OpenMergeRequestsCommand } from './commands/openMergeRequestsCommand';
import { CreateMergeRequestCommand } from './commands/createMergeRequestCommand';
import { OpenPipelinesCommand } from './commands/openPipelinesCommand';
import { QuickPickCommand } from './commands/quickPickCommand';
import { RepoSelectionCache } from './repoSelectionCache';
import { BaseCommand } from './commands/baseCommand';
import { GitHelper } from './gitHelper';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Git Open extension is now active!');

	// Initialize repo selection cache
	const repoCache = new RepoSelectionCache(context);
	BaseCommand.setRepoCache(repoCache);

	// Clean up expired cache entries on activation
	repoCache.cleanup();

	// Register commands
	OpenRemoteRepoCommand.register(context);
	OpenMergeRequestsCommand.register(context);
	CreateMergeRequestCommand.register(context);
	OpenPipelinesCommand.register(context);
	QuickPickCommand.register(context);

	// Register configuration change listener
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('git-open.providerDomains')) {
				// Clear Git cache when provider domains change
				// This ensures provider detection uses the new configuration
				GitHelper.clearCache();
				console.log('Git Open: Provider domains updated, cache cleared');
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
