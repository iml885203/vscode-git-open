// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitHelper } from './gitHelper';
import { OpenRemoteRepoCommand } from './commands/openRemoteRepoCommand';
import { OpenMergeRequestsCommand } from './commands/openMergeRequestsCommand';
import { CreateMergeRequestCommand } from './commands/createMergeRequestCommand';
import { OpenPipelinesCommand } from './commands/openPipelinesCommand';
import { QuickPickCommand } from './commands/quickPickCommand';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Git Open extension is now active!');

	// Register commands
	OpenRemoteRepoCommand.register(context);
	OpenMergeRequestsCommand.register(context);
	CreateMergeRequestCommand.register(context);
	OpenPipelinesCommand.register(context);
	QuickPickCommand.register(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
