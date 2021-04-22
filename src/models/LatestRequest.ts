export const LATEST_REQUEST_TYPE = 'LATEST_REQUEST';

export interface LatestRequest {
    provider: string;
    id: string;
    type: 'LATEST_REQUEST';
}
