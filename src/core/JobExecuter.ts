import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';

import { ExecuteResult, ExecuteResultType } from '../models/JobExecuteResult';
import logger from "../services/LoggerService";
import { executeFetchNumberJob } from '../jobs/fetchNumberJob';
import { executeFetchStringJob } from '../jobs/fetchStringJob';

const GAS_LIMIT = 1_000_000;

export async function executeJob(request: DataRequest): Promise<ExecuteResult> {
    try {
        logger.debug(`${request.internalId} - Executing`);

        let result: ExecuteResult;

        if (request.dataType.type === 'number') {
            result = await executeFetchNumberJob(request);
        } else {
            result = await executeFetchStringJob(request);
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
