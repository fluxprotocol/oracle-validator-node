import Big from "big.js";
import { DataRequestViewModel } from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";

export interface DataRequestStakeResponse {
    amountBack: Big;
    success: boolean;
}

export interface DataRequestFinalizeClaimResponse {
    received: string;
}

export interface Provider {
    providerName: string;
    id: string;

    init(options: NodeOptions): Promise<void>;

    getTokenBalance(): Promise<Big>;
    getDataRequestById(requestId: string): Promise<DataRequestViewModel | null>;
    getDataRequests(): Promise<DataRequestViewModel[]>;
    stake(): Promise<DataRequestStakeResponse>;
    claim(requestId: string): Promise<DataRequestFinalizeClaimResponse>;
}
