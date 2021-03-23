import Big from "big.js";
import { DataRequestViewModel } from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
import { DataRequestStakeResponse, DataRequestFinalizeClaimResponse, Provider } from "./Provider";

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

    async getDataRequests(onRequests: (reqeusts: DataRequestViewModel[], providerId: string) => void) {
        this.providers.forEach(async (provider) => {
            const requests = await provider.getDataRequests();

            onRequests(requests, provider.id);
        });
    }

    async getDataRequestById(providerId: string, requestId: string): Promise<DataRequestViewModel | null> {
        const provider = this.getProviderById(providerId);
        if (!provider) return null;

        return provider.getDataRequestById(requestId);
    }

    async stake(providerId: string): Promise<DataRequestStakeResponse> {
        const provider = this.getProviderById(providerId);
        if (!provider) {
            return {
                success: false,
                amountBack: new Big(0),
            }
        }

        return provider.stake();
    }

    async claim(providerId: string, requestId: string): Promise<DataRequestFinalizeClaimResponse> {
        const provider = this.getProviderById(providerId);

        if (!provider) {
            return {
                received: '0',
            };
        }

        return provider.claim(requestId);
    }
}
