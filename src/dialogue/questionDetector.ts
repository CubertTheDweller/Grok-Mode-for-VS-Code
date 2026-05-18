/** The semantic type detected in a Copilot response. */
export type ResponseType = 'question' | 'confirmation' | 'plan' | 'action' | 'statement';

export interface DetectedResponse {
    type: ResponseType;
    content: string;
}

// Ordered most-specific → least-specific so that a confirmation isn't mis-classified as a question
const CONFIRMATION_PATTERNS: RegExp[] = [
    /(shall i|should i|want me to|would you like me to|ready to proceed|confirm|proceed\?)/i,
];

const QUESTION_PATTERNS: RegExp[] = [
    /\?(\s*)$/m,
    /^(what|which|how|where|when|why|should|would|could|do you|are you|can you|will you)\b/im,
];

const PLAN_PATTERNS: RegExp[] = [
    /^(here[''']?s? (the|my) plan|i (suggest|propose|recommend|would suggest))\b/im,
    /^(step 1|step one|first[,:]?\s)/im,
];

const ACTION_PATTERNS: RegExp[] = [
    /^(creating|modifying|deleting|updating|adding|removing|refactoring|running|executing|writing|done|complete)[^\n]*/im,
];

/**
 * Classifies a Copilot response to drive Dialogue Manager behaviour:
 *  - question / confirmation → keep mic open for user reply
 *  - plan                   → speak plan, wait for confirmation
 *  - action                 → narrate progress, return to idle after
 *  - statement              → speak, return to idle
 */
export class QuestionDetector {
    detect(text: string): DetectedResponse {
        if (CONFIRMATION_PATTERNS.some((p) => p.test(text))) {
            return { type: 'confirmation', content: text };
        }
        if (QUESTION_PATTERNS.some((p) => p.test(text))) {
            return { type: 'question', content: text };
        }
        if (PLAN_PATTERNS.some((p) => p.test(text))) {
            return { type: 'plan', content: text };
        }
        if (ACTION_PATTERNS.some((p) => p.test(text))) {
            return { type: 'action', content: text };
        }
        return { type: 'statement', content: text };
    }
}
