import * as vscode from 'vscode';
import type { CopilotBridge } from './copilotBridge';
import type { PlanningMode } from './planningMode';
import type { ConversationTurn } from '../types';

/**
 * Routes recognized speech to the appropriate handler:
 *   - VS Code built-in commands (e.g. "open terminal")
 *   - Copilot Chat (everything else, optionally wrapped with planning-mode context)
 */
export class MessageRouter {
    private readonly commandMap: ReadonlyMap<string, string>;

    constructor(
        private readonly bridge: CopilotBridge,
        private readonly planning: PlanningMode,
    ) {
        this.commandMap = new Map<string, string>([
            ['open terminal', 'workbench.action.terminal.new'],
            ['save file', 'workbench.action.files.save'],
            ['save all', 'workbench.action.files.saveAll'],
            ['close file', 'workbench.action.closeActiveEditor'],
            ['toggle sidebar', 'workbench.action.toggleSidebarVisibility'],
            ['open settings', 'workbench.action.openSettings'],
            ['split editor', 'workbench.action.splitEditor'],
            ['close terminal', 'workbench.action.terminal.kill'],
        ]);
    }

    async route(text: string, history: ConversationTurn[] = []): Promise<void> {
        const trimmed = text.trim();
        if (!trimmed) { return; }

        // Check for a VS Code command shortcut first
        const command = this.commandMap.get(trimmed.toLowerCase());
        if (command) {
            await vscode.commands.executeCommand(command);
            return;
        }

        // Wrap with planning-mode system instruction if enabled, then send to Copilot
        const message = this.planning.wrapMessage(trimmed);
        await this.bridge.send(message, history);
    }
}
