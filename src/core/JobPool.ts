import { DataRequestViewModel } from "../models/DataRequest";
import { JobExecuteResult } from "../models/JobExecuteResult";
import { executeJob } from "./JobExecuter";

export interface ProcessedRequest {
    request: DataRequestViewModel;
    result: JobExecuteResult<string>;
}

export default class JobPool {
    public requests: DataRequestViewModel[] = [];
    /** Currently processing request ids */
    public processing: string[] = [];
    public processedRequests: Map<string, ProcessedRequest> = new Map();

    get length() {
        return this.requests.length;
    }

    addRequest(item: DataRequestViewModel): void {
        // Items we already processed should not be processed again
        if (this.processedRequests.has(item.id)) {
            return;
        }

        // Currently processing ids should not be re-added
        if (this.processing.includes(item.id)) {
            return;
        }

        // No duplicates
        if (this.requests.some(i => i.id === item.id)) {
            return;
        }

        this.requests.push(item);
    }

    shiftRequest(): DataRequestViewModel | undefined {
        return this.requests.shift();
    }

    /**
     * Process and execute all items in the queue
     *
     * @param {(item: ProcessedRequest) => void} onItemProcessed
     * @return {Promise<void>}
     * @memberof JobQueue
     */
    async process(onItemProcessed: (item: ProcessedRequest) => void): Promise<void> {
        const promises = this.requests.map(async () => {
            const request = this.shiftRequest();
            if (!request) return;

            this.processing.push(request.id);
            const jobResult = await executeJob(request);

            const item: ProcessedRequest = {
                request,
                result: jobResult,
            };

            this.processedRequests.set(request.id, item);
            const indexProcessing = this.processing.indexOf(request.id);
            this.processing.splice(indexProcessing, 1);

            onItemProcessed(item);
        });

        await Promise.all(promises);
    }
}
