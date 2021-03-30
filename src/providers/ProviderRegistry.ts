import Big from "big.js";
import { ClaimError, ClaimResult, ClaimResultType } from "../models/ClaimResult";
import DataRequest from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
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

    async getDataRequests(onRequests: (requests: DataRequest[], providerId: string) => void) {
        this.providers.forEach(async (provider) => {
            try {
                const requests = await provider.getDataRequests();
                onRequests(requests, provider.id);
            } catch (error) {
                logger.error(`[ProviderRegistry.getDataRequests] ${error}`);
            }
        });
    }

    async getDataRequestById(providerId: string, requestId: string): Promise<DataRequest | null> {
        const provider = this.getProviderById(providerId);
        if (!provider) return null;

        return provider.getDataRequestById(requestId);
    }

    async stake(providerId: string, requestId: string, roundId: number, answer?: string): Promise<StakeResponse> {
        const provider = this.getProviderById(providerId);
        if (!provider) {
            return {
                success: false,
                amountBack: new Big(0),
            }
        }

        return provider.stake(requestId, roundId, answer);
    }

    async challenge(providerId: string, requestId: string, roundId: number, answer?: string): Promise<StakeResponse> {
        const provider = this.getProviderById(providerId);
        if (!provider) {
            return {
                success: false,
                amountBack: new Big(0),
            }
        }

        return {
            success: true,
            amountBack: new Big(10),
        };
    }

    async claim(providerId: string, requestId: string): Promise<ClaimResult> {
        const provider = this.getProviderById(providerId);

        if (!provider) {
            return {
                type: ClaimResultType.Error,
                error: ClaimError.Unknown,
            };
        }

        return provider.claim(requestId);
    }
}
