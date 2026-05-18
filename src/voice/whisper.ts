import * as fs from 'fs';
import * as path from 'path';
import type { ISTTEngine } from './ISTTEngine';

/**
 * Speech-to-text via nodejs-whisper (wraps Whisper.cpp).
 *
 * Prerequisites:
 *   npm install nodejs-whisper
 *   Build tools: make/mingw32 on Windows, build-essential on Linux
 *   Download model once: npx nodejs-whisper download base.en
 *
 * Input: 16 kHz mono WAV file (produced by Microphone)
 */
export class WhisperSTT implements ISTTEngine {
    private readonly modelName: string;

    constructor(modelName = 'base.en') {
        this.modelName = modelName;
    }

    async transcribe(audioPath: string): Promise<string> {
        // Dynamic import avoids hard failure if nodejs-whisper isn't installed
        let nodewhisper: (path: string, opts: object) => Promise<unknown>;
        try {
            nodewhisper = (require('nodejs-whisper') as { nodewhisper: typeof nodewhisper }).nodewhisper;
        } catch {
            throw new Error(
                'nodejs-whisper is not installed.\n' +
                'Run: npm install nodejs-whisper\n' +
                'Then download a model: npx nodejs-whisper download base.en',
            );
        }

        // Pre-check model existence — nodejs-whisper's auto-download is unreliable on Windows
        // and crashes with an obscure TypeError instead of a useful message.
        const constants = require('nodejs-whisper/dist/constants') as {
            WHISPER_CPP_PATH: string;
            MODEL_OBJECT: Record<string, string>;
        };
        const modelFile = constants.MODEL_OBJECT[this.modelName];
        if (!modelFile) {
            throw new Error(`Unknown Whisper model: "${this.modelName}"`);
        }
        const modelPath = path.join(constants.WHISPER_CPP_PATH, 'models', modelFile);
        if (!fs.existsSync(modelPath)) {
            throw new Error(
                `Whisper model "${this.modelName}" not found.\n` +
                `Expected: ${modelPath}\n` +
                `Download it by running in a terminal:\n` +
                `  npx nodejs-whisper download ${this.modelName}`,
            );
        }

        await nodewhisper(audioPath, {
            modelName: this.modelName,
            whisperOptions: {
                outputInText: true,
                wordTimestamps: false,
            },
        });

        // nodejs-whisper writes a .txt file alongside the input WAV
        const txtPath = audioPath.replace(/\.wav$/i, '.txt');
        if (fs.existsSync(txtPath)) {
            const text = fs.readFileSync(txtPath, 'utf8').trim();
            try { fs.unlinkSync(txtPath); } catch { /* ignore */ }
            return text;
        }

        return '';
    }

    dispose(): void {
        // No persistent resources
    }
}
