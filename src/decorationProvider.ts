import * as vscode from 'vscode';
import { GitService } from './gitService';

export class CommitDecorationProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    constructor(private gitService: GitService) {
        console.log('[DecorationProvider] Created');
    }

    async provideFileDecoration(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): Promise<vscode.FileDecoration | undefined> {
        console.log('[DecorationProvider] Decoration requested for:', uri.toString());
        
        // Check if extension is enabled
        const config = vscode.workspace.getConfiguration('explorerWithCommits');
        if (!config.get<boolean>('enabled', true)) {
            console.log('[DecorationProvider] Extension disabled in settings');
            return undefined;
        }

        // Skip if not a file scheme
        if (uri.scheme !== 'file') {
            console.log('[DecorationProvider] Skipping non-file URI:', uri.scheme);
            return undefined;
        }

        try {
            const commitInfo = await this.gitService.getLatestCommit(uri.fsPath);
            
            if (!commitInfo) {
                console.log('[DecorationProvider] No commit info found for:', uri.fsPath);
                return undefined;
            }

            console.log('[DecorationProvider] Commit found:', commitInfo.message.substring(0, 50));
            
            // Build tooltip with commit information
            let tooltip = commitInfo.message;
            
            if (config.get<boolean>('showAuthor', false) && commitInfo.authorName) {
                tooltip += `\n${commitInfo.authorName}`;
            }
            
            if (config.get<boolean>('showDate', true) && commitInfo.authorDate) {
                const date = new Date(commitInfo.authorDate);
                tooltip += `\n${this.formatDate(date)}`;
            }

            const decoration = {
                badge: '✓',
                tooltip: tooltip,
                propagate: false
            };
            
            console.log('[DecorationProvider] Returning decoration with badge');
            return decoration;
        } catch (error) {
            console.error('[DecorationProvider] Error getting decoration:', error);
            return undefined;
        }
    }

    public refresh(): void {
        console.log('[DecorationProvider] Refresh requested');
        this.gitService.clearCache();
        this._onDidChangeFileDecorations.fire(undefined);
    }

    private formatDate(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    dispose() {
        this._onDidChangeFileDecorations.dispose();
    }
}
