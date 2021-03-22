import Big from "big.js";
import { sortBig } from "./bigUtils";

describe('bigUtils', () => {
    describe('sortBig', () => {
        it('should sort big.js numbers from small to large', () => {
            const result = sortBig([new Big(1), new Big(100), new Big(-1), new Big(50)]);
            const resultAsString = result.map(a => a.toString());

            expect(resultAsString).toStrictEqual(['-1', '1', '50', '100']);
        });

        it('should sort big.js numbers from large to small when the option asc is false', () => {
            const result = sortBig([new Big(1), new Big(100), new Big(-1), new Big(50)], false);
            const resultAsString = result.map(a => a.toString());

            expect(resultAsString).toStrictEqual(['100', '50', '1', '-1']);
        });
    })
});
