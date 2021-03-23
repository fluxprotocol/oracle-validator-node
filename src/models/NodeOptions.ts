import Big from "big.js";
import { TOKEN_DENOM } from "../config";
import { toToken } from "../utils/tokenUtils";

export interface RawNodeConfig {
    stakePerRequest?: string;
    contractIds?: string[];
    providers?: {
        id: string;
        options?: object;
    }[];
}

export interface NodeOptions {
    /** The maximum amount the node is allowed to stake per a request */
    stakePerRequest: Big;

    /** Tells the node to only resolve these contract ids */
    contractIds: string[];

    providersConfig: {
        id: string;
        options?: any;
    }[];
}

export function parseNodeOptions(options: RawNodeConfig): NodeOptions {
    const result: NodeOptions = {
        contractIds: [],
        stakePerRequest: new Big(toToken('2.5', TOKEN_DENOM)),
        providersConfig: [],
    };

    if (options.contractIds && Array.isArray(options.contractIds)) {
        result.contractIds = options.contractIds;
    }

    if (typeof options.stakePerRequest === 'string') {
        result.stakePerRequest = new Big(options.stakePerRequest);
    }

    if (Array.isArray(options.providers) && options.providers.length > 0) {
        result.providersConfig = options.providers;
    }

    return result;
}

export function getProviderOptions<T>(providerId: string, nodeOptions: NodeOptions): T | null {
    const provider = nodeOptions.providersConfig.find(pc => pc.id === providerId);

    if (!provider) {
        return null;
    }

    return provider.options ?? null;
}
