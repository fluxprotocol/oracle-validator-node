import { DataRequestViewModel } from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
import ProviderRegistry from "../providers/ProviderRegistry";

export function loadJobs(
    providerRegistry: ProviderRegistry,
    nodeOptions: NodeOptions,
    onRequests: (requests: DataRequestViewModel[], providerId: string) => void,
): void {
    providerRegistry.getDataRequests((requests, providerId) => {
        const eligibleRequests: DataRequestViewModel[] = [];

        requests.forEach((request) => {
            // Contract ids that are not whitelisted should not be handled
            if (nodeOptions.contractIds.length !== 0 && !nodeOptions.contractIds.includes(request.contractId)) {
                return;
            }

            eligibleRequests.push(request);
        });

        onRequests(eligibleRequests, providerId);
    });
}
