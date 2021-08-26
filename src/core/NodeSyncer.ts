import DataRequest, { isRequestDeletable } from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import Big from 'big.js';
import { LatestRequest } from "../models/LatestRequest";
import ProviderRegistry from "../providers/ProviderRegistry";
import Database, { TABLE_SYNC } from "../services/DatabaseService";
import { storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";

export async function getLatestDataRequests(): Promise<LatestRequest[]> {
    const latestRequests = await Database.getAllFromTable<LatestRequest>(TABLE_SYNC);
    return latestRequests;
}

export async function storeLatestDataRequest(latestRequest: LatestRequest) {
    await Database.createOrUpdateDocument(TABLE_SYNC, `${latestRequest.provider}_latest_request`, latestRequest);
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
        };

        // We should always have atleast 1 latest request
        if (!latestRequest) {
            logger.debug(`${dataRequest.internalId} - no latest request found, setting it to this one`);
            this.latestDataRequests.set(doc.provider, doc);
            await storeLatestDataRequest(doc);
            return;
        }

        // The request is only newer when the request id is higher
        if (new Big(latestRequest.id).gt(dataRequest.id)) {
            return;
        }

        logger.debug(`${dataRequest.internalId} - is latest request for provider`);
        this.latestDataRequests.set(doc.provider, doc);
        await storeLatestDataRequest(doc);
    }

    async syncNode(): Promise<void> {
        try {
            const storePromises: Promise<void>[] = [];
            // TODO: This only stores the latest data request but does not take providers into account
            let lastDataRequest: DataRequest | undefined;

            const syncPromises = this.providerRegistry.providers.map(async (provider) => {
                const latestRequest = this.latestDataRequests.get(provider.id);
                const latestRequestId = latestRequest?.id;

                logger.info(`🔄 Syncing for ${provider.id} starting from request id ${latestRequestId ?? '0'}`);

                await provider.sync(latestRequestId, (request) => {
                    lastDataRequest = request;

                    if (!request.sources.length) {
                        return;
                    }

                    if (isRequestDeletable(request)) {
                        return;
                    }

                    // We push rather than wait due the async nature of getting data requests
                    // We could end up with a data request being slower to store than the last request coming in
                    storePromises.push(storeDataRequest(request));
                });

                logger.info(`✅ Syncing completed for ${provider.id}`);
            });

            // First wait for every single provider to complete it's duty
            await Promise.all(syncPromises);

            // Then wait for all database stores to complete
            await Promise.all(storePromises);

            if (lastDataRequest) {
                await this.updateLatestDataRequest(lastDataRequest);
            }
        } catch (error) {
            logger.error(`❌ Syncing node error ${error}`);
        }
    }
}
