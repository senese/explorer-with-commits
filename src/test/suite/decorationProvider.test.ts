import * as assert from 'assert';
import * as vscode from 'vscode';
import { CommitDecorationProvider } from '../../decorationProvider';
import { GitService } from '../../gitService';

suite('CommitDecorationProvider Test Suite', () => {
    let gitService: GitService;
    let provider: CommitDecorationProvider;

    setup(() => {
        gitService = new GitService();
        provider = new CommitDecorationProvider(gitService);
    });

    teardown(() => {
        provider.dispose();
        gitService.dispose();
    });

    test('Provider should be created successfully', () => {
        assert.ok(provider, 'Provider should be created');
    });

    test('Provider should skip non-file URIs', async () => {
        const untitledUri = vscode.Uri.parse('untitled:Untitled-1');
        const decoration = await provider.provideFileDecoration(untitledUri, {} as any);
        
        assert.strictEqual(decoration, undefined, 'Should return undefined for non-file URIs');
    });

    test('Provider should handle file URIs', async function() {
        this.timeout(10000);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            this.skip();
            return;
        }

        // Wait for Git to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));

        const fileUri = vscode.Uri.file(workspaceFolder.uri.fsPath + '/package.json');
        const decoration = await provider.provideFileDecoration(fileUri, {} as any);
        
        // Decoration might be undefined if file has no commits, but should not throw
        assert.ok(decoration === undefined || decoration.badge !== undefined, 
            'Should either return decoration or undefined without errors');
    });

    test('Provider should respect enabled setting', async function() {
        this.timeout(5000);

        // Disable the extension
        const config = vscode.workspace.getConfiguration('explorerWithCommits');
        await config.update('enabled', false, vscode.ConfigurationTarget.Global);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            this.skip();
            return;
        }

        const fileUri = vscode.Uri.file(workspaceFolder.uri.fsPath + '/README.md');
        const decoration = await provider.provideFileDecoration(fileUri, {} as any);
        
        assert.strictEqual(decoration, undefined, 'Should return undefined when disabled');

        // Re-enable
        await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    });

    test('Provider should handle refresh without errors', () => {
        provider.refresh();
        assert.ok(true, 'Refresh should not throw');
    });

    test('Provider should fire change events on refresh', function(done) {
        this.timeout(2000);

        provider.onDidChangeFileDecorations(() => {
            done();
        });

        provider.refresh();
    });
});
