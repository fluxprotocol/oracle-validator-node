import fetch from 'node-fetch';
import { DataRequestViewModel } from "../models/DataRequest";
import { JobExecuteError, JobExecuteResult, JobResultType } from '../models/JobExecuteResult';
import logger from "../services/LoggerService";
import { isJson, pathToValue } from '../utils/jsonUtils';

export async function executeJob(request: DataRequestViewModel): Promise<JobExecuteResult<string>> {
    try {
        const response = await fetch(request.source);

        if (!response.ok) {
            return {
                status: response.status,
                error: JobExecuteError.ResponseNotOk,
                type: JobResultType.Error,
            }
        }

        const body = await response.text();

        if (!isJson(body)) {
            return {
                status: response.status,
                error: JobExecuteError.ResponseNotJson,
                type: JobResultType.Error,
            };
        }

        const parsedBody = JSON.parse(body);
        const value = pathToValue(request.sourcePath, parsedBody);

        return {
            status: response.status,
            data: value,
            type: JobResultType.Success,
        }
    } catch (error) {
        logger.error(error);

        return {
            status: 500,
            type: JobResultType.Error,
            error: JobExecuteError.Unknown,
        }
    }
}
