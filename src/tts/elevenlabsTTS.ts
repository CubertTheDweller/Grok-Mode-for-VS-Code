import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';
import type { ITTSEngine } from './ITTSEngine';

/**
 * ElevenLabs neural TTS.
 * Downloads MP3 audio from the ElevenLabs API and plays it using a
 * platform-appropriate command (`afplay` on macOS, Windows Media Player on Windows).
 *
 * Requires `grokMode.elevenLabsApiKey` and optionally `grokMode.elevenLabsVoiceId`.
 */
export class ElevenLabsTTS implements ITTSEngine {
    private stopped = false;
    private currentProcess: ReturnType<typeof spawn> | undefined;

    constructor(
        private readonly apiKey: string,
        private readonly voiceId: string,
    ) {}

    async speak(text: string): Promise<void> {
        this.stopped = false;
        const audioPath = path.join(os.tmpdir(), `grokmode-el-${Date.now()}.mp3`);

        await this.downloadAudio(text, audioPath);

        if (this.stopped) {
            try { fs.unlinkSync(audioPath); } catch { /* ignore */ }
            return;
        }

        await this.playAudio(audioPath);
        try { fs.unlinkSync(audioPath); } catch { /* ignore */ }
    }

    private downloadAudio(text: string, outputPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const body = JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            });

            const req = https.request(
                {
                    hostname: 'api.elevenlabs.io',
                    path: `/v1/text-to-speech/${encodeURIComponent(this.voiceId)}`,
                    method: 'POST',
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body),
                    },
                },
                (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`ElevenLabs API returned HTTP ${res.statusCode}`));
                        return;
                    }
                    const file = fs.createWriteStream(outputPath);
                    res.pipe(file);
                    file.on('finish', () => file.close(() => resolve()));
                    file.on('error', reject);
                },
            );

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    private playAudio(audioPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Use spawn with explicit args — path is OS-controlled (tmpdir), no injection risk
            const [cmd, args] =
                process.platform === 'darwin'
                    ? ['afplay', [audioPath]]
                    : ['powershell', ['-NoProfile', '-c', `(New-Object Media.SoundPlayer '${audioPath.replace(/\\/g, '\\\\').replace(/'/g, "''")}').PlaySync()`]];

            this.currentProcess = spawn(cmd, args);
            this.currentProcess.on('close', (code) =>
                code === 0 ? resolve() : reject(new Error(`Audio player exited with code ${code}`)),
            );
            this.currentProcess.on('error', reject);
        });
    }

    stop(): void {
        this.stopped = true;
        this.currentProcess?.kill();
        this.currentProcess = undefined;
    }

    dispose(): void {
        this.stop();
    }
}
