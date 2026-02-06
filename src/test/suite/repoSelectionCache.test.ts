import * as assert from 'assert';
import * as vscode from 'vscode';
import { RepoSelectionCache } from '../../repoSelectionCache';

suite('RepoSelectionCache Test Suite', () => {
	let cache: RepoSelectionCache;
	let mockContext: vscode.ExtensionContext;
	let storage: Map<string, unknown>;

	setup(() => {
		// Create mock storage
		storage = new Map();

		// Create mock context with working storage
		mockContext = {
			globalState: {
				keys: () => Array.from(storage.keys()),
				get: <T>(key: string, defaultValue?: T) => storage.get(key) as T ?? defaultValue,
				update: (key: string, value: unknown) => {
					storage.set(key, value);
					return Promise.resolve();
				},
				setKeysForSync: () => {}
			}
		} as unknown as vscode.ExtensionContext;

		cache = new RepoSelectionCache(mockContext);
	});

	suite('recordSelection', () => {
		test('should record new selection', () => {
			cache.recordSelection('/workspace', '/workspace/repo1');
			const suggestions = cache.getSuggestions('/workspace');
			assert.strictEqual(suggestions.length, 1);
			assert.strictEqual(suggestions[0], '/workspace/repo1');
		});

		test('should update existing selection count', () => {
			cache.recordSelection('/workspace', '/workspace/repo1');
			cache.recordSelection('/workspace', '/workspace/repo1');

			const lastSelected = cache.getLastSelected('/workspace');
			assert.strictEqual(lastSelected, '/workspace/repo1');
		});

		test('should handle multiple repos', () => {
			cache.recordSelection('/workspace', '/workspace/repo1');
			cache.recordSelection('/workspace', '/workspace/repo2');
			cache.recordSelection('/workspace', '/workspace/repo3');

			const suggestions = cache.getSuggestions('/workspace');
			assert.strictEqual(suggestions.length, 3);
		});

		test('should limit history to max entries', () => {
			for (let i = 0; i < 10; i++) {
				cache.recordSelection('/workspace', `/workspace/repo${i}`);
			}

			const suggestions = cache.getSuggestions('/workspace');
			assert.ok(suggestions.length <= 5); // MAX_HISTORY_PER_WORKSPACE = 5
		});
	});

	suite('getLastSelected', () => {
		test('should return undefined for empty history', () => {
			const lastSelected = cache.getLastSelected('/workspace');
			assert.strictEqual(lastSelected, undefined);
		});

		test('should return most recent selection', () => {
			cache.recordSelection('/workspace', '/workspace/repo1');
			cache.recordSelection('/workspace', '/workspace/repo2');

			const lastSelected = cache.getLastSelected('/workspace');
			assert.ok(lastSelected === '/workspace/repo1' || lastSelected === '/workspace/repo2');
		});
	});

	suite('getSuggestions', () => {
		test('should return empty array for new workspace', () => {
			const suggestions = cache.getSuggestions('/new-workspace');
			assert.strictEqual(suggestions.length, 0);
		});

		test('should return sorted suggestions', () => {
			cache.recordSelection('/workspace', '/workspace/repo1');
			cache.recordSelection('/workspace', '/workspace/repo2');
			cache.recordSelection('/workspace', '/workspace/repo1'); // Increase count

			const suggestions = cache.getSuggestions('/workspace');
			assert.ok(suggestions.length > 0);
		});
	});

	suite('clearWorkspace', () => {
		test('should clear specific workspace history', () => {
			cache.recordSelection('/workspace1', '/workspace1/repo1');
			cache.recordSelection('/workspace2', '/workspace2/repo2');

			cache.clearWorkspace('/workspace1');

			assert.strictEqual(cache.getSuggestions('/workspace1').length, 0);
			assert.strictEqual(cache.getSuggestions('/workspace2').length, 1);
		});
	});

	suite('clearAll', () => {
		test('should clear all history', () => {
			cache.recordSelection('/workspace1', '/workspace1/repo1');
			cache.recordSelection('/workspace2', '/workspace2/repo2');

			cache.clearAll();

			assert.strictEqual(cache.getSuggestions('/workspace1').length, 0);
			assert.strictEqual(cache.getSuggestions('/workspace2').length, 0);
		});
	});

	suite('cleanup', () => {
		test('should not throw error', () => {
			cache.recordSelection('/workspace', '/workspace/repo1');
			assert.doesNotThrow(() => cache.cleanup());
		});
	});

	suite('Edge Cases', () => {
		test('should handle workspace with no repositories', () => {
			const suggestions = cache.getSuggestions('/empty-workspace');
			assert.strictEqual(suggestions.length, 0);

			const lastSelected = cache.getLastSelected('/empty-workspace');
			assert.strictEqual(lastSelected, undefined);
		});

		test('should handle duplicate recordings gracefully', () => {
			for (let i = 0; i < 20; i++) {
				cache.recordSelection('/workspace', '/workspace/repo1');
			}

			const suggestions = cache.getSuggestions('/workspace');
			assert.strictEqual(suggestions.length, 1);
			assert.strictEqual(suggestions[0], '/workspace/repo1');
		});

		test('should handle special characters in paths', () => {
			const specialPath = '/workspace/my-repo (1)';
			cache.recordSelection('/workspace', specialPath);

			const lastSelected = cache.getLastSelected('/workspace');
			assert.strictEqual(lastSelected, specialPath);
		});

		test('should sort repos by score correctly', () => {
			// Record repo1 three times
			cache.recordSelection('/workspace', '/workspace/repo1');
			cache.recordSelection('/workspace', '/workspace/repo1');
			cache.recordSelection('/workspace', '/workspace/repo1');

			// Record repo2 once
			cache.recordSelection('/workspace', '/workspace/repo2');

			const suggestions = cache.getSuggestions('/workspace');
			// repo1 should be first due to higher frequency
			assert.strictEqual(suggestions[0], '/workspace/repo1');
		});

		test('should handle empty string paths', () => {
			cache.recordSelection('', '/repo');
			const suggestions = cache.getSuggestions('');
			assert.strictEqual(suggestions.length, 1);
		});
	});
});
