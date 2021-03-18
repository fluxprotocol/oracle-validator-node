import { BotOptions } from "../models/BotOptions";
import { DataRequestViewModel } from "../models/DataRequest";
import { JobExecuteResult } from "../models/JobExecuteResult";
import UniqueQueue from "../services/UniqueQueue";
import { executeJob } from "./JobExecuter";

export interface ProcessedRequest {
    request: DataRequestViewModel;
    result: JobExecuteResult<string>;
}

export default class JobQueue {
    queue: UniqueQueue<string, DataRequestViewModel> = new UniqueQueue();
    /** Currently processing request ids */
    processing: string[] = [];
    processedRequests: Map<string, ProcessedRequest> = new Map();

    get length() {
        return this.queue.length;
    }

    enqueue(item: DataRequestViewModel): void {
        // Items we already processed should not be processed again
        if (this.processedRequests.has(item.id)) {
            return;
        }

        // Currently processing ids should not be re-added
        if (this.processing.includes(item.id)) {
            return;
        }

        this.queue.enqueue(item.id, item);
    }

    dequeue(): DataRequestViewModel | null {
        return this.queue.dequeue();
    }

    /**
     * Process and execute all items in the queue
     *
     * @param {(item: ProcessedRequest) => void} onItemProcessed
     * @return {Promise<void>}
     * @memberof JobQueue
     */
    async process(onItemProcessed: (item: ProcessedRequest) => void): Promise<void> {
        while(this.queue.length > 0) {
            const request = this.queue.dequeue();
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
        }
    }
}
