import type { CopilotBridge } from './copilotBridge';

/**
 * System instruction injected as a User message prefix when Planning Mode is enabled.
 * Note: vscode.lm does not support a system role — this is sent as a User message.
 */
const PLANNING_INSTRUCTION =
    '[SYSTEM] You are in Conversational Planning Mode for VS Code development.\n' +
    'Rules:\n' +
    '1. Break tasks into clear numbered steps before executing any code.\n' +
    '2. Ask ONE clarifying question at a time when requirements are ambiguous.\n' +
    '3. Propose a multi-step plan and wait for verbal confirmation before acting.\n' +
    '4. Narrate each action as you take it (e.g. "Creating file X", "Refactoring Y").\n' +
    '5. Keep all responses concise — they will be read aloud via text-to-speech.\n' +
    '[/SYSTEM]\n\n';

/**
 * Manages Conversational Planning Mode.
 * When enabled, wraps outgoing messages with a system instruction that
 * tells Copilot to ask questions, propose plans, and narrate actions.
 */
export class PlanningMode {
    private _enabled: boolean;

    constructor(
        _bridge: CopilotBridge,
        enabled = false,
    ) {
        this._enabled = enabled;
    }

    toggle(): void {
        this._enabled = !this._enabled;
    }

    enable(): void { this._enabled = true; }
    disable(): void { this._enabled = false; }

    get isEnabled(): boolean {
        return this._enabled;
    }

    /**
     * Prepends the planning-mode instruction to the message when enabled.
     * Returns the message unchanged when disabled.
     */
    wrapMessage(text: string): string {
        return this._enabled ? `${PLANNING_INSTRUCTION}${text}` : text;
    }
}
