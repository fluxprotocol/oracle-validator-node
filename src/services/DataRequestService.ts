import DataRequest, { DataRequestProps, DATA_REQUEST_TYPE } from "../models/DataRequest";
import Database from "./DatabaseService";
import logger from "./LoggerService";

export const DATA_REQUEST_DB_PREFIX = 'data_request_';

export async function deleteDataRequest(dataRequest: DataRequest): Promise<void> {
    try {
        logger.debug(`${dataRequest.internalId} - Deleting from database`);
        await Database.deleteDocument(`${DATA_REQUEST_DB_PREFIX}${dataRequest.internalId}`);
    } catch (error) {
        logger.error(`[deleteDataRequest] ${error}`);
    }
}

export async function storeDataRequest(dataRequest: DataRequest): Promise<void> {
    try {
        const convertedDataRequest = JSON.parse(dataRequest.toString());
        logger.debug(`${dataRequest.internalId} - Storing in database`);

        await Database.createOrUpdateDocument(`${DATA_REQUEST_DB_PREFIX}${dataRequest.internalId}`, convertedDataRequest);
    } catch (error) {
        logger.error(`[storeDataRequest] ${error}`);
    }
}

export async function getAllDataRequests(query: PouchDB.Find.Selector = {}): Promise<DataRequest[]> {
    try {
        const requests = await Database.findDocuments<DataRequestProps>({
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
