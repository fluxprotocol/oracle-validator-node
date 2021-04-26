import { formatToken, toToken } from "./tokenUtils";

describe('tokenUtils', () => {
    describe('formatToken', () => {
        it('should format a token to a human readable format', () => {
            const result = formatToken('2500000000000000000');

            expect(result).toBe('2.50');
        });

        it('should format a token to a human readable format with 3 decimal points', () => {
            const result = formatToken('2512000000000000000', 18, 3);

            expect(result).toBe('2.512');
        });

        it('should format a token to a 0.00 when there is dust', () => {
            const result = formatToken('2500000000000000');

            expect(result).toBe('0.00');
        });

        it('should round down a token to a 0.00 when there is dust', () => {
            const result = formatToken('25000000000000000');

            expect(result).toBe('0.02');
        });
    });

    describe('toToken', () => {
        it('should convert 2.50 back to 18 decimals', () => {
            const result = toToken('2.50');

            expect(result).toBe('2500000000000000000');
        });

        it('should convert 0.250 back to 18 decimals', () => {
            const result = toToken('0.250');

            expect(result).toBe('250000000000000000');
        });

        it('should convert 0.000000000000000001 back to 18 decimals', () => {
            const result = toToken('0.000000000000000001');

            expect(result).toBe('1');
        });
    });
});
