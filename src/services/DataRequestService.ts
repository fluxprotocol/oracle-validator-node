import DataRequest, { DataRequestProps, DATA_REQUEST_TYPE } from "../models/DataRequest";
import { isJobSuccesful } from "../models/JobExecuteResult";
import { createOrUpdateDocument, findDocuments } from "./DatabaseService";
import logger from "./LoggerService";

export const DATA_REQUEST_DB_PREFIX = 'data_request_';

export async function storeDataRequest(dataRequest: DataRequest): Promise<void> {
    try {
        const convertedDataRequest = JSON.parse(dataRequest.toString());
        return createOrUpdateDocument(`${DATA_REQUEST_DB_PREFIX}${dataRequest.id}`, convertedDataRequest);
    } catch (error) {
        logger.error(`[storeDataRequest] ${error}`);
    }
}

export async function getAllDataRequests(query: PouchDB.Find.Selector = {}): Promise<DataRequest[]> {
    try {
        const requests = await findDocuments<DataRequestProps>({
            selector: {
                ...query,
                type: DATA_REQUEST_TYPE,
            },
        });

        return requests.map(r => new DataRequest(r));
    } catch(error) {
        logger.error(`[getAllDataRequests] ${error}`);
        return [];
    }
}

/**
 * Gets the data request answer
 * This should always be used as the real answer that will be submitted to
 * the Oracle.
 * TODO: Add number calculations (price feed, average, etc.)
 *
 * @export
 * @param {DataRequest} dataRequest
 * @return {JobExecuteResult<string>}
 */
export function getDataRequestAnswer(dataRequest: DataRequest): string | undefined {
    const latestExecuteResults = dataRequest.executeResults[dataRequest.executeResults.length - 1];
    const result = latestExecuteResults.results[0];

    if (!result || !isJobSuccesful(result)) {
        return undefined;
    }

    return result.data;
}
