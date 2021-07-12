import fetch from 'node-fetch';
import { Code, Context, executeCode } from '@fluxprotocol/oracle-vm';

import DataRequest from "../models/DataRequest";
import { ExecuteResult, ExecuteResultType } from '../models/JobExecuteResult';
import logger from "../services/LoggerService";
import fetchNumberJob from '../jobs/fetchNumberJob';
import fetchStringJob from '../jobs/fetchStringJob';

const GAS_LIMIT = 100000;

export async function executeJob(request: DataRequest): Promise<ExecuteResult> {
    try {
        const sourceData = request.sources[0];
        const args: string[] = [sourceData.end_point, sourceData.source_path];
        let vmCode: Code;

        if (request.dataType.type === 'number') {
            args.push(request.dataType.multiplier);
            vmCode = fetchNumberJob;
        } else {
            vmCode = fetchStringJob;
        }

        const context = new Context(args);
        context.gasLimit = GAS_LIMIT;

        const executeResult = await executeCode(vmCode, { context });

        if (executeResult.code > 0) {
            return {
                status: executeResult.code,
                error: executeResult.message,
                type: ExecuteResultType.Error,
            }
        }

        return {
            type: ExecuteResultType.Success,
            data: executeResult.result ?? '',
            status: executeResult.code,
        }
    } catch (error) {
        logger.error(`[executeJob] ${error}`);

        return {
            status: 1,
            error: 'ERR_INTERNAL',
            type: ExecuteResultType.Error,
        }
    }
}
