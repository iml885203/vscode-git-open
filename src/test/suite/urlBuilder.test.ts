import * as assert from 'assert';
import { UrlBuilder } from '../../urlBuilder';
import { GitRemoteInfo } from '../../gitHelper';

suite('UrlBuilder Test Suite', () => {
    suite('buildRepoUrl', () => {
        test('should build GitHub repo URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'github',
                baseUrl: 'https://github.com',
                owner: 'iml885203',
                repo: 'vscode-git-open'
            };
            const url = UrlBuilder.buildRepoUrl(remoteInfo);
            assert.strictEqual(url, 'https://github.com/iml885203/vscode-git-open');
        });

        test('should build GitLab repo URL with subgroups', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'gitlab',
                baseUrl: 'https://gitlab.com',
                owner: 'group/subgroup',
                repo: 'project'
            };
            const url = UrlBuilder.buildRepoUrl(remoteInfo);
            assert.strictEqual(url, 'https://gitlab.com/group/subgroup/project');
        });

        test('should build Bitbucket repo URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'bitbucket',
                baseUrl: 'https://bitbucket.org',
                owner: 'team',
                repo: 'project'
            };
            const url = UrlBuilder.buildRepoUrl(remoteInfo);
            assert.strictEqual(url, 'https://bitbucket.org/team/project');
        });

        test('should build Azure DevOps repo URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'azure',
                baseUrl: 'https://dev.azure.com',
                owner: 'organization',
                repo: 'project'
            };
            const url = UrlBuilder.buildRepoUrl(remoteInfo);
            assert.strictEqual(url, 'https://dev.azure.com/organization/project');
        });
    });

    suite('buildMergeRequestsUrl', () => {
        test('should build GitHub pull requests URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'github',
                baseUrl: 'https://github.com',
                owner: 'iml885203',
                repo: 'vscode-git-open'
            };
            const url = UrlBuilder.buildMergeRequestsUrl(remoteInfo);
            assert.strictEqual(url, 'https://github.com/iml885203/vscode-git-open/pulls');
        });

        test('should build GitLab merge requests URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'gitlab',
                baseUrl: 'https://gitlab.com',
                owner: 'group',
                repo: 'project'
            };
            const url = UrlBuilder.buildMergeRequestsUrl(remoteInfo);
            assert.strictEqual(url, 'https://gitlab.com/group/project/-/merge_requests');
        });

        test('should build Bitbucket pull requests URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'bitbucket',
                baseUrl: 'https://bitbucket.org',
                owner: 'team',
                repo: 'project'
            };
            const url = UrlBuilder.buildMergeRequestsUrl(remoteInfo);
            assert.strictEqual(url, 'https://bitbucket.org/team/project/pull-requests');
        });

        test('should build Azure DevOps pull requests URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'azure',
                baseUrl: 'https://dev.azure.com',
                owner: 'organization',
                repo: 'project'
            };
            const url = UrlBuilder.buildMergeRequestsUrl(remoteInfo);
            assert.strictEqual(url, 'https://dev.azure.com/organization/project/pullrequests');
        });

        test('should throw error for unknown provider', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'unknown',
                baseUrl: 'https://example.com',
                owner: 'owner',
                repo: 'repo'
            };
            assert.throws(
                () => UrlBuilder.buildMergeRequestsUrl(remoteInfo),
                /Unsupported Git provider/
            );
        });
    });

    suite('buildCreateMergeRequestUrl', () => {
        test('should build GitHub create PR URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'github',
                baseUrl: 'https://github.com',
                owner: 'iml885203',
                repo: 'vscode-git-open'
            };
            const url = UrlBuilder.buildCreateMergeRequestUrl(remoteInfo, 'feature', 'main');
            assert.strictEqual(
                url,
                'https://github.com/iml885203/vscode-git-open/compare/main...feature?expand=1'
            );
        });

        test('should build GitLab create MR URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'gitlab',
                baseUrl: 'https://gitlab.com',
                owner: 'group',
                repo: 'project'
            };
            const url = UrlBuilder.buildCreateMergeRequestUrl(remoteInfo, 'feature', 'main');
            assert.strictEqual(
                url,
                'https://gitlab.com/group/project/-/merge_requests/new?merge_request[source_branch]=feature&merge_request[target_branch]=main'
            );
        });

        test('should build Bitbucket create PR URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'bitbucket',
                baseUrl: 'https://bitbucket.org',
                owner: 'team',
                repo: 'project'
            };
            const url = UrlBuilder.buildCreateMergeRequestUrl(remoteInfo, 'feature', 'main');
            assert.strictEqual(
                url,
                'https://bitbucket.org/team/project/pull-requests/new?source=feature&dest=main'
            );
        });

        test('should build Azure DevOps create PR URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'azure',
                baseUrl: 'https://dev.azure.com',
                owner: 'organization',
                repo: 'project'
            };
            const url = UrlBuilder.buildCreateMergeRequestUrl(remoteInfo, 'feature', 'main');
            assert.strictEqual(
                url,
                'https://dev.azure.com/organization/project/pullrequestcreate?sourceRef=feature&targetRef=main'
            );
        });
    });

    suite('buildPipelinesUrl', () => {
        test('should build GitHub actions URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'github',
                baseUrl: 'https://github.com',
                owner: 'iml885203',
                repo: 'vscode-git-open'
            };
            const url = UrlBuilder.buildPipelinesUrl(remoteInfo);
            assert.strictEqual(url, 'https://github.com/iml885203/vscode-git-open/actions');
        });

        test('should build GitLab pipelines URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'gitlab',
                baseUrl: 'https://gitlab.com',
                owner: 'group',
                repo: 'project'
            };
            const url = UrlBuilder.buildPipelinesUrl(remoteInfo);
            assert.strictEqual(url, 'https://gitlab.com/group/project/-/pipelines');
        });

        test('should build Bitbucket pipelines URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'bitbucket',
                baseUrl: 'https://bitbucket.org',
                owner: 'team',
                repo: 'project'
            };
            const url = UrlBuilder.buildPipelinesUrl(remoteInfo);
            assert.strictEqual(url, 'https://bitbucket.org/team/project/pipelines');
        });

        test('should build Azure DevOps build URL', () => {
            const remoteInfo: GitRemoteInfo = {
                provider: 'azure',
                baseUrl: 'https://dev.azure.com',
                owner: 'organization',
                repo: 'project'
            };
            const url = UrlBuilder.buildPipelinesUrl(remoteInfo);
            assert.strictEqual(url, 'https://dev.azure.com/organization/project/_build');
        });
    });
});
