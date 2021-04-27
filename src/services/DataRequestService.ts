import DataRequest, { DataRequestProps, DATA_REQUEST_TYPE } from "../models/DataRequest";
import { Outcome, OutcomeType } from "../models/DataRequestOutcome";
import { isJobSuccesful } from "../models/JobExecuteResult";
import { createOrUpdateDocument, deleteDocument, findDocuments } from "./DatabaseService";
import logger from "./LoggerService";

export const DATA_REQUEST_DB_PREFIX = 'data_request_';

export async function deleteDataRequest(dataRequest: DataRequest): Promise<void> {
    try {
        logger.debug(`${dataRequest.internalId} - Deleting from database`);
        await deleteDocument(`${DATA_REQUEST_DB_PREFIX}${dataRequest.internalId}`);
    } catch (error) {
        logger.error(`[deleteDataRequest] ${error}`);
    }
}

export async function storeDataRequest(dataRequest: DataRequest): Promise<void> {
    try {
        const convertedDataRequest = JSON.parse(dataRequest.toString());
        logger.debug(`${dataRequest.internalId} - Storing in database`);
        await createOrUpdateDocument(`${DATA_REQUEST_DB_PREFIX}${dataRequest.internalId}`, convertedDataRequest);
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
 * @return {JobExecuteResult<Outcome>}
 */
export function getDataRequestAnswer(dataRequest: DataRequest): Outcome {
    const latestExecuteResults = dataRequest.executeResults[dataRequest.executeResults.length - 1];
    const result = latestExecuteResults.results[0];

    if (!result || !isJobSuccesful(result)) {
        return {
            type: OutcomeType.Invalid,
        };
    }

    return {
        type: OutcomeType.Answer,
        answer: result.data,
    };
}
