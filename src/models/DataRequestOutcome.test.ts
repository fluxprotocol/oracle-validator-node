import { transformToOutcome, OutcomeType, OutcomeAnswer, isOutcomesEqual } from "./DataRequestOutcome";

describe('DataRequestOutcome', () => {
    describe('transformToOutcome', () => {
        it('should transform a Invalid string to an invalid outcome', () => {
            const outcome = transformToOutcome('Invalid');

            expect(outcome.type).toBe(OutcomeType.Invalid);
        });

        it('should transform a Answer(answer) string to an valid outcome', () => {
            const outcome = transformToOutcome('Answer(answer)');

            expect(outcome.type).toBe(OutcomeType.Answer);
            expect((outcome as OutcomeAnswer).answer).toBe('answer');
        });

        it('should transform a Answer(Invalid) string to an valid outcome', () => {
            const outcome = transformToOutcome('Answer(Invalid)');

            expect(outcome.type).toBe(OutcomeType.Answer);
            expect((outcome as OutcomeAnswer).answer).toBe('Invalid');
        });
    });

    describe('isOutcomesEqual', () => {
        it('should return true when both are invalid', () => {
            const result = isOutcomesEqual({ type: OutcomeType.Invalid }, { type: OutcomeType.Invalid });

            expect(result).toBe(true);
        });

        it('should return false when one outcome is invalid', () => {
            const result = isOutcomesEqual({ type: OutcomeType.Invalid }, { type: OutcomeType.Answer, answer: 'test' });

            expect(result).toBe(false);
        });

        it('should return true when both outcome have the same answer', () => {
            const result = isOutcomesEqual({ type: OutcomeType.Answer, answer: 'test' }, { type: OutcomeType.Answer, answer: 'test' });

            expect(result).toBe(true);
        });

        it('should return false when both outcome have an answer but different strings', () => {
            const result = isOutcomesEqual({ type: OutcomeType.Answer, answer: 'test' }, { type: OutcomeType.Answer, answer: 'test2' });

            expect(result).toBe(false);
        });
    });
});
