import Big from "big.js";
import { parseNodeOptions } from "../../models/NodeOptions";
import ProviderRegistry from "../../providers/ProviderRegistry";
import { createProviderMock } from "./ProviderMock";

export function createMockAvailableStake() {
    const config = parseNodeOptions({});

    return {
        activeStaking: new Map(),
        addRequestToActiveStaking: jest.fn(),
        balances: new Map(),
        hasEnoughBalanceForStaking: jest.fn(),
        nodeOptions: config,
        providerRegistry: new ProviderRegistry(config, [
            createProviderMock(),
        ]),
        refreshBalances: jest.fn(),
        startClaimingProcess: jest.fn(),
        startingBalance: new Big(0),
        totalStaked: new Big(0),
        withdrawBalanceToStake: jest.fn().mockReturnValue(new Big(1)),
    };
}
