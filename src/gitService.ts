import * as vscode from 'vscode';

export interface CommitInfo {
    hash: string;
    message: string;
    authorName?: string;
    authorDate?: Date;
}

interface CacheEntry {
    commitInfo: CommitInfo | null;
    timestamp: number;
}

export class GitService implements vscode.Disposable {
    private cache = new Map<string, CacheEntry>();
    private gitApi: any;
    private repository: any;
    private cacheDuration: number;
    private initPromise: Promise<void> | null = null;
    private repositoryChangeEmitter = new vscode.EventEmitter<void>();
    public readonly onRepositoryChange = this.repositoryChangeEmitter.event;

    constructor() {
        this.cacheDuration = this.getCacheDuration();
        console.log('[GitService] Service created, deferring Git API initialization');
    }

    async ensureGitApiInitialized(): Promise<boolean> {
        if (this.gitApi && this.repository) {
            return true;
        }

        if (this.initPromise) {
            await this.initPromise;
            return !!this.repository;
        }

        this.initPromise = this.initializeGitApi();
        await this.initPromise;
        return !!this.repository;
    }

    private async initializeGitApi(): Promise<void> {
        console.log('[GitService] Initializing Git API...');
        
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
            this.gitApi = gitExtension.getAPI(1);
            console.log('[GitService] Git API version 1 obtained');
            
            // Wait for repositories to be detected
            if (this.gitApi.repositories.length > 0) {
                this.repository = this.gitApi.repositories[0];
                console.log('[GitService] Repository found immediately:', this.repository.rootUri.fsPath);
                this.repositoryChangeEmitter.fire();
            } else {
                console.log('[GitService] No repositories yet, waiting for Git to scan...');
                // Wait for repository to be opened
                await this.waitForRepository();
            }

            // Listen for repository changes
            this.gitApi.onDidOpenRepository((repo: any) => {
                console.log('[GitService] Repository opened:', repo.rootUri.fsPath);
                if (!this.repository) {
                    this.repository = repo;
                    this.repositoryChangeEmitter.fire();
                }
            });

            this.gitApi.onDidCloseRepository(() => {
                console.log('[GitService] Repository closed');
                this.repository = null;
                this.clearCache();
                this.repositoryChangeEmitter.fire();
            });
        } catch (error) {
            console.error('[GitService] Failed to initialize Git API:', error);
            throw error;
        }
    }

    private async waitForRepository(timeoutMs: number = 30000): Promise<void> {
        console.log('[GitService] Waiting for repository to be detected...');
        
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.gitApi.repositories.length > 0) {
                    this.repository = this.gitApi.repositories[0];
                    console.log('[GitService] Repository detected:', this.repository.rootUri.fsPath);
                    clearInterval(checkInterval);
                    this.repositoryChangeEmitter.fire();
                    resolve();
                } else if (Date.now() - startTime > timeoutMs) {
                    console.warn('[GitService] Timeout waiting for repository');
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500); // Check every 500ms
        });
    }

    async getLatestCommit(filePath: string): Promise<CommitInfo | null> {
        console.log('[GitService] Getting latest commit for:', filePath);
        
        // Check cache first
        const cached = this.cache.get(filePath);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            console.log('[GitService] Cache hit for:', filePath);
            return cached.commitInfo;
        }

        // Ensure Git API is initialized
        const isInitialized = await this.ensureGitApiInitialized();
        if (!isInitialized) {
            console.warn('[GitService] Git API not initialized, cannot get commit info');
            return null;
        }

        try {
            // Get relative path from repository root
            const repoRoot = this.repository.rootUri.fsPath;
            if (!filePath.startsWith(repoRoot)) {
                return null;
            }

            const relativePath = filePath.substring(repoRoot.length + 1);

            // Get commit log for this file
            const commits = await this.repository.log({ 
                maxEntries: 1, 
                path: relativePath 
            });

            if (!commits || commits.length === 0) {
                this.cacheResult(filePath, null);
                return null;
            }

            const commit = commits[0];
            const commitInfo: CommitInfo = {
                hash: commit.hash,
                message: commit.message.split('\n')[0], // First line only
                authorName: commit.authorName,
                authorDate: commit.authorDate
            };

            this.cacheResult(filePath, commitInfo);
            return commitInfo;
        } catch (error) {
            console.error(`Error getting commit for ${filePath}:`, error);
            this.cacheResult(filePath, null);
            return null;
        }
    }

    private cacheResult(filePath: string, commitInfo: CommitInfo | null): void {
        this.cache.set(filePath, {
            commitInfo,
            timestamp: Date.now()
        });
    }

    private getCacheDuration(): number {
        const config = vscode.workspace.getConfiguration('explorerWithCommits');
        return config.get<number>('cacheDuration', 300000); // Default 5 minutes
    }

    clearCache(): void {
        this.cache.clear();
    }

    dispose(): void {
        this.cache.clear();
        this.repositoryChangeEmitter.dispose();
    }
}
