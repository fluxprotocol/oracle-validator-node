import Big from "big.js";
import DataRequest, { createMockRequest } from "../models/DataRequest";
import { isJobSuccesful } from "../models/JobExecuteResult";
import { executeJob } from "./JobExecuter";

describe('JobExecuter', () => {
    describe('executeJob', () => {
        it('should fetch the right property correctly', async () => {
            const result = await executeJob(createMockRequest({
                id: '1',
                sources:[
                    {
                        end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                        source_path: 'abilities[0].ability.name',
                    }
                ],
                outcomes: ['limber', 'forest'],
            }));

            expect(isJobSuccesful(result[0])).toBe(true);
        });
    });
});
