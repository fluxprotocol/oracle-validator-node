import { Context, executeCode } from "@fluxprotocol/oracle-vm";
import { ExecuteResultType } from "../models/JobExecuteResult";
import { createMockRequest } from "../test/mocks/DataRequest";
import fetchNumberJob, { executeFetchNumberJob } from "./fetchNumberJob";

describe('fetchNumberJob', () => {
    it('should be able to generate a positive answer used in staking', async () => {
        const request = createMockRequest({
            dataType: {
                type: 'number',
                multiplier: '1000'
            },
            sources: [
                {
                    end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                    source_path: 'weight',
                },
                {
                    end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                    source_path: 'weight',
                },
                {
                    end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                    source_path: 'weight',
                }
            ],
        });

        const executeResult = await executeFetchNumberJob(request);
        const result = JSON.parse(executeResult.type === ExecuteResultType.Success ? executeResult.data.toString() : '{}');

        expect(result.negative).toBe(false);
        expect(result.value).toBe('40000');
        expect(result.multiplier).toBe('1000');
    });
});
