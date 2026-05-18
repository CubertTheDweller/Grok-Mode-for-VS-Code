/** Contract for all speech-to-text engine implementations. */
export interface ISTTEngine {
    /** Transcribe a WAV audio file at 16 kHz mono and return the recognized text. */
    transcribe(audioPath: string): Promise<string>;
    dispose(): void;
}
