import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import Database from "./DatabaseService";
import logger from "./LoggerService";

export const DATA_REQUEST_DB_PREFIX = 'data_request_';
export const DATA_REQUEST_TYPE = 'Request';

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
        logger.debug(`${dataRequest.internalId} - Storing in database`);
        await Database.createOrUpdateDocument(`${DATA_REQUEST_DB_PREFIX}${dataRequest.internalId}`, {
            ...dataRequest,
            type: DATA_REQUEST_TYPE,
        });
    } catch (error) {
        logger.error(`[storeDataRequest] ${error}`);
    }
}

export async function getAllDataRequests(query: PouchDB.Find.Selector = {}): Promise<DataRequest[]> {
    try {
        const requests = await Database.findDocuments<DataRequest>({
            selector: {
                ...query,
                type: DATA_REQUEST_TYPE,
            },
        });

        return requests.map((request) => ({
            ...request,
            resolutionWindows: request.resolutionWindows.map((rw) => ({
                ...rw,
                endTime: new Date(rw.endTime),
            })),
        }));
    } catch(error) {
        logger.error(`[getAllDataRequests] ${error}`);
        return [];
    }
}
