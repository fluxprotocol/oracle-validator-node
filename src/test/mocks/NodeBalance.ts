import Big from "big.js";
import { parseNodeOptions } from "../../models/NodeOptions";
import ProviderRegistry from "../../providers/ProviderRegistry";
import { createProviderMock } from "./ProviderMock";

export function createMockNodeBalance() {
    const config = parseNodeOptions({});

    return {
        nodeOptions: config,
        startingBalance: new Big(0),
        balances: new Map(),
        providerRegistry: new ProviderRegistry(config, [
            createProviderMock(),
        ]),

        refreshBalances: jest.fn(),
        hasEnoughBalanceForStaking: jest.fn(),
        withdrawBalanceToStake: jest.fn().mockReturnValue(new Big(config.stakePerRequest)),
        deposit: jest.fn(),
    };
}
