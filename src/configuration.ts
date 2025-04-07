import * as vscode from 'vscode';
import { GitProviderDomainConfig } from './gitHelper';

export class Configuration {
    private static readonly PROVIDER_DOMAINS_CONFIG = 'git-open.providerDomains';

    /**
     * Get the custom provider domain mappings from VSCode settings
     */
    static getProviderDomains(): GitProviderDomainConfig {
        const config = vscode.workspace.getConfiguration();
        return config.get<GitProviderDomainConfig>(this.PROVIDER_DOMAINS_CONFIG) || {};
    }

    /**
     * Update the provider domain mappings in VSCode settings
     * @param domains - The new domain mappings to set
     */
    static async updateProviderDomains(domains: GitProviderDomainConfig): Promise<void> {
        const config = vscode.workspace.getConfiguration();
        await config.update(this.PROVIDER_DOMAINS_CONFIG, domains, vscode.ConfigurationTarget.Global);
    }
} 