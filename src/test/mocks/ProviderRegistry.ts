import Provider from "@fluxprotocol/oracle-provider-core/dist/Provider";
import { parseNodeOptions } from "../../models/NodeOptions";

export function createMockProviderRegistry(providers: Provider[] = []) {
    return {
        nodeOptions: parseNodeOptions({}),
        providers,
        activeProviders: providers.map(p => p.id),
        getProviderById: jest.fn(),
        init: jest.fn(),
        getBalanceInfo: jest.fn(),
        getDataRequests: jest.fn(),
        getDataRequestById: jest.fn(),
        stake: jest.fn(),
        claim: jest.fn(),
        finalize: jest.fn(),
        listenForRequests: jest.fn(),
        syncAll: jest.fn(),
        getAccountIdByProvider: jest.fn(),
    }
}
