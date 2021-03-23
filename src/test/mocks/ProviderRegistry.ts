import { parseNodeOptions } from "../../models/NodeOptions";
import { Provider } from "../../providers/Provider";
import ProviderRegistry from "../../providers/ProviderRegistry";

export function createMockProviderRegistry(providers: Provider[]) {
    return {
        activeProviders: [],
        claim: jest.fn(),
        getDataRequestById: jest.fn(),
        getDataRequests: jest.fn(),
        getProviderById: jest.fn(),
        getTokenBalance: jest.fn(),
        init: jest.fn(),
        nodeOptions: parseNodeOptions({}),
        providers,
        stake: jest.fn(),
    }
}
