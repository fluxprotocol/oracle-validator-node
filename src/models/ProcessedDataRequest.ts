import { JobExecuteResult } from "./JobExecuteResult";

export const PROCESSED_DATA_REQUEST_TYPE = 'ProcessedDataRequest';

export interface ProcessedDataRequest {
    id: string;
    result: JobExecuteResult<string>;
    type: 'ProcessedDataRequest';
}
