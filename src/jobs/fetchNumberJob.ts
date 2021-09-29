import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import { ExecuteResult, ExecuteResultType } from '../models/JobExecuteResult';
import fetch from 'node-fetch';
import Big from 'big.js';
import { DataRequestNumberDataType } from '../models/DataRequestDataType';
import { sumBig } from '../utils/bigUtils';
import valueAt from '../utils/valueAt';
import reduceExecuteResult from './reduceExecuteResult';
import { EXECUTE_AMOUNT, EXECUTE_INTERVAL } from '../config';
import sleep from '../utils/sleep';

async function executeNumberJobOnce(request: DataRequest): Promise<ExecuteResult> {
    try {
        const fetches = request.sources.map(async (source) => {
            const response = await fetch(source.end_point);
            const body = await response.json();
            const foundValue = valueAt(body, source.source_path);

            if (!foundValue) {
                throw new Error(`Could not find value at path ${source.source_path}`);
            }

            const dataType = request.dataType as DataRequestNumberDataType;
            return new Big(foundValue).mul(dataType.multiplier);
        });

        const fetchResults = await Promise.all(fetches);
        const result = sumBig(fetchResults).div(request.sources.length);

        return {
            type: ExecuteResultType.Success,
            data: result.toFixed(0),
            status: 0,
        }
    } catch (error: any) {
        return {
            status: 1,
            error: error?.message ?? JSON.stringify(error),
            type: ExecuteResultType.Error,
        }
    }
}

export async function executeFetchNumberJob(request: DataRequest): Promise<ExecuteResult> {
    try {
        if (request.dataType.type === 'string') {
            throw new Error('Only number requests are allowed');
        }

        const results: ExecuteResult[] = [];

        for await (const [index] of new Array(EXECUTE_AMOUNT).entries()) {
            results.push(await executeNumberJobOnce(request));

            if (index !== (EXECUTE_AMOUNT - 1)) await sleep(EXECUTE_INTERVAL);
        }

        return reduceExecuteResult(results);
    } catch (error: any) {
        return {
            status: 1,
            error: error?.message ?? JSON.stringify(error),
            type: ExecuteResultType.Error,
        }
    }
}
