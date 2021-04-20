export enum OutcomeType {
    Answer,
    Invalid
}

export interface OutcomeAnswer {
    answer: string;
    type: OutcomeType.Answer;
}

export interface OutcomeInvalid {
    type: OutcomeType.Invalid;
}

export type Outcome = OutcomeAnswer | OutcomeInvalid;

export function transformToOutcome(outcome: string): Outcome {
    if (outcome === 'Invalid') {
        return {
            type: OutcomeType.Invalid,
        }
    }

    const answer = outcome.replace('Answer(', '');

    return {
        answer: answer.slice(0, -1),
        type: OutcomeType.Answer,
    };
}

export function isOutcomesEqual(a: Outcome, b: Outcome): boolean {
    if (a.type === OutcomeType.Invalid && b.type === OutcomeType.Invalid) {
        return true;
    }

    if (a.type === OutcomeType.Answer && b.type === OutcomeType.Answer) {
        if (a.answer === b.answer) {
            return true;
        }
    }

    return false;
}
