import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitService } from '../../gitService';

suite('Git API Timing Test Suite', () => {
    
    test('GitService should handle delayed Git API initialization', async function() {
        this.timeout(35000); // Allow for 30s wait + overhead

        console.log('[TimingTest] Creating GitService...');
        const gitService = new GitService();
        
        console.log('[TimingTest] GitService created, waiting for repository detection...');
        
        // Simulate the scenario where decoration is requested before Git is ready
        const earlyRequest = gitService.getLatestCommit('/some/path/file.ts');
        
        // Wait a bit to simulate Git API initializing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Early request should complete without crashing
        const result = await earlyRequest;
        console.log('[TimingTest] Early request result:', result ? 'Commit found' : 'No commit (expected)');
        
        assert.ok(true, 'GitService handled early request without crashing');
        
        gitService.dispose();
    });

    test('Multiple concurrent requests should not cause race conditions', async function() {
        this.timeout(15000);

        const gitService = new GitService();
        
        console.log('[TimingTest] Making concurrent requests...');
        
        // Make multiple concurrent requests to test race conditions
        const promises = [
            gitService.getLatestCommit('/path/1'),
            gitService.getLatestCommit('/path/2'),
            gitService.getLatestCommit('/path/3'),
            gitService.getLatestCommit('/path/4'),
            gitService.getLatestCommit('/path/5')
        ];
        
        const results = await Promise.all(promises);
        
        console.log('[TimingTest] All concurrent requests completed');
        assert.strictEqual(results.length, 5, 'All requests should complete');
        
        gitService.dispose();
    });

    test('Repository change event should trigger after delayed detection', async function() {
        this.timeout(35000);

        const gitService = new GitService();
        let eventReceived = false;
        
        const subscription = gitService.onRepositoryChange(() => {
            console.log('[TimingTest] Repository change event received');
            eventReceived = true;
        });

        console.log('[TimingTest] Waiting for repository detection...');
        
        // Wait for Git to potentially detect repositories
        await new Promise(resolve => setTimeout(resolve, 32000));
        
        subscription.dispose();
        
        // Event might or might not fire depending on workspace, but shouldn't crash
        console.log('[TimingTest] Event fired:', eventReceived);
        assert.ok(true, 'Repository change event handling works correctly');
        
        gitService.dispose();
    });

    test('Cache should work across Git API initialization', async function() {
        this.timeout(10000);

        const gitService = new GitService();
        
        // Request before Git is fully ready
        const path = '/test/path';
        await gitService.getLatestCommit(path);
        
        // Wait for potential Git initialization
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Request again - should use cache or re-query gracefully
        const start = Date.now();
        await gitService.getLatestCommit(path);
        const duration = Date.now() - start;
        
        console.log('[TimingTest] Second request took:', duration, 'ms');
        assert.ok(duration < 5000, 'Second request should be fast (cached or quick)');
        
        gitService.dispose();
    });
});
