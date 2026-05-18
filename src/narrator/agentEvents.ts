import type { CopilotBridge } from '../copilot/copilotBridge';
import type { NarratorEvent } from '../types';

/**
 * Parses action narration phrases from completed Copilot responses.
 * Fires a NarratorEvent for each action line detected so the ActionNarrator
 * can speak them via TTS.
 *
 * Recognised patterns (case-insensitive, start of line):
 *   Creating / Modifying / Deleting / Updating / Adding / Removing /
 *   Refactoring / Running / Executing / Writing / Done / Complete
 */
const ACTION_LINE_PATTERN =
    /^(creating|modifying|deleting|updating|adding|removing|refactoring|running|executing|writing|done|complete)[^\n]*/gim;

export class AgentEventSource {
    constructor(
        bridge: CopilotBridge,
        private readonly onEvent: (event: NarratorEvent) => void,
    ) {
        bridge.on('responseDone', (full: string) => this.parseResponse(full));
    }

    private parseResponse(response: string): void {
        const matches = response.matchAll(ACTION_LINE_PATTERN);
        for (const match of matches) {
            this.onEvent({
                type: 'agentAction',
                description: match[0].trim(),
            });
        }
    }
}
