/**
 * Optional hotword filter.
 *
 * When a hotword is configured (e.g. "hey copilot"), only transcripts that
 * begin with the hotword are forwarded to the router. The hotword prefix is
 * stripped before routing.
 *
 * Leave `grokMode.hotword` empty to disable filtering and route all speech.
 */
export class HotwordFilter {
    private readonly hotword: string;

    constructor(hotword = '') {
        this.hotword = hotword.toLowerCase().trim();
    }

    /**
     * Returns the command text with the hotword stripped, or `null` if the
     * hotword is configured and the transcript does not start with it.
     */
    filter(transcript: string): string | null {
        if (!this.hotword) {
            // Hotword disabled — pass everything through
            return transcript.trim();
        }

        const lower = transcript.toLowerCase().trim();
        if (lower.startsWith(this.hotword)) {
            return transcript.trim().slice(this.hotword.length).trim();
        }

        return null;
    }

    get isEnabled(): boolean {
        return this.hotword.length > 0;
    }
}
