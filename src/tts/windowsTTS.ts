import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ITTSEngine } from './ITTSEngine';

/**
 * Windows TTS via PowerShell System.Speech.
 * Uses a temp file to pass text so that no user content is ever interpolated
 * directly into the shell command string.
 */
export class WindowsTTS implements ITTSEngine {
    private currentProcess: ReturnType<typeof spawn> | undefined;

    async speak(text: string): Promise<void> {
        // Write text to a temp file — the file path is OS-controlled, no injection risk
        const tempFile = join(tmpdir(), `grokmode-tts-${Date.now()}.txt`);
        writeFileSync(tempFile, text, 'utf8');

        // Escape single quotes in the path for PowerShell string literal
        const safePath = tempFile.replace(/'/g, "''");
        const script = [
            'Add-Type -AssemblyName System.Speech;',
            `$t = [System.IO.File]::ReadAllText('${safePath}');`,
            '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;',
            '$s.Speak($t)',
        ].join(' ');

        return new Promise<void>((resolve, reject) => {
            // Use spawn with explicit arg array — no shell expansion of user content
            this.currentProcess = spawn('powershell', [
                '-NoProfile',
                '-NonInteractive',
                '-Command',
                script,
            ]);
            this.currentProcess.on('close', (code) => {
                try { unlinkSync(tempFile); } catch { /* ignore cleanup error */ }
                code === 0 ? resolve() : reject(new Error(`Windows TTS exited with code ${code}`));
            });
            this.currentProcess.on('error', (err) => {
                try { unlinkSync(tempFile); } catch { /* ignore */ }
                reject(err);
            });
        });
    }

    stop(): void {
        this.currentProcess?.kill();
        this.currentProcess = undefined;
    }

    dispose(): void {
        this.stop();
    }
}
