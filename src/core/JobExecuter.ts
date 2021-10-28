import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import { ExecuteResult, ExecuteResultType } from '@fluxprotocol/oracle-provider-core/dist/ExecuteResult';
import logger from "../services/LoggerService";
import sleep from '../utils/sleep';
import { INVALID_EXECUTION_RETRY_DELAY } from '../config';
import executeWasmJob from '../jobs/executeWasmJob';

export async function executeJob(request: DataRequest): Promise<ExecuteResult> {
    try {
        logger.debug(`${request.internalId} - Executing`);

        let result: ExecuteResult = await executeWasmJob(request);

        if (result.type === ExecuteResultType.Error) {
            logger.debug(`${request.internalId} - Request executed with error: ${result.error}`);
        }

        if (result.type === ExecuteResultType.Error && result.error === 'ERR_INVALID_REQUEST') {
            // Might be that the API does not have the data yet.
            // In this case we should retry the request in x amount of time
            logger.debug(`${request.internalId} - Retry execution in ${INVALID_EXECUTION_RETRY_DELAY}ms due api outage`);
            await sleep(INVALID_EXECUTION_RETRY_DELAY);
            logger.debug(`${request.internalId} - Retrying execution now`);

            result = await executeWasmJob(request);

            if (result.type === ExecuteResultType.Error) {
                logger.debug(`${request.internalId} - Retry was still unsuccessful: ${result.error}`);
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
