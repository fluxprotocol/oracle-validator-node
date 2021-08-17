import { Context, executeCode } from "@fluxprotocol/oracle-vm";
import { SuccessfulExecuteResult } from "../models/JobExecuteResult";
import { createMockRequest } from "../test/mocks/DataRequest";
import fetchStringJob, { executeFetchStringJob } from "./fetchStringJob";

describe('fetchStringJob', () => {
    it('should be able to get a string from an API', async () => {
        const request = createMockRequest({
            dataType: {
                type: 'string',
            },
            sources: [{
                end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                source_path: 'abilities[1].ability.name',
            }],
        });

        const executeResult = (await executeFetchStringJob(request)) as SuccessfulExecuteResult;
        expect(executeResult.data).toBe('imposter');
    });
});
