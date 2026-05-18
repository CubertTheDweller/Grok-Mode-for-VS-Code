import type { ConversationTurn } from '../types';

/**
 * Maintains a rolling window of conversation history for multi-turn context.
 * Passed to CopilotBridge.send() so Copilot has prior-turn context.
 */
export class ContextTracker {
    private readonly history: ConversationTurn[] = [];
    private readonly maxTurns: number;

    /** @param maxTurns Maximum number of full turns (user + assistant pairs) to retain. */
    constructor(maxTurns = 10) {
        this.maxTurns = maxTurns;
    }

    addUserTurn(content: string): void {
        this.history.push({ role: 'user', content, timestamp: Date.now() });
        this.trim();
    }

    addAssistantTurn(content: string): void {
        this.history.push({ role: 'assistant', content, timestamp: Date.now() });
        this.trim();
    }

    /** Returns a shallow copy of the history array. */
    getHistory(): ConversationTurn[] {
        return [...this.history];
    }

    clear(): void {
        this.history.length = 0;
    }

    private trim(): void {
        // Each turn is one message; maxTurns * 2 = maxTurns user+assistant pairs
        while (this.history.length > this.maxTurns * 2) {
            this.history.shift();
        }
    }
}
