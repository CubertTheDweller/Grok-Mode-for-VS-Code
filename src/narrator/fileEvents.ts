import * as vscode from 'vscode';
import type { NarratorEvent } from '../types';

/**
 * Subscribes to VS Code workspace file events and emits NarratorEvents.
 * Uses onDidSaveTextDocument rather than onDidChangeTextDocument to avoid
 * flooding TTS with every keystroke.
 */
export class FileEventSource {
    private readonly disposables: vscode.Disposable[] = [];

    constructor(private readonly onEvent: (event: NarratorEvent) => void) {}

    start(): void {
        this.disposables.push(
            vscode.workspace.onDidCreateFiles((e) => {
                for (const file of e.files) {
                    this.onEvent({
                        type: 'fileCreated',
                        description: `Creating ${vscode.workspace.asRelativePath(file)}`,
                        path: file.fsPath,
                    });
                }
            }),

            vscode.workspace.onDidDeleteFiles((e) => {
                for (const file of e.files) {
                    this.onEvent({
                        type: 'fileDeleted',
                        description: `Deleting ${vscode.workspace.asRelativePath(file)}`,
                        path: file.fsPath,
                    });
                }
            }),

            vscode.workspace.onDidSaveTextDocument((doc) => {
                this.onEvent({
                    type: 'fileModified',
                    description: `Saving ${vscode.workspace.asRelativePath(doc.uri)}`,
                    path: doc.uri.fsPath,
                });
            }),
        );
    }

    stop(): void {
        for (const d of this.disposables) { d.dispose(); }
        this.disposables.length = 0;
    }
}
