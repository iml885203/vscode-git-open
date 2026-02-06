import * as assert from 'assert';
import * as vscode from 'vscode';
import { BaseCommand, WorkspaceFolderItem } from '../../commands/baseCommand';

function makeFolder(name: string, fsPath: string, index: number): vscode.WorkspaceFolder {
	return {
		uri: vscode.Uri.file(fsPath),
		name,
		index
	};
}

suite('BaseCommand.resolveWorkspacePath', () => {
	const timeout = 5000;

	test('should throw when no folders are provided', async () => {
		try {
			await BaseCommand.resolveWorkspacePath(
				[],
				async () => true,
				async () => undefined
			);
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'No workspace folder found');
		}
	}).timeout(timeout);

	test('should return the only folder when a single folder exists', async () => {
		const folder = makeFolder('my-project', '/home/user/my-project', 0);

		const result = await BaseCommand.resolveWorkspacePath(
			[folder],
			async () => true,
			async () => undefined
		);

		assert.strictEqual(result, '/home/user/my-project');
	}).timeout(timeout);

	test('should return the only folder even if it is not a git repo (single folder)', async () => {
		const folder = makeFolder('not-git', '/home/user/not-git', 0);

		const result = await BaseCommand.resolveWorkspacePath(
			[folder],
			async () => false,
			async () => undefined
		);

		// Single folder is returned directly without git check
		assert.strictEqual(result, '/home/user/not-git');
	}).timeout(timeout);

	test('should return the only git repo when multiple folders but only one is a git repo', async () => {
		const folders = [
			makeFolder('project-a', '/home/user/project-a', 0),
			makeFolder('project-b', '/home/user/project-b', 1),
		];

		const result = await BaseCommand.resolveWorkspacePath(
			folders,
			async (path) => path === '/home/user/project-b',
			async () => { assert.fail('Should not prompt user'); return undefined; }
		);

		assert.strictEqual(result, '/home/user/project-b');
	}).timeout(timeout);

	test('should throw when multiple folders but none are git repos', async () => {
		const folders = [
			makeFolder('dir-a', '/home/user/dir-a', 0),
			makeFolder('dir-b', '/home/user/dir-b', 1),
		];

		try {
			await BaseCommand.resolveWorkspacePath(
				folders,
				async () => false,
				async () => undefined
			);
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'No Git repository found in workspace folders');
		}
	}).timeout(timeout);

	test('should prompt user when multiple git repos exist and return selected', async () => {
		const folders = [
			makeFolder('repo-a', '/home/user/repo-a', 0),
			makeFolder('repo-b', '/home/user/repo-b', 1),
			makeFolder('repo-c', '/home/user/repo-c', 2),
		];

		let pickerItems: WorkspaceFolderItem[] = [];

		const result = await BaseCommand.resolveWorkspacePath(
			folders,
			async () => true,
			async (items) => {
				pickerItems = items;
				// Simulate user picking the second item
				return items[1];
			}
		);

		assert.strictEqual(result, '/home/user/repo-b');
		// Verify all git repos were shown in the picker
		assert.strictEqual(pickerItems.length, 3);
		assert.strictEqual(pickerItems[0].label, 'repo-a');
		assert.strictEqual(pickerItems[1].label, 'repo-b');
		assert.strictEqual(pickerItems[2].label, 'repo-c');
	}).timeout(timeout);

	test('should only show git repos in picker (not non-git folders)', async () => {
		const folders = [
			makeFolder('repo-a', '/home/user/repo-a', 0),
			makeFolder('plain-dir', '/home/user/plain-dir', 1),
			makeFolder('repo-b', '/home/user/repo-b', 2),
		];

		let pickerItems: WorkspaceFolderItem[] = [];

		const result = await BaseCommand.resolveWorkspacePath(
			folders,
			async (path) => path !== '/home/user/plain-dir',
			async (items) => {
				pickerItems = items;
				return items[0];
			}
		);

		assert.strictEqual(result, '/home/user/repo-a');
		assert.strictEqual(pickerItems.length, 2);
		assert.strictEqual(pickerItems[0].label, 'repo-a');
		assert.strictEqual(pickerItems[1].label, 'repo-b');
	}).timeout(timeout);

	test('should throw when user cancels the picker', async () => {
		const folders = [
			makeFolder('repo-a', '/home/user/repo-a', 0),
			makeFolder('repo-b', '/home/user/repo-b', 1),
		];

		try {
			await BaseCommand.resolveWorkspacePath(
				folders,
				async () => true,
				async () => undefined // User pressed Escape
			);
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'No repository selected');
		}
	}).timeout(timeout);

	test('should include folder path in picker item description', async () => {
		const folders = [
			makeFolder('repo-a', '/home/user/repo-a', 0),
			makeFolder('repo-b', '/home/user/repo-b', 1),
		];

		await BaseCommand.resolveWorkspacePath(
			folders,
			async () => true,
			async (items) => {
				assert.strictEqual(items[0].description, '/home/user/repo-a');
				assert.strictEqual(items[1].description, '/home/user/repo-b');
				return items[0];
			}
		);
	}).timeout(timeout);
});
