import { JOB_SEARCH_INTERVAL } from "../config";
import DataRequest from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
import ProviderRegistry from "../providers/ProviderRegistry";
import { storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";

export default class JobSearcher {
    visitedDataRequestIds: string[];
    providerRegistry: ProviderRegistry;
    nodeOptions: NodeOptions;

    constructor(providerRegistry: ProviderRegistry, nodeOptions: NodeOptions, dataRequests: DataRequest[]) {
        this.providerRegistry = providerRegistry;
        this.nodeOptions = nodeOptions;
        this.visitedDataRequestIds = dataRequests.map(r => r.internalId);
    }

    search(onRequests: (dataRequests: DataRequest[]) => void) {
        this.providerRegistry.getDataRequests(async (requests) => {
            try {
                const eligibleRequests: DataRequest[] = [];

                requests.forEach((request) => {
                    // Contract ids that are not whitelisted should not be handled
                    if (this.nodeOptions.contractIds.length !== 0 && !this.nodeOptions.contractIds.includes(request.contractId)) {
                        return;
                    }

                    // We should not overwrite data requests that we already have
                    if (this.visitedDataRequestIds.includes(request.internalId)) {
                        return;
                    }

                    eligibleRequests.push(request);
                    this.visitedDataRequestIds.push(request.internalId);
                });

                const databasePromises = eligibleRequests.map((r) => storeDataRequest(r));
                await Promise.all(databasePromises);

                onRequests(eligibleRequests);
            } catch (error) {
                logger.error(`[JobSearcher.search] ${error}`);
            }
        });
    }

    startSearch(onRequests: (dataRequests: DataRequest[]) => void) {
        setInterval(() => {
            this.search(onRequests);
        }, JOB_SEARCH_INTERVAL);
    }
}
