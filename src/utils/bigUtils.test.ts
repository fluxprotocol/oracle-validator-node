import Big from "big.js";
import { sumBig } from "./bigUtils";

describe('bigUtils', () => {
    describe('sumBig', () => {
        it('should sum all numbers and return 1 num', () => {
            const result = sumBig([
                new Big(10),
                new Big(25),
                new Big(12),
            ]);

            expect(result.toString()).toBe('47');
        });
    });
});
