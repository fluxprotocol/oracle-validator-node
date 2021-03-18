import { isJobSuccesful } from "../models/JobExecuteResult";
import { executeJob } from "./JobExecuter";

describe('JobExecuter', () => {
    describe('executeJob', () => {
        it('should fetch the right property correctly', async () => {
            const result = await executeJob({
                id: '1',
                source: 'https://pokeapi.co/api/v2/pokemon/ditto',
                sourcePath: 'abilities[0].ability.name',
                outcomes: ['limber', 'forest'],
                challengeRound: 0,
            });

            expect(isJobSuccesful(result)).toBe(true);
        });
    });
});
