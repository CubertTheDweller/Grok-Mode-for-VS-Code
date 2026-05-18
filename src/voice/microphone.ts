import { EventEmitter } from 'events';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import type { Logger } from '../logger';

interface RecorderModule {
    record(options: RecordOptions): Recording;
}

interface RecordOptions {
    sampleRate: number;
    channels: number;
    audioType: string;
    recorder: string;
    silence: string;
}

interface Recording {
    stop(): void;
    stream(): NodeJS.ReadableStream;
}

/**
 * Captures microphone audio using node-record-lpcm16 + SoX.
 *
 * Prerequisites:
 *   npm install node-record-lpcm16
 *   SoX must be on PATH:
 *     Windows: choco install sox.portable
 *     macOS:   brew install sox
 *
 * Events:
 *   'audioReady' (audioPath: string) — fired when an utterance WAV file is ready
 *   'error'      (err: Error)        — fired on recording errors
 */
export class Microphone extends EventEmitter {
    private recording: Recording | undefined;
    private writeStream: fs.WriteStream | undefined;
    private _continuous = false;
    private _stopped = false;
    private readonly silenceThreshold: number;
    private readonly logger: Logger | undefined;

    constructor(silenceThreshold = 1.5, logger?: Logger) {
        super();
        this.silenceThreshold = silenceThreshold;
        this.logger = logger;
    }

    /**
     * Checks whether SoX is available on PATH.
     * Returns the resolved path on success, or throws with install instructions.
     */
    static checkSox(): string {
        const cmd = process.platform === 'win32' ? 'where' : 'which';
        try {
            return execFileSync(cmd, ['sox'], { encoding: 'utf8' }).trim();
        } catch {
            const installHint = process.platform === 'win32'
                ? 'Windows: choco install sox.portable  OR  scoop install sox'
                : process.platform === 'darwin'
                    ? 'macOS: brew install sox'
                    : 'Linux: sudo apt install sox  OR  sudo dnf install sox';
            throw new Error(
                `SoX not found on PATH.\n${installHint}\n` +
                'After installing, restart VS Code so the new PATH is detected.',
            );
        }
    }

    /** Start continuous listening — restarts after each utterance until stop() is called. */
    startContinuous(): void {
        // Pre-flight: verify SoX is available before starting the recording loop.
        try {
            const soxPath = Microphone.checkSox();
            this.logger?.log(`SoX found: ${soxPath}`);
        } catch (err) {
            this.emit('error', err instanceof Error ? err : new Error(String(err)));
            return;
        }

        this._continuous = true;
        this._stopped = false;
        this.logger?.log('Microphone: starting continuous capture');
        this.captureOnce();
    }

    /** Capture a single utterance and emit 'audioReady'. */
    captureOnce(): void {
        if (this._stopped) { return; }

        let recorder: RecorderModule;
        try {
            recorder = require('node-record-lpcm16') as RecorderModule;
        } catch {
            this.emit(
                'error',
                new Error(
                    'node-record-lpcm16 is not installed.\n' +
                    'Run: npm install node-record-lpcm16\n' +
                    'Also ensure SoX is on your PATH:\n' +
                    '  Windows: choco install sox.portable\n' +
                    '  macOS:   brew install sox',
                ),
            );
            return;
        }

        const outputPath = path.join(os.tmpdir(), `grokmode-${Date.now()}.wav`);
        this.writeStream = fs.createWriteStream(outputPath);

        this.recording = recorder.record({
            sampleRate: 16000,
            channels: 1,
            audioType: 'wav',
            recorder: 'sox',
            silence: String(this.silenceThreshold),
        });

        const stream = this.recording.stream();
        stream.on('error', (err: Error) => this.emit('error', err));
        stream.pipe(this.writeStream);

        this.writeStream.on('finish', () => {
            if (!this._stopped) {
                this.logger?.log(`Microphone: audio ready → ${outputPath}`);
                this.emit('audioReady', outputPath);
            }
            // Restart immediately for continuous mode
            if (this._continuous && !this._stopped) {
                setTimeout(() => this.captureOnce(), 200);
            }
        });
    }

    stop(): void {
        this.logger?.log('Microphone: stopped');
        this._stopped = true;
        this._continuous = false;
        this.recording?.stop();
        this.recording = undefined;
        this.writeStream?.end();
        this.writeStream = undefined;
    }

    dispose(): void {
        this.stop();
    }
}
