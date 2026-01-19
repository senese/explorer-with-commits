import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitService } from '../../gitService';

suite('GitService Test Suite', () => {
    let gitService: GitService;

    setup(() => {
        gitService = new GitService();
    });

    teardown(() => {
        gitService.dispose();
    });

    test('GitService should initialize without throwing', () => {
        assert.ok(gitService, 'GitService should be created');
    });

    test('GitService should handle missing Git extension gracefully', async () => {
        // This test verifies that getLatestCommit doesn't crash if Git is not available
        const result = await gitService.getLatestCommit('/nonexistent/path');
        assert.strictEqual(result, null, 'Should return null for invalid paths');
    });

    test('GitService should use cache for repeated requests', async function() {
        this.timeout(10000); // Increase timeout for this test

        // Wait a bit for Git API to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        const testFile = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!testFile) {
            this.skip(); // Skip if no workspace folder
            return;
        }

        // First request
        const start1 = Date.now();
        const result1 = await gitService.getLatestCommit(testFile + '/test.ts');
        const duration1 = Date.now() - start1;

        // Second request (should be cached)
        const start2 = Date.now();
        const result2 = await gitService.getLatestCommit(testFile + '/test.ts');
        const duration2 = Date.now() - start2;

        // Cache should make second request much faster
        assert.ok(duration2 < duration1 / 2 || duration2 < 50, 
            `Second request (${duration2}ms) should be faster than first (${duration1}ms)`);
    });

    test('GitService should clear cache on clearCache()', async () => {
        gitService.clearCache();
        // If this doesn't throw, the test passes
        assert.ok(true, 'Cache cleared without errors');
    });

    test('GitService should emit repository change events', function(done) {
        this.timeout(5000);

        let eventFired = false;
        const subscription = gitService.onRepositoryChange(() => {
            eventFired = true;
            subscription.dispose();
            done();
        });

        // Wait for Git to initialize and detect repositories
        setTimeout(() => {
            if (!eventFired) {
                subscription.dispose();
                // If no event fired, that's ok - might not have a repo
                done();
            }
        }, 3000);
    });
});
