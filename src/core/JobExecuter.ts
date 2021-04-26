import fetch from 'node-fetch';
import DataRequest, { RequestInfo } from "../models/DataRequest";
import { isJobSuccesful, JobExecuteError, JobExecuteResult, JobResultType } from '../models/JobExecuteResult';
import logger from "../services/LoggerService";
import { parseJson, pathToValue } from '../utils/jsonUtils';

/**
 * Fetches the JSON data from the given API
 *
 * @param {RequestInfo} requestInfo
 * @return {Promise<JobExecuteResult<string>>}
 */
async function fetchJobData(requestInfo: RequestInfo): Promise<JobExecuteResult<object>> {
    try {
        const response = await fetch(requestInfo.end_point);

        if (!response.ok) {
            return {
                status: response.status,
                error: JobExecuteError.ResponseNotOk,
                type: JobResultType.Error,
            }
        }

        const body = await response.text();
        const parsedBody = parseJson(body);

        if (parsedBody === null) {
            return {
                status: response.status,
                error: JobExecuteError.ResponseNotJson,
                type: JobResultType.Error,
            };
        }

        return {
            status: response.status,
            data: parsedBody,
            type: JobResultType.Success,
        }
    } catch (error) {
        logger.error(`[fetchJobData] ${error}`);

        return {
            status: 500,
            type: JobResultType.Error,
            error: JobExecuteError.Unknown,
        }
    }
}

export function resolveJobData(request: DataRequest, requestInfo: RequestInfo, parsedBody: object): JobExecuteResult<string> {
    const value = pathToValue(requestInfo.source_path, parsedBody);

    if (value === null) {
        return {
            status: 500,
            error: JobExecuteError.ValueDoesNotExist,
            type: JobResultType.Error,
        }
    }

    // Validate if this value is one of the outcomes (if used)
    if (request.outcomes && request.outcomes.length) {
        if (!request.outcomes.includes(value)) {
            return {
                status: 500,
                error: JobExecuteError.ValueNotInOutcomes,
                type: JobResultType.Error,
            };
        }
    }

    return {
        status: 200,
        data: value,
        type: JobResultType.Success,
    };
}

export async function executeJob(request: DataRequest): Promise<JobExecuteResult<string>[]> {
    try {
        const promises = request.sources.map(async (requestInfo) => {
            const fetchResult = await fetchJobData(requestInfo);

            // No need to process an fetch result that is not valid
            if (!isJobSuccesful(fetchResult)) {
                return fetchResult;
            }

            return resolveJobData(request, requestInfo, fetchResult.data);
        });

        const result = await Promise.all(promises);
        return result;
    } catch (error) {
        logger.error(`[executeJob] ${error}`);

        return [{
            status: 500,
            error: JobExecuteError.Unknown,
            type: JobResultType.Error,
        }]
    }
}
