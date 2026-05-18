import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import type { ConversationTurn } from '../types';

/**
 * Bridge to GitHub Copilot via the VS Code Language Model API (`vscode.lm`).
 *
 * Events:
 *   'response'     (fragment: string) — streaming text chunk from Copilot
 *   'responseDone' (full: string)     — complete response text
 *   'error'        (err: Error)       — API or model error
 */
export class CopilotBridge extends EventEmitter {
    private model: vscode.LanguageModelChat | undefined;

    private async getModel(): Promise<vscode.LanguageModelChat> {
        if (this.model) { return this.model; }

        const models = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
        if (models.length === 0) {
            throw new Error(
                'No Copilot language model is available. ' +
                'Ensure GitHub Copilot is installed and you are signed in.',
            );
        }
        this.model = models[0];
        return this.model;
    }

    /**
     * Send a message to Copilot and stream the response.
     * history is prepended as prior turns for multi-turn context.
     */
    async send(
        userMessage: string,
        history: ConversationTurn[] = [],
        cancellationToken?: vscode.CancellationToken,
    ): Promise<void> {
        let model: vscode.LanguageModelChat;
        try {
            model = await this.getModel();
        } catch (err) {
            this.emit('error', err instanceof Error ? err : new Error(String(err)));
            return;
        }

        const token = cancellationToken ?? new vscode.CancellationTokenSource().token;

        const messages: vscode.LanguageModelChatMessage[] = [
            ...history.map((turn) =>
                turn.role === 'user'
                    ? vscode.LanguageModelChatMessage.User(turn.content)
                    : vscode.LanguageModelChatMessage.Assistant(turn.content),
            ),
            vscode.LanguageModelChatMessage.User(userMessage),
        ];

        let fullResponse = '';

        try {
            const response = await model.sendRequest(messages, {}, token);

            for await (const fragment of response.text) {
                fullResponse += fragment;
                this.emit('response', fragment);
            }

            this.emit('responseDone', fullResponse);
        } catch (err) {
            if (err instanceof vscode.LanguageModelError) {
                this.emit('error', err);
            } else {
                throw err;
            }
        }
    }

    /** Reset the cached model reference (e.g. after a sign-out). */
    resetModel(): void {
        this.model = undefined;
    }

    dispose(): void {
        this.removeAllListeners();
    }
}
