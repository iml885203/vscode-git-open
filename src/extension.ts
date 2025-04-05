// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitHelper } from './gitHelper';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Git Open extension is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('git-open.openRemoteRepo', async () => {
		try {
			// Get the workspace folder path
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				throw new Error('No workspace folder found');
			}
			
			const projectPath = workspaceFolders[0].uri.fsPath;
			
			// Check if it's a Git repository
			if (!await GitHelper.isGitRepository(projectPath)) {
				throw new Error('The current project is not a Git repository');
			}
			
			// Get the remote URL and open it in browser
			const remoteUrl = await GitHelper.getRemoteUrl(projectPath);
			vscode.env.openExternal(vscode.Uri.parse(remoteUrl));
			
			vscode.window.showInformationMessage(`Opening remote repository: ${remoteUrl}`);
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(error.message);
			} else {
				vscode.window.showErrorMessage('An unexpected error occurred');
			}
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
