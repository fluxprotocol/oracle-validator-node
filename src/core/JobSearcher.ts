import { JOB_SEARCH_INTERVAL } from "../config";
import DataRequest from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
import ProviderRegistry from "../providers/ProviderRegistry";
import { storeDataRequest } from "../services/DataRequestService";

export default class JobSearcher {

    private visitedDataRequestIds: string[];
    private providerRegistry: ProviderRegistry;
    private nodeOptions: NodeOptions;

    constructor(providerRegistry: ProviderRegistry, nodeOptions: NodeOptions, dataRequests: DataRequest[]) {
        this.providerRegistry = providerRegistry;
        this.nodeOptions = nodeOptions;
        this.visitedDataRequestIds = dataRequests.map(r => r.internalId);
    }

    private search(onRequests: (dataRequests: DataRequest[]) => void) {
        this.providerRegistry.getDataRequests(async (requests) => {
            const eligibleRequests: DataRequest[] = [];

            requests.forEach(async (request) => {
                // Contract ids that are not whitelisted should not be handled
                if (this.nodeOptions.contractIds.length !== 0 && !this.nodeOptions.contractIds.includes(request.contractId)) {
                    return;
                }

                // We should not overwrite data requests that we already have
                if (this.visitedDataRequestIds.includes(request.internalId)) {
                    return;
                }

                eligibleRequests.push(request);
            });

            const databasePromises = requests.map((request) => storeDataRequest(request));
            await Promise.all(databasePromises);
            onRequests(eligibleRequests);
        });
    }

    startSearch(onRequests: (dataRequests: DataRequest[]) => void) {
        setInterval(() => {
            this.search(onRequests);
        }, JOB_SEARCH_INTERVAL);
    }
}
