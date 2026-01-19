import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('senese.explorer-with-commits'));
    });

    test('Extension should activate', async () => {
        const ext = vscode.extensions.getExtension('senese.explorer-with-commits');
        await ext?.activate();
        assert.ok(ext?.isActive);
    });

    test('Configuration should have default values', () => {
        const config = vscode.workspace.getConfiguration('explorerWithCommits');
        assert.strictEqual(config.get('enabled'), true);
        assert.strictEqual(config.get('showAuthor'), false);
        assert.strictEqual(config.get('showDate'), true);
        assert.strictEqual(config.get('cacheDuration'), 300000);
    });
});
