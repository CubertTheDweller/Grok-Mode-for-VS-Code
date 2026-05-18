import { spawn } from 'child_process';
import type { ITTSEngine } from './ITTSEngine';

/**
 * macOS TTS via the built-in `say` command.
 * Uses spawn with an explicit argument array to avoid any shell injection.
 */
export class MacTTS implements ITTSEngine {
    private currentProcess: ReturnType<typeof spawn> | undefined;

    async speak(text: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Pass text as a direct argument — spawn does not invoke a shell
            this.currentProcess = spawn('say', [text]);
            this.currentProcess.on('close', (code) => {
                code === 0 ? resolve() : reject(new Error(`say exited with code ${code}`));
            });
            this.currentProcess.on('error', reject);
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
