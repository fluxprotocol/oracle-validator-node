import Module from '@fluxprotocol/oracle-provider-core/dist/Module';
import { formatToken } from '@fluxprotocol/oracle-provider-core/dist/Token';
import { getAllProviderBalanceInfo } from './AnalyticsService';

export default class AnalyticsLoggerModule extends Module {
    static moduleName = 'Analytics';

    // 10 seconds
    minimumTimeBetweenLogs: number = 10_000;
    timeBetweenLogs: number = 0;

    async tick(timeSinceLastTick: number) {
        this.timeBetweenLogs += timeSinceLastTick;

        if (this.timeBetweenLogs < this.minimumTimeBetweenLogs) {
            return;
        }

        const jobWalker = this.dependencies.jobWalker;
        const balancesInfo = await getAllProviderBalanceInfo(this.dependencies.providerRegistry);

        this.dependencies.logger.info(`Processing ${jobWalker.processingIds.size}/${jobWalker.requests.size}`);

        balancesInfo.map((balanceInfo) => {
            const symbol = balanceInfo.info.symbol;
            const balance = formatToken(balanceInfo.info.balance.toString(), balanceInfo.info.decimals, 4);
            const staked = formatToken(balanceInfo.info.amountStaked, balanceInfo.info.decimals, 4);
            const profit = formatToken(balanceInfo.info.profit.toString(), balanceInfo.info.decimals, 4);

            this.dependencies.logger.info(`Provider: ${balanceInfo.providerId}, Balance: ${balance} ${symbol}, Staked: ${staked} ${symbol}, Profit ${profit} ${symbol}`);
        });

        this.timeBetweenLogs = 0;
    }
}
