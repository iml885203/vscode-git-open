import * as assert from 'assert';
import * as path from 'path';
import { GitHelper, GitError } from '../../gitHelper';

suite('GitHelper Test Suite', () => {
    const testRepoPath = path.join(__dirname, '../../../');
    const timeout = 5000; // 5 seconds timeout

    test('isGitRepository should return true for valid git repo', async () => {
        const result = await GitHelper.isGitRepository(testRepoPath);
        assert.strictEqual(result, true);
    }).timeout(timeout);

    test('isGitRepository should return false for invalid path', async () => {
        const result = await GitHelper.isGitRepository('/invalid/path');
        assert.strictEqual(result, false);
    }).timeout(timeout);

    test('getRemoteUrl should return valid URL', async () => {
        const url = await GitHelper.getRemoteUrl(testRepoPath);
        assert.ok(url.startsWith('https://'));
    }).timeout(timeout);

    test('getRemoteInfo should parse GitHub URL correctly', async () => {
        const info = await GitHelper.getRemoteInfo(testRepoPath);
        
        assert.ok(info.provider === 'github' || info.provider === 'gitlab' || 
                 info.provider === 'bitbucket' || info.provider === 'azure');
        assert.ok(info.owner);
        assert.ok(info.repo);
        assert.ok(info.baseUrl);
    }).timeout(timeout);

    test('getCurrentBranch should return a string', async () => {
        const branch = await GitHelper.getCurrentBranch(testRepoPath);
        assert.ok(typeof branch === 'string' && branch.length > 0);
    }).timeout(timeout);

    test('getDefaultBranch should return main or master', async () => {
        const branch = await GitHelper.getDefaultBranch(testRepoPath);
        assert.ok(branch === 'main' || branch === 'master');
    }).timeout(timeout);

    test('should throw GitError for invalid path', async () => {
        try {
            await GitHelper.getRemoteUrl('');
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof GitError);
            assert.strictEqual(error.message, 'Path is required');
        }
    }).timeout(timeout);
}); 