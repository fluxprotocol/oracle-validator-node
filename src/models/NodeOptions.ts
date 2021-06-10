import Big from "big.js";
import { TOKEN_DENOM } from "../config";
import { toToken } from "../utils/tokenUtils";

export interface RawNodeConfig {
    debug?: boolean;
    dbPath?: string;
    dbName?: string;
    stakePerRequest?: string;
    contractIds?: string[];
    providers?: {
        id: string;
        options?: object;
    }[];

    http?: {
        port?: number;
    }
}

export interface NodeOptions {
    debug: boolean;

    dbPath: string;
    dbName: string;

    /** The maximum amount the node is allowed to stake per a request */
    stakePerRequest: Big;

    /** Tells the node to only resolve these contract ids */
    contractIds: string[];

    providersConfig: {
        id: string;
        options?: any;
    }[];

    http: {
        port: number;
    }
}

export function parseNodeOptions(options: RawNodeConfig): NodeOptions {
    const result: NodeOptions = {
        dbName: 'flux_db',
        dbPath: './',
        debug: false,
        contractIds: [],
        stakePerRequest: new Big(toToken('2.5', TOKEN_DENOM)),
        providersConfig: [],
        http: {
            port: parseInt(process.env.PORT || '3000'),
        },
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

    if (typeof options.debug === 'boolean') {
        result.debug = options.debug;
    }

    if (typeof options.dbPath === 'string') {
        result.dbPath = options.dbPath;
    }

    if (typeof options.dbName === 'string') {
        result.dbName = options.dbName;
    }

    if (typeof options.http === 'object') {
        if (typeof options.http.port === 'number') {
            result.http.port = options.http.port;
        }
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
