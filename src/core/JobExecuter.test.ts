import { isJobSuccesful } from "../models/JobExecuteResult";
import { executeJob } from "./JobExecuter";

describe('JobExecuter', () => {
    describe('executeJob', () => {
        it('should fetch the right property correctly', async () => {
            const result = await executeJob({
                source: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD',
                sourcePath: 'RAW.ETH.USD.VOLUME24HOUR',
            });

            expect(isJobSuccesful(result)).toBe(true);
        });
    });
});
