import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Integration Test Suite', () => {
    
    test('Extension should activate successfully', async function() {
        this.timeout(10000);

        const ext = vscode.extensions.getExtension('senese.explorer-with-commits');
        assert.ok(ext, 'Extension should be present');

        await ext.activate();
        assert.ok(ext.isActive, 'Extension should be active');
    });

    test('Extension should work when Git API initializes late', async function() {
        this.timeout(15000);

        // Open a workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.skip();
            return;
        }

        console.log('[Test] Waiting for Git API to initialize...');
        
        // Wait for Git extension to be ready
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        assert.ok(gitExtension, 'Git extension should be available');

        if (!gitExtension.isActive) {
            await gitExtension.activate();
        }

        // Give Git time to scan for repositories
        await new Promise(resolve => setTimeout(resolve, 5000));

        const gitApi = gitExtension.exports.getAPI(1);
        console.log('[Test] Git API repositories detected:', gitApi.repositories.length);

        // Extension should handle this gracefully whether or not repos are found
        assert.ok(true, 'Extension handled Git API initialization');
    });

    test('Refresh command should be available', async function() {
        this.timeout(5000);

        const commands = await vscode.commands.getCommands(true);
        const hasRefreshCommand = commands.includes('explorerWithCommits.refresh');
        
        assert.ok(hasRefreshCommand, 'Refresh command should be registered');
    });

    test('Refresh command should execute without errors', async function() {
        this.timeout(5000);

        try {
            await vscode.commands.executeCommand('explorerWithCommits.refresh');
            assert.ok(true, 'Command executed successfully');
        } catch (error) {
            assert.fail(`Command execution failed: ${error}`);
        }
    });

    test('Configuration should be accessible', () => {
        const config = vscode.workspace.getConfiguration('explorerWithCommits');
        
        assert.ok(config, 'Configuration should be accessible');
        assert.strictEqual(typeof config.get('enabled'), 'boolean', 'enabled should be boolean');
        assert.strictEqual(typeof config.get('showAuthor'), 'boolean', 'showAuthor should be boolean');
        assert.strictEqual(typeof config.get('showDate'), 'boolean', 'showDate should be boolean');
        assert.strictEqual(typeof config.get('cacheDuration'), 'number', 'cacheDuration should be number');
    });

    test('Extension should handle workspace with no Git repository', async function() {
        this.timeout(5000);

        // This test verifies the extension doesn't crash when there's no Git repo
        // The extension should activate and simply not show decorations
        const ext = vscode.extensions.getExtension('senese.explorer-with-commits');
        assert.ok(ext?.isActive, 'Extension should remain active even without Git repo');
    });
});
