import { DB_TABLE_DATA_REQUESTS } from '@fluxprotocol/oracle-provider-core/dist/Core';
import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import Database from "./DatabaseService";
import logger from "./LoggerService";


export async function deleteDataRequest(dataRequest: DataRequest): Promise<void> {
    try {
        logger.debug(`${dataRequest.internalId} - Deleting from database`);
        await Database.deleteDocument(DB_TABLE_DATA_REQUESTS, dataRequest.internalId);
    } catch (error) {
        logger.error(`[deleteDataRequest] ${error}`);
    }
}

export async function storeDataRequest(dataRequest: DataRequest): Promise<void> {
    try {
        logger.debug(`${dataRequest.internalId} - Storing in database`);
        await Database.createOrUpdateDocument(DB_TABLE_DATA_REQUESTS, dataRequest.internalId, dataRequest);
    } catch (error) {
        logger.error(`[storeDataRequest] ${error}`);
    }
}

export async function getAllDataRequests(): Promise<DataRequest[]> {
    try {
        const requests = await Database.getAllFromTable<DataRequest>(DB_TABLE_DATA_REQUESTS);

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
