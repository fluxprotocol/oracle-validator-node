import { Code } from '@fluxprotocol/oracle-vm';
import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import at from 'lodash.at';
import { ExecuteResult, ExecuteResultType } from '../models/JobExecuteResult';
import fetch from 'node-fetch';
import Big from 'big.js';
import { DataRequestNumberDataType } from '../models/DataRequestDataType';
import { sumBig } from '../utils/bigUtils';
import valueAt from '../utils/valueAt';

const fetchNumberJob: Code = [
    // Parsing args
    ['ENV', '$args', 'args'],
    ['PARSE', '$url', '$args', '0', 'string'],
    ['PARSE', '$sourcePath', '$args', '1', 'string'],
    ['PARSE', '$multiplier', '$args', '2', 'u128'],

    // Fetching the API
    ['FETCH', '$fetchResult', '$url'],

    // Parsing result of API
    ['PARSE', '$number', '$fetchResult', '$sourcePath', 'double'],

    // Preparing for Negative/Positive checks
    ['VAR', '$zero', '0', 'u128'],
    ['VAR', '$negOne', '-1', 'i8'],

    ['LT', '$isNegative', '$number', '$zero'],
    ['GT', '$isPositive', '$number', '$zero'],

    // These will need to be changed each time you add an opcode
    ['VAR', '$POS_JUMP', '16', 'u8'],
    ['VAR', '$END_JUMP', '18', 'u8'],

    ['JUMPI', '$POS_JUMP', '$isPositive'],

    // Make negative number positive again
    ['MUL', '$number', '$number', '$negOne', 'double'],
    ['MUL', '$numberAnswer', '$number', '$multiplier', 'u256'],
    ['JUMP', '$END_JUMP'],

    // Number was already positive, we can skip conversion
    ['JUMPDEST'],
    ['MUL', '$numberAnswer', '$number', '$multiplier', 'u256'],

    // Continue execution
    ['JUMPDEST'],
    ['VAR', '$answer', '{ "negative": $isNegative, "value": "$numberAnswer", "multiplier": "$multiplier" }', 'string'],
    ['RETURN', '$answer'],
];

export default fetchNumberJob;

export async function executeFetchNumberJob(request: DataRequest): Promise<ExecuteResult> {
    try {
        if (request.dataType.type === 'string') {
            throw new Error('Only number requests are allowed');
        }

        const fetches = request.sources.map(async (source) => {
            const response = await fetch(source.end_point);
            const body = await response.json();
            const foundValues = valueAt(body, source.source_path);

            if (!foundValues) {
                throw new Error(`Could not find value at path ${source.source_path}`);
            }

            const dataType = request.dataType as DataRequestNumberDataType;
            return new Big(foundValues).mul(dataType.multiplier);
        });

        const fetchResults = await Promise.all(fetches);
        const result = sumBig(fetchResults).div(request.sources.length);

        return {
            type: ExecuteResultType.Success,
            data: JSON.stringify({
                negative: result.lt(0),
                value: result.toFixed(0),
                multiplier: request.dataType.multiplier,
            }),
            status: 0,
        }
    } catch (error) {
        return {
            status: 1,
            error: error?.message ?? JSON.stringify(error),
            type: ExecuteResultType.Error,
        }
    }
}
