import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import { VM_ENV_KEY } from "../config";
import ProviderRegistry from "../providers/ProviderRegistry";
import { storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";

export default class JobSearcher {
    visitedDataRequestIds: string[];
    providerRegistry: ProviderRegistry;
    stopped: boolean = true;

    constructor(providerRegistry: ProviderRegistry, visitedDataRequestIds: string[]) {
        this.providerRegistry = providerRegistry;
        this.visitedDataRequestIds = visitedDataRequestIds;
    }

    startSearch(onRequests: (dataRequests: DataRequest[]) => void) {
        this.stopped = false;
        this.providerRegistry.listenForRequests(async (requests) => {
            if (this.stopped) return;

            const eligibleRequests: DataRequest[] = [];

            requests.forEach((request) => {
                // We should not overwrite data requests that we already have
                if (this.visitedDataRequestIds.includes(request.internalId)) {
                    return;
                }

                // Requests that required certain api keys or env variables should only be
                // executed when we have those configured
                if (request.requiredEnvVariables.length) {
                    for (let index = 0; index < request.requiredEnvVariables.length; index++) {
                        const required = request.requiredEnvVariables[index];

                        if (!process.env[`${VM_ENV_KEY}${required}`]) {
                            return;
                        }
                    }
                }

                // Already finished data requests should not be processed
                if (request.finalizedOutcome) {
                    return;
                }

                // Validators can only resolve requests that have an api attached to it
                if (request.sources.length === 0) {
                    return;
                }

                // We can't resolve final arbitrator requests
                if (request.finalArbitratorTriggered) {
                    return;
                }

                eligibleRequests.push(request);
                this.visitedDataRequestIds.push(request.internalId);
            });

            logger.debug(`Found '${eligibleRequests.length}/${requests.length}' eligible requests`);

            const databasePromises = eligibleRequests.map((r) => storeDataRequest(r));
            await Promise.all(databasePromises);

            onRequests(eligibleRequests);
        });
    }

    stopSearch() {
        this.stopped = true;
    }
}
