import * as vscode from 'vscode';
import { CommitDecorationProvider } from './decorationProvider';
import { GitService } from './gitService';

export function activate(context: vscode.ExtensionContext) {
    console.log('========================================');
    console.log('[Extension] Explorer with Commits - ACTIVATING');
    console.log('[Extension] Workspace folders:', vscode.workspace.workspaceFolders?.length || 0);
    console.log('========================================');

    // Show activation notification
    vscode.window.showInformationMessage('Explorer with Commits activated! Check Developer Tools Console for logs.');

    // Initialize Git service
    const gitService = new GitService();
    console.log('[Extension] GitService created');
    
    // Initialize and register the decoration provider
    const decorationProvider = new CommitDecorationProvider(gitService);
    console.log('[Extension] CommitDecorationProvider created');
    
    const disposable = vscode.window.registerFileDecorationProvider(decorationProvider);
    console.log('[Extension] FileDecorationProvider registered');
    context.subscriptions.push(disposable);

    // Register manual refresh command
    const refreshCommand = vscode.commands.registerCommand('explorerWithCommits.refresh', () => {
        console.log('[Extension] Manual refresh command executed');
        vscode.window.showInformationMessage('Refreshing commit decorations...');
        decorationProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);

    // Listen for Git repository changes and refresh decorations
    context.subscriptions.push(
        gitService.onRepositoryChange(() => {
            console.log('[Extension] Repository changed, refreshing decorations');
            decorationProvider.refresh();
        })
    );

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('explorerWithCommits')) {
                console.log('[Extension] Configuration changed, refreshing decorations');
                decorationProvider.refresh();
            }
        })
    );

    // Listen for file system changes to invalidate cache
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(() => {
            console.log('[Extension] File saved, refreshing decorations');
            decorationProvider.refresh();
        })
    );

    // Cleanup
    context.subscriptions.push(gitService);
    
    console.log('[Extension] Activation complete!');
    console.log('========================================');
}

export function deactivate() {
    console.log('[Extension] Explorer with Commits - DEACTIVATING');
}
