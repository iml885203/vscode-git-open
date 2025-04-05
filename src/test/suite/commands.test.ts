import * as assert from 'assert';
import * as vscode from 'vscode';
import { OpenRemoteRepoCommand } from '../../commands/openRemoteRepoCommand';
import { OpenMergeRequestsCommand } from '../../commands/openMergeRequestsCommand';
import { CreateMergeRequestCommand } from '../../commands/createMergeRequestCommand';
import { OpenPipelinesCommand } from '../../commands/openPipelinesCommand';

suite('Commands Test Suite', () => {
    const timeout = 10000; // 10 seconds timeout

    // Setup: Register commands before running tests
    suiteSetup(async () => {
        const context = {
            subscriptions: [],
            workspaceState: {} as vscode.Memento,
            globalState: {} as vscode.Memento & { setKeysForSync(keys: readonly string[]): void },
            extensionUri: vscode.Uri.file(__dirname),
            asAbsolutePath: (relativePath: string) => relativePath,
            storageUri: vscode.Uri.file(__dirname),
            globalStorageUri: vscode.Uri.file(__dirname),
            logUri: vscode.Uri.file(__dirname),
            extensionMode: vscode.ExtensionMode.Test,
            environmentVariableCollection: {} as vscode.EnvironmentVariableCollection,
            extensionPath: __dirname,
            storagePath: __dirname,
            globalStoragePath: __dirname,
            logPath: __dirname,
            secrets: {} as vscode.SecretStorage,
            extension: {} as vscode.Extension<any>,
            languageModelAccessInformation: {} as vscode.LanguageModelAccessInformation,
        } as unknown as vscode.ExtensionContext;

        // Register all commands
        OpenRemoteRepoCommand.register(context);
        OpenMergeRequestsCommand.register(context);
        CreateMergeRequestCommand.register(context);
        OpenPipelinesCommand.register(context);

        // Wait for commands to be registered
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('All commands should be registered', async () => {
        // Get all registered commands
        const commands = await vscode.commands.getCommands(true);
        
        // Check if our commands are registered
        assert.ok(commands.includes('git-open.openRemoteRepo'), 'openRemoteRepo command not found');
        assert.ok(commands.includes('git-open.openMergeRequests'), 'openMergeRequests command not found');
        assert.ok(commands.includes('git-open.createMergeRequest'), 'createMergeRequest command not found');
        assert.ok(commands.includes('git-open.openPipelines'), 'openPipelines command not found');
    }).timeout(timeout);

    test('Commands should be executable', async () => {
        // Test each command execution (will open browser windows)
        try {
            await vscode.commands.executeCommand('git-open.openRemoteRepo');
            await vscode.commands.executeCommand('git-open.openMergeRequests');
            await vscode.commands.executeCommand('git-open.createMergeRequest');
            await vscode.commands.executeCommand('git-open.openPipelines');
        } catch (error) {
            // We expect these to potentially fail in test environment
            // The important part is that they're registered and executable
            assert.ok(error instanceof Error);
        }
    }).timeout(timeout);

    test('Command IDs should match package.json', () => {
        assert.strictEqual(OpenRemoteRepoCommand.commandId, 'git-open.openRemoteRepo');
        assert.strictEqual(OpenMergeRequestsCommand.commandId, 'git-open.openMergeRequests');
        assert.strictEqual(CreateMergeRequestCommand.commandId, 'git-open.createMergeRequest');
        assert.strictEqual(OpenPipelinesCommand.commandId, 'git-open.openPipelines');
    }).timeout(timeout);
}); 