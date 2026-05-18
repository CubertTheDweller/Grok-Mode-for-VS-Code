import * as vscode from 'vscode';
import { TTSEngine } from './tts/ttsEngine';
import { Microphone } from './voice/microphone';
import { WhisperSTT } from './voice/whisper';
import { HotwordFilter } from './voice/hotword';
import { CopilotBridge } from './copilot/copilotBridge';
import { MessageRouter } from './copilot/messageRouter';
import { PlanningMode } from './copilot/planningMode';
import { DialogueManager } from './dialogue/dialogueManager';
import { ActionNarrator } from './narrator/actionNarrator';
import { GrokPanel } from './ui/panel';
import type { ITTSEngine } from './tts/ITTSEngine';

let microphone: Microphone | undefined;
let ttsEngine: ITTSEngine | undefined;
let narrator: ActionNarrator | undefined;
let panel: GrokPanel | undefined;
let isRunning = false;

export function activate(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('grokMode');

    // ── Construct all modules ──────────────────────────────────────────────────
    ttsEngine       = TTSEngine.create(config);
    const stt       = new WhisperSTT(config.get('whisperModel', 'base.en'));
    microphone      = new Microphone(config.get('silenceThreshold', 1.5));
    const hotword   = new HotwordFilter(config.get('hotword', ''));
    const bridge    = new CopilotBridge();
    const planning  = new PlanningMode(bridge, config.get('planningModeEnabled', false));
    const dialogue  = new DialogueManager(bridge, ttsEngine, microphone);
    narrator        = new ActionNarrator(ttsEngine, context, bridge);
    panel           = new GrokPanel(context.extensionUri);

    // ── Wire CopilotBridge → Dialogue + Panel ─────────────────────────────────
    bridge.on('response', (fragment: string) => {
        panel?.appendResponse(fragment);
    });

    bridge.on('responseDone', (full: string) => {
        dialogue.onCopilotResponse(full);
        panel?.setLastResponse(full);
    });

    bridge.on('error', (err: Error) => {
        vscode.window.showErrorMessage(`Grok Mode — Copilot error: ${err.message}`);
        panel?.log(`Error: ${err.message}`);
    });

    // ── Wire mic pipeline: audioReady → hotword → transcribe → route ──────────
    const router = new MessageRouter(bridge, planning);

    microphone.on('audioReady', async (audioPath: string) => {
        try {
            const rawText = await stt.transcribe(audioPath);
            const text = hotword.filter(rawText);
            if (!text) { return; } // hotword not detected — skip

            panel?.setLastCommand(text);
            panel?.log(`You: ${text}`);
            dialogue.onUserSpeech(text);

            await router.route(text, dialogue.getHistory());
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Grok Mode error: ${message}`);
            panel?.log(`Error: ${message}`);
        }
    });

    microphone.on('error', (err: Error) => {
        vscode.window.showErrorMessage(`Grok Mode — Microphone error: ${err.message}`);
        panel?.log(`Mic error: ${err.message}`);
        isRunning = false;
        panel?.setMicStatus('off');
    });

    // ── Register commands ──────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('grokMode.start', () => startLoop()),
        vscode.commands.registerCommand('grokMode.stop',  () => stopLoop()),
        vscode.commands.registerCommand('grokMode.togglePlanningMode', () => {
            planning.toggle();
            const enabled = planning.isEnabled;
            panel?.setPlanningMode(enabled);
            panel?.log(`Planning Mode: ${enabled ? 'ON' : 'OFF'}`);
            vscode.window.showInformationMessage(
                `Grok Mode: Planning Mode ${enabled ? 'enabled' : 'disabled'}`,
            );
        }),
    );

    // ── Helpers ───────────────────────────────────────────────────────────────
    function startLoop(): void {
        if (isRunning) { return; }
        isRunning = true;
        panel?.show();
        panel?.setMicStatus('on');
        panel?.setPlanningMode(planning.isEnabled);
        panel?.log('Grok Mode started');
        microphone!.startContinuous();
        ttsEngine!.speak('Grok Mode activated.').catch(console.error);
    }

    function stopLoop(): void {
        if (!isRunning) { return; }
        isRunning = false;
        microphone!.stop();
        panel?.setMicStatus('off');
        panel?.log('Grok Mode stopped');
        ttsEngine!.speak('Grok Mode stopped.').catch(console.error);
    }
}

export function deactivate(): void {
    microphone?.stop();
    ttsEngine?.stop();
    narrator?.dispose();
    panel?.dispose();
}
