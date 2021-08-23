import { ModuleDependencies } from '@fluxprotocol/oracle-provider-core/dist/Module';
import { RawRpc } from '../IRpc';

export default function createNodeController(dependencies: ModuleDependencies) {
    return {
        async status(params: {}, raw: RawRpc) {
            const balances = dependencies.providerRegistry.activeProviders.map(async (providerId) => {
                const balanceInfo = await dependencies.providerRegistry.getBalanceInfo(providerId);

                return {
                    providerId,
                    balance: balanceInfo.balance.toString(),
                    staked: balanceInfo.amountStaked,
                    profit: balanceInfo.profit.toString(),
                    decimals: balanceInfo.decimals,
                    stakingContractId: balanceInfo.contractId,
                    symbol: balanceInfo.symbol,
                };
            });

            return {
                processing: dependencies.jobWalker.processingIds.size,
                watching: dependencies.jobWalker.requests.size,
                providersInfo: await Promise.all(balances),
            }
        }
    };
}
