import DataRequest from "../models/DataRequest";
import { LatestRequest, LATEST_REQUEST_TYPE } from "../models/LatestRequest";
import ProviderRegistry from "../providers/ProviderRegistry";
import { createOrUpdateDocument, findDocuments } from "../services/DatabaseService";
import { storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";

export async function getLatestDataRequests(): Promise<LatestRequest[]> {
    const latestRequests = await findDocuments<LatestRequest>({
        selector: {
            type: LATEST_REQUEST_TYPE,
        }
    });

    return latestRequests;
}

export async function storeLatestDataRequest(latestRequest: LatestRequest) {
    await createOrUpdateDocument(latestRequest.provider, latestRequest);
}

export default class NodeSyncer {
    providerRegistry: ProviderRegistry;
    latestDataRequests: Map<string, LatestRequest> = new Map();

    constructor(providerRegistry: ProviderRegistry) {
        this.providerRegistry = providerRegistry;
    }

    async init() {
        const latestRequests = await getLatestDataRequests();
        latestRequests.forEach((request) => {
            this.latestDataRequests.set(request.provider, request);
        });
    }

    async updateLatestDataRequest(dataRequest: DataRequest) {
        const latestRequest = this.latestDataRequests.get(dataRequest.providerId);
        const doc: LatestRequest = {
            id: dataRequest.id,
            provider: dataRequest.providerId,
            type: LATEST_REQUEST_TYPE,
        };

        // We should always have atleast 1 latest request
        if (!latestRequest) {
            logger.debug(`${dataRequest.internalId} - no latest request found`);
            this.latestDataRequests.set(doc.provider, doc);
            await storeLatestDataRequest(doc);
            return;
        }

        // The request is only newer when the request id is higher
        if (Number(latestRequest.id) > Number(dataRequest.id)) {
            return;
        }

        logger.debug(`${dataRequest.internalId} - is latest request for provider`);
        this.latestDataRequests.set(doc.provider, doc);
        await storeLatestDataRequest(doc);
    }

    async syncNode(): Promise<void> {
        try {
            const storePromises: Promise<void>[] = [];

            const syncPromises = this.providerRegistry.providers.map(async (provider) => {
                const latestRequest = this.latestDataRequests.get(provider.id);
                const latestRequestId = latestRequest?.id ?? '0';

                logger.info(`🔄 Syncing for ${provider.id} starting from request id ${latestRequestId}`);

                await provider.sync(latestRequestId, (request) => {
                    // We push rather than wait due the async nature of getting data requests
                    // We could end up with a data request being slower to store than the last request coming in
                    storePromises.push(storeDataRequest(request));

                    // We also want to update our latest request pointer
                    storePromises.push(this.updateLatestDataRequest(request));
                });

                logger.info(`✅ Syncing completed for ${provider.id}`);
            });

            // First wait for every single provider to complete it's duty
            await Promise.all(syncPromises);

            // Then wait for all database stores to complete
            await Promise.all(storePromises);
        } catch (error) {
            logger.error(`❌ Syncing node error ${error}`);
        }
    }
}
