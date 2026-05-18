import * as vscode from 'vscode';

/**
 * Thin wrapper around a VS Code OutputChannel.
 * Adds timestamps to every line and is safe to use from any module.
 *
 * Usage:
 *   const logger = new Logger();
 *   context.subscriptions.push(logger);
 *   logger.log('Extension activated');
 *   logger.show();   // reveal the Output panel
 */
export class Logger implements vscode.Disposable {
    private readonly channel: vscode.OutputChannel;

    constructor() {
        this.channel = vscode.window.createOutputChannel('Grok Mode');
    }

    log(message: string): void {
        const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
        this.channel.appendLine(`[${ts}] ${message}`);
    }

    /** Reveal the Output panel without stealing focus. */
    show(): void {
        this.channel.show(/* preserveFocus */ true);
    }

    dispose(): void {
        this.channel.dispose();
    }
}
