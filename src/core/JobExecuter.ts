import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';

import { ExecuteResult, ExecuteResultType } from '../models/JobExecuteResult';
import logger from "../services/LoggerService";
import { executeFetchNumberJob } from '../jobs/fetchNumberJob';
import { executeFetchStringJob } from '../jobs/fetchStringJob';
import sleep from '../utils/sleep';
import { INVALID_EXECUTION_RETRY_DELAY } from '../config';

export async function executeJob(request: DataRequest): Promise<ExecuteResult> {
    try {
        logger.debug(`${request.internalId} - Executing`);

        let result: ExecuteResult;

        if (request.dataType.type === 'number') {
            result = await executeFetchNumberJob(request);
        } else {
            result = await executeFetchStringJob(request);
        }

        if (result.type === ExecuteResultType.Error && result.error === 'ERR_INVALID_REQUEST') {
            // Might be that the API does not have the data yet.
            // In this case we should retry the request in x amount of time
            await sleep(INVALID_EXECUTION_RETRY_DELAY);

            if (request.dataType.type === 'number') {
                result = await executeFetchNumberJob(request);
            } else {
                result = await executeFetchStringJob(request);
            }
        }

        logger.debug(`${request.internalId} - Executed, results: ${JSON.stringify(result)}`);
        return result;
    } catch (error) {
        logger.error(`[executeJob] ${error}`);

        return {
            status: 1,
            error: 'ERR_INTERNAL',
            type: ExecuteResultType.Error,
        }
    }
}
