/** Tracks the current state of the voice-dialogue loop. */
export enum DialogueState {
    Idle = 'idle',
    Listening = 'listening',
    Processing = 'processing',
    Speaking = 'speaking',
    WaitingForAnswer = 'waitingForAnswer',
    WaitingForConfirmation = 'waitingForConfirmation',
}

/** Emitted by file and agent event sources for the ActionNarrator to speak. */
export interface NarratorEvent {
    type: 'fileCreated' | 'fileModified' | 'fileDeleted' | 'agentAction' | 'terminalCommand';
    description: string;
    path?: string;
}

/** A single turn in the conversation history. */
export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}
