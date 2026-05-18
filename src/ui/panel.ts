import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * WebView panel showing mic status, last command, streaming Copilot response,
 * planning-mode indicator, and an action log.
 *
 * Messages sent to the WebView (postMessage):
 *   { type: 'micStatus',      status: 'on' | 'off' }
 *   { type: 'lastCommand',    text: string }
 *   { type: 'lastResponse',   text: string }
 *   { type: 'appendResponse', fragment: string }
 *   { type: 'planningMode',   enabled: boolean }
 *   { type: 'log',            message: string }
 */
export class GrokPanel {
    private panel: vscode.WebviewPanel | undefined;

    constructor(private readonly extensionUri: vscode.Uri) {}

    show(): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'grokMode',
            'Grok Mode',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
            },
        );

        this.panel.webview.html = this.getHtmlContent();
        this.panel.onDidDispose(() => { this.panel = undefined; });
    }

    setMicStatus(status: 'on' | 'off'): void {
        this.post({ type: 'micStatus', status });
    }

    setLastCommand(text: string): void {
        this.post({ type: 'lastCommand', text });
    }

    setLastResponse(text: string): void {
        this.post({ type: 'lastResponse', text });
    }

    appendResponse(fragment: string): void {
        this.post({ type: 'appendResponse', fragment });
    }

    setPlanningMode(enabled: boolean): void {
        this.post({ type: 'planningMode', enabled });
    }

    log(message: string): void {
        this.post({ type: 'log', message: `[${new Date().toLocaleTimeString()}] ${message}` });
    }

    private post(message: Record<string, unknown>): void {
        this.panel?.webview.postMessage(message);
    }

    private getHtmlContent(): string {
        const htmlPath = path.join(this.extensionUri.fsPath, 'media', 'panel.html');
        return fs.readFileSync(htmlPath, 'utf8');
    }

    dispose(): void {
        this.panel?.dispose();
        this.panel = undefined;
    }
}
