import { EventEmitter } from 'events';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

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

    constructor(silenceThreshold = 1.5) {
        super();
        this.silenceThreshold = silenceThreshold;
    }

    /** Start continuous listening — restarts after each utterance until stop() is called. */
    startContinuous(): void {
        this._continuous = true;
        this._stopped = false;
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
                this.emit('audioReady', outputPath);
            }
            // Restart immediately for continuous mode
            if (this._continuous && !this._stopped) {
                setTimeout(() => this.captureOnce(), 200);
            }
        });
    }

    stop(): void {
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
