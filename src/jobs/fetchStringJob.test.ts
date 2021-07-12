import { Context, executeCode } from "@fluxprotocol/oracle-vm";
import fetchStringJob from "./fetchStringJob";

describe('fetchStringJob', () => {
    it('should be able to get a string from an API', async () => {
        const executeResult = await executeCode(fetchStringJob, {
            context: new Context([
                'https://pokeapi.co/api/v2/pokemon/ditto',
                'abilities[1].ability.name',
            ]),
        });

        expect(executeResult.result).toBe('imposter');
    });
});
