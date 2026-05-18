import type { CopilotBridge } from '../copilot/copilotBridge';
import type { ITTSEngine } from '../tts/ITTSEngine';
import type { Microphone } from '../voice/microphone';
import { QuestionDetector } from './questionDetector';
import { ContextTracker } from './contextTracker';
import { DialogueState } from '../types';

/**
 * Orchestrates the conversational dialogue loop.
 *
 * Responsibilities:
 *  - Speak Copilot responses via TTS
 *  - Detect whether Copilot asked a question / proposed a plan / needs confirmation
 *  - Keep the microphone open when a reply is expected
 *  - Maintain rolling conversation history for multi-turn context
 */
export class DialogueManager {
    private state = DialogueState.Idle;
    private readonly detector = new QuestionDetector();
    private readonly context = new ContextTracker();

    constructor(
        private readonly bridge: CopilotBridge,
        private readonly tts: ITTSEngine,
        private readonly mic: Microphone,
    ) {}

    /** Called by the mic pipeline when the user has spoken. */
    onUserSpeech(text: string): void {
        this.context.addUserTurn(text);
        this.state = DialogueState.Processing;
    }

    /** Called by CopilotBridge 'responseDone' event with the full response. */
    onCopilotResponse(fullResponse: string): void {
        this.context.addAssistantTurn(fullResponse);

        // Speak the response aloud
        this.state = DialogueState.Speaking;
        this.tts.speak(fullResponse).catch(console.error);

        const detected = this.detector.detect(fullResponse);

        switch (detected.type) {
            case 'question':
            case 'confirmation':
                // Hold mic open — user needs to answer before the loop continues
                this.state = DialogueState.WaitingForAnswer;
                break;

            case 'plan':
                this.state = DialogueState.WaitingForConfirmation;
                break;

            case 'action':
            case 'statement':
            default:
                this.state = DialogueState.Idle;
                break;
        }
    }

    get currentState(): DialogueState {
        return this.state;
    }

    /** Exposes history so MessageRouter can send it as context to Copilot. */
    getHistory() {
        return this.context.getHistory();
    }

    clearHistory(): void {
        this.context.clear();
    }
}
