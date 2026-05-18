import * as vscode from 'vscode';
import { Logger } from './logger';
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
let logger: Logger | undefined;
let isRunning = false;

export function activate(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('grokMode');

    // ── Logger (OutputChannel) ─────────────────────────────────────────────────
    logger = new Logger();
    context.subscriptions.push(logger);
    logger.log('Grok Mode activating…');
    logger.log(`Config: ttsEngine=${config.get('ttsEngine', 'auto')}, whisperModel=${config.get('whisperModel', 'base.en')}, silenceThreshold=${config.get('silenceThreshold', 1.5)}s, hotword="${config.get('hotword', '')}", planningMode=${config.get('planningModeEnabled', false)}`);

    // ── Construct all modules ──────────────────────────────────────────────────
    ttsEngine       = TTSEngine.create(config);
    const stt       = new WhisperSTT(config.get('whisperModel', 'base.en'));
    microphone      = new Microphone(config.get('silenceThreshold', 1.5), logger);
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
        logger?.log(`CopilotBridge error: ${err.message}`);
        vscode.window.showErrorMessage(`Grok Mode — Copilot error: ${err.message}`);
        panel?.log(`Error: ${err.message}`);
    });

    // ── Wire mic pipeline: audioReady → hotword → transcribe → route ──────────
    const router = new MessageRouter(bridge, planning);

    microphone.on('audioReady', async (audioPath: string) => {
        logger?.log(`Transcribing: ${audioPath}`);
        try {
            const rawText = await stt.transcribe(audioPath);
            logger?.log(`Transcribed: "${rawText}"`);
            const text = hotword.filter(rawText);
            if (!text) {
                logger?.log('Hotword not detected — skipping');
                return;
            } // hotword not detected — skip

            panel?.setLastCommand(text);
            panel?.log(`You: ${text}`);
            dialogue.onUserSpeech(text);

            await router.route(text, dialogue.getHistory());
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger?.log(`Error during transcription/routing: ${message}`);
            vscode.window.showErrorMessage(`Grok Mode error: ${message}`);
            panel?.log(`Error: ${message}`);
        }
    });

    microphone.on('error', (err: Error) => {
        logger?.log(`Microphone error: ${err.message}`);
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
            logger?.log(`Planning Mode toggled: ${enabled ? 'ON' : 'OFF'}`);
            panel?.setPlanningMode(enabled);
            panel?.log(`Planning Mode: ${enabled ? 'ON' : 'OFF'}`);
            vscode.window.showInformationMessage(
                `Grok Mode: Planning Mode ${enabled ? 'enabled' : 'disabled'}`,
            );
        }),
    );

    logger?.log('Grok Mode activated. Commands registered: grokMode.start, grokMode.stop, grokMode.togglePlanningMode');

    // ── Helpers ───────────────────────────────────────────────────────────────
    function startLoop(): void {
        if (isRunning) { return; }
        isRunning = true;
        logger?.show();
        logger?.log('grokMode.start invoked');
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
        logger?.log('grokMode.stop invoked');
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
