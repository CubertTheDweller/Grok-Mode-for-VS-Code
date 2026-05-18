import * as vscode from 'vscode';
import type { ITTSEngine } from './ITTSEngine';

/** No-op TTS used on unsupported platforms. Logs to the console instead of speaking. */
const nullTTS: ITTSEngine = {
    speak: async (text: string) => { console.log(`[TTS stub] ${text}`); },
    stop: () => { /* no-op */ },
    dispose: () => { /* no-op */ },
};

/**
 * Factory that reads `grokMode.ttsEngine` and returns the correct ITTSEngine.
 * Lazy-requires engine modules so unused engines are never loaded.
 */
export class TTSEngine {
    static create(config: vscode.WorkspaceConfiguration): ITTSEngine {
        const setting = config.get<string>('ttsEngine', 'auto');
        const engine = setting === 'auto' ? TTSEngine.detectPlatform() : setting;

        switch (engine) {
            case 'windows':
                return new (require('./windowsTTS').WindowsTTS as new () => ITTSEngine)();

            case 'macos':
                return new (require('./macTTS').MacTTS as new () => ITTSEngine)();

            case 'elevenlabs': {
                const apiKey = config.get<string>('elevenLabsApiKey', '').trim();
                const voiceId = config.get<string>('elevenLabsVoiceId', '21m00Tcm4TlvDq8ikWAM');
                if (!apiKey) {
                    vscode.window.showWarningMessage(
                        'Grok Mode: ElevenLabs API key is not set. Falling back to platform TTS. ' +
                        'Set `grokMode.elevenLabsApiKey` in your user settings.',
                    );
                    return TTSEngine.createPlatform();
                }
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { ElevenLabsTTS } = require('./elevenlabsTTS');
                return new ElevenLabsTTS(apiKey, voiceId) as ITTSEngine;
            }

            default:
                return nullTTS;
        }
    }

    private static detectPlatform(): string {
        if (process.platform === 'win32') { return 'windows'; }
        if (process.platform === 'darwin') { return 'macos'; }
        return 'unsupported';
    }

    private static createPlatform(): ITTSEngine {
        const platform = TTSEngine.detectPlatform();
        switch (platform) {
            case 'windows':
                return new (require('./windowsTTS').WindowsTTS as new () => ITTSEngine)();
            case 'macos':
                return new (require('./macTTS').MacTTS as new () => ITTSEngine)();
            default:
                return nullTTS;
        }
    }
}
