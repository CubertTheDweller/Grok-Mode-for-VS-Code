import * as vscode from 'vscode';
import type { ITTSEngine } from '../tts/ITTSEngine';
import type { NarratorEvent } from '../types';
import type { CopilotBridge } from '../copilot/copilotBridge';
import { FileEventSource } from './fileEvents';
import { AgentEventSource } from './agentEvents';

/**
 * Listens to file system events and Copilot agent action phrases,
 * then narrates them aloud via TTS.
 *
 * "No silent edits" — every file write, create, or delete triggered by the
 * agent is spoken before and after it occurs.
 */
export class ActionNarrator {
    private readonly fileSource: FileEventSource;
    private readonly agentSource: AgentEventSource;

    constructor(
        private readonly tts: ITTSEngine,
        context: vscode.ExtensionContext,
        bridge: CopilotBridge,
    ) {
        this.fileSource = new FileEventSource((e) => this.narrate(e));
        this.agentSource = new AgentEventSource(bridge, (e) => this.narrate(e));

        this.fileSource.start();

        // Register file source disposable with the extension context
        context.subscriptions.push({ dispose: () => this.fileSource.stop() });
    }

    private narrate(event: NarratorEvent): void {
        this.tts.speak(event.description).catch(console.error);
    }

    dispose(): void {
        this.fileSource.stop();
    }
}
