import Big from "big.js";
import { ClaimResult } from "../models/ClaimResult";
import DataRequest from "../models/DataRequest";
import { Outcome } from "../models/DataRequestOutcome";
import { NodeOptions } from "../models/NodeOptions";

export interface StakeResponse {
    amountBack: Big;
    success: boolean;
}

export interface Provider {
    providerName: string;
    id: string;

    validateOptions(options: NodeOptions, providerConfig: any): string[];
    init(options: NodeOptions): Promise<void>;

    getTokenBalance(): Promise<Big>;
    getDataRequestById(requestId: string): Promise<DataRequest | null>;
    listenForRequests(onRequests: (requests: DataRequest[]) => void): void;

    stake(requestId: string, answer: Outcome, stakeAmount: string): Promise<StakeResponse>;
    claim(requestId: string): Promise<ClaimResult>;
    finalize(requestId: string): Promise<boolean>;

    sync(startingRequestId: string, onRequest: (request: DataRequest) => void): Promise<void>;
}
