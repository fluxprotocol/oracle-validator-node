import { Near } from "near-api-js";
import { getDataRequests } from "../contracts/OracleContract";
import { DataRequestViewModel } from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";

interface LoadJobsParams {
    near: Near,
    nodeOptions: NodeOptions;
}

export async function loadJobs(params: LoadJobsParams): Promise<DataRequestViewModel[]> {
    const { near, nodeOptions } = params;
    const requests = await getDataRequests(near);
    const eligibleRequests: DataRequestViewModel[] = [];

    requests.forEach((request) => {
        const currentRound = request.rounds.length - 1;

        if (currentRound > nodeOptions.maximumChallengeRound) {
            return;
        }

        // Contract ids that are not whitelisted should not be handled
        if (nodeOptions.contractIds.length !== 0 && !nodeOptions.contractIds.includes(request.contractId)) {
            return;
        }

        eligibleRequests.push(request);
    });

    return eligibleRequests;
}
