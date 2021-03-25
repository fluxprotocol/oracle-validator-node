import { JOB_WALKER_INTERVAL } from "../config";
import DataRequest from "../models/DataRequest";

export default class JobWalker {
    requests: DataRequest[];
    processingIds: string[] = [];

    constructor(initialRequests: DataRequest[] = []) {
        this.requests = initialRequests;
    }

    async addNewDataRequest(request: DataRequest) {
        await request.execute();
        await request.stakeOrChallenge();
        // Then stake/challenge it
        // Then add it to the database
        // Then add it to the requests pool
    }

    private async walkRequest(request: DataRequest) {
        // Check status of request
        // If finalizable, finalize it
        // If claimable, claim it
        // If challenged rexecute etc.
    }

    startWalker() {
        setInterval(() => {
            this.requests.forEach(async (request) => {
                // Request is already being processed
                if (this.processingIds.includes(request.internalId)) {
                    return;
                }

                this.processingIds.push(request.internalId);
                await this.walkRequest(request);

                // Let the next loop know we are ready to be processed again
                // We can't trust the forEach index, because it could be gone by the time we processed it
                const index = this.processingIds.findIndex(id => id === request.internalId);
                this.processingIds.splice(index, 1);
            });
        }, JOB_WALKER_INTERVAL);
    }
}
