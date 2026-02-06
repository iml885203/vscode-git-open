import * as assert from 'assert';
import * as vscode from 'vscode';
import { Configuration } from '../../configuration';

suite('Configuration Test Suite', () => {
	teardown(async () => {
		// Clean up: reset configuration after each test
		await Configuration.updateProviderDomains({});
	});

	suite('getProviderDomains', () => {
		test('should return default mappings when no custom configuration is set', () => {
			const domains = Configuration.getProviderDomains();
			assert.strictEqual(typeof domains, 'object');
			// Should have default mappings
			assert.strictEqual(domains['github.com'], 'github');
			assert.strictEqual(domains['gitlab.com'], 'gitlab');
			assert.strictEqual(domains['bitbucket.org'], 'bitbucket');
		});

		test('should return custom domain mappings when configured', async () => {
			// Set custom configuration
			const customDomains = {
				'git.example.com': 'gitlab' as const,
				'github.enterprise.com': 'github' as const
			};
			await Configuration.updateProviderDomains(customDomains);

			// Wait a bit for configuration to be updated
			await new Promise(resolve => setTimeout(resolve, 100));

			const domains = Configuration.getProviderDomains();
			assert.strictEqual(domains['git.example.com'], 'gitlab');
			assert.strictEqual(domains['github.enterprise.com'], 'github');
		});

		test('should return defaults when configuration is reset', async () => {
			// Reset to defaults
			const config = vscode.workspace.getConfiguration();
			await config.update('git-open.providerDomains', undefined, vscode.ConfigurationTarget.Global);
			await new Promise(resolve => setTimeout(resolve, 100));

			const domains = Configuration.getProviderDomains();
			// Should have default mappings
			assert.strictEqual(domains['github.com'], 'github');
			assert.strictEqual(domains['gitlab.com'], 'gitlab');
		});
	});

	suite('updateProviderDomains', () => {
		test('should update configuration successfully', async () => {
			const newDomains = {
				'gitlab.company.com': 'gitlab' as const
			};

			await Configuration.updateProviderDomains(newDomains);
			await new Promise(resolve => setTimeout(resolve, 100));

			const domains = Configuration.getProviderDomains();
			assert.strictEqual(domains['gitlab.company.com'], 'gitlab');
		});

		test('should overwrite existing configuration', async () => {
			// Set initial configuration
			await Configuration.updateProviderDomains({
				'old.example.com': 'github' as const
			});
			await new Promise(resolve => setTimeout(resolve, 100));

			// Update with new configuration
			await Configuration.updateProviderDomains({
				'new.example.com': 'gitlab' as const
			});
			await new Promise(resolve => setTimeout(resolve, 100));

			const domains = Configuration.getProviderDomains();
			assert.strictEqual(domains['new.example.com'], 'gitlab');
			assert.strictEqual(domains['old.example.com'], undefined);
		});

		test('should handle multiple domains', async () => {
			const multipleDomains = {
				'gitlab.example.com': 'gitlab' as const,
				'github.example.com': 'github' as const,
				'bitbucket.example.com': 'bitbucket' as const,
				'azure.example.com': 'azure' as const
			};

			await Configuration.updateProviderDomains(multipleDomains);
			await new Promise(resolve => setTimeout(resolve, 100));

			const domains = Configuration.getProviderDomains();
			// Check that all custom domains are present
			assert.strictEqual(domains['gitlab.example.com'], 'gitlab');
			assert.strictEqual(domains['github.example.com'], 'github');
			assert.strictEqual(domains['bitbucket.example.com'], 'bitbucket');
			assert.strictEqual(domains['azure.example.com'], 'azure');
		});
	});
});
