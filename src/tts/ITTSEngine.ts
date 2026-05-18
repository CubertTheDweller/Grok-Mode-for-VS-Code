/** Contract for all text-to-speech engine implementations. */
export interface ITTSEngine {
    /** Speak the given text and resolve when audio playback is complete. */
    speak(text: string): Promise<void>;
    /** Immediately interrupt any in-progress speech. */
    stop(): void;
    dispose(): void;
}
