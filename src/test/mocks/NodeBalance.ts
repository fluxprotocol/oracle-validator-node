import Big from "big.js";
import { BalanceStatusViewModel } from "../../models/BalanceStatus";
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
        balanceStatus: {
            balance: new Big(0),
            claimed: new Big(0),
            profit: new Big(0),
            staked: new Big(0),
            type: 'BalanceStatus',
        } as BalanceStatusViewModel,

        refreshBalances: jest.fn(),
        hasEnoughBalanceForStaking: jest.fn(),
        withdrawBalanceToStake: jest.fn().mockReturnValue(new Big(config.stakePerRequest)),
        deposit: jest.fn(),
        init: jest.fn(),
        addClaimedRequest: jest.fn(),
    };
}
