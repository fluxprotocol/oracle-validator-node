import Big from "big.js";
import { ClaimError, ClaimResult, ClaimResultType } from "../models/ClaimResult";
import DataRequest from "../models/DataRequest";
import { Outcome } from "../models/DataRequestOutcome";
import { NodeOptions } from "../models/NodeOptions";
import { OracleConfig } from "../models/OracleConfig";
import logger from "../services/LoggerService";
import { StakeResponse, Provider } from "./Provider";

export default class ProviderRegistry {
    providers: Provider[];
    nodeOptions: NodeOptions;

    constructor(nodeOptions: NodeOptions, providers: Provider[]) {
        this.providers = providers;
        this.nodeOptions = nodeOptions;
    }

    get activeProviders() {
        return this.providers.map(p => p.id);
    }

    getProviderById(id: string): Provider | undefined {
        return this.providers.find(p => p.id === id);
    }

    async init() {
        await Promise.all(this.providers.map(p => p.init(this.nodeOptions)));
    }

    async getTokenBalance(providerId: string): Promise<Big> {
        const provider = this.getProviderById(providerId);
        if (!provider) return new Big(0);

        return provider.getTokenBalance();
    }

    listenForRequests(onRequests: (requests: DataRequest[], providerId: string) => void) {
        this.providers.forEach((provider) => {
            provider.listenForRequests((requests) => {
                onRequests(requests, provider.id);
            });
        });
    }

    async getDataRequestById(providerId: string, requestId: string): Promise<DataRequest | null> {
        const provider = this.getProviderById(providerId);
        if (!provider) return null;

        return provider.getDataRequestById(requestId);
    }

    async stake(providerId: string, request: DataRequest, answer: Outcome, stakeAmount: string): Promise<StakeResponse> {
        const provider = this.getProviderById(providerId);
        if (!provider) {
            return {
                success: false,
                amountBack: new Big(0),
            }
        }

        return provider.stake(request, answer, stakeAmount);
    }

    async finalize(providerId: string, requestId: string): Promise<boolean> {
        const provider = this.getProviderById(providerId);

        if (!provider) {
            return false;
        }

        return provider.finalize(requestId);
    }

    async claim(providerId: string, request: DataRequest): Promise<ClaimResult> {
        const provider = this.getProviderById(providerId);

        if (!provider) {
            return {
                type: ClaimResultType.Error,
                error: ClaimError.Unknown,
            };
        }

        return provider.claim(request);
    }
}
