import { Context, executeCode } from "@fluxprotocol/oracle-vm";
import fetchNumberJob from "./fetchNumberJob";

describe('fetchNumberJob', () => {
    it('should be able to generate a positive answer used in staking', async () => {
        const executeResult = await executeCode(fetchNumberJob, {
            context: new Context([
                'https://pokeapi.co/api/v2/pokemon/ditto',
                'weight',
                '1000'
            ]),
        });

        const result = JSON.parse(executeResult.result ?? '{}');

        expect(result.negative).toBe(false);
        expect(result.value).toBe('40000');
        expect(result.multiplier).toBe('1000');
    });
});
