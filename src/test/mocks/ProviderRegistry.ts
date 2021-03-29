import { parseNodeOptions } from "../../models/NodeOptions";
import { Provider } from "../../providers/Provider";
import ProviderRegistry from "../../providers/ProviderRegistry";

export function createMockProviderRegistry(providers: Provider[]) {
    return {
        nodeOptions: parseNodeOptions({}),
        providers,
        activeProviders: [],
        getProviderById: jest.fn(),
        init: jest.fn(),
        getTokenBalance: jest.fn(),
        getDataRequests: jest.fn(),
        getDataRequestById: jest.fn(),
        stake: jest.fn(),
        challenge: jest.fn(),
        claim: jest.fn(),
    }
}
