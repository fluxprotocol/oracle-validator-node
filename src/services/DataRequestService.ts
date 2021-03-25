import DataRequest, { DataRequestViewModel, DATA_REQUEST_TYPE } from "../models/DataRequest";
import { createDocument, findDocumentById, findDocuments } from "./DatabaseService";
import logger from "./LoggerService";

export const DATA_REQUEST_DB_PREFIX = 'data_request_';

export async function storeDataRequest(dataRequest: DataRequest) {
    await createDocument(`${DATA_REQUEST_DB_PREFIX}${dataRequest.id}`, JSON.parse(dataRequest.toString()));
}

export async function getAllDataRequests(): Promise<DataRequest[]> {
    try {
        const requests = await findDocuments<DataRequestViewModel>({
            selector: {
                type: DATA_REQUEST_TYPE,
            }
        });

        return requests.map(r => DataRequest.fromString(JSON.stringify(r)));
    } catch(error) {
        logger.error(`[getAllDataRequests] ${error}`);
        return [];
    }
}

