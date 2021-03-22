import Big from "big.js";
import { sortDataRequestOnFees } from "./DataRequestService";

describe('DataRequestService', () => {
    describe('sortDataRequestOnFees', () => {
        it('should sort the requests based on fees descending', () => {
            const result = sortDataRequestOnFees([
                {
                    fees: new Big(5),
                    id: '1',
                    rounds: [],
                    source: '',
                    sourcePath: '',
                },
                {
                    fees: new Big(1),
                    id: '2',
                    rounds: [],
                    source: '',
                    sourcePath: '',
                },
                {
                    fees: new Big(10),
                    id: '3',
                    rounds: [],
                    source: '',
                    sourcePath: '',
                },
            ]);

            expect(result[0].id).toBe('3');
            expect(result[1].id).toBe('1');
            expect(result[2].id).toBe('2');
        });
    });
});
