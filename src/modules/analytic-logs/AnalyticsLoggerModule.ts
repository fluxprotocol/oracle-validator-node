import { DB_TABLE_DATA_REQUESTS } from '@fluxprotocol/oracle-provider-core/dist/Core';
import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import Module from '@fluxprotocol/oracle-provider-core/dist/Module';
import { formatToken } from '@fluxprotocol/oracle-provider-core/dist/Token';
import Big from 'big.js';
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

        const logs = balancesInfo.map(async (balanceInfo) => {
            const symbol = balanceInfo.info.symbol;
            const balance = formatToken(balanceInfo.info.balance.toString(), balanceInfo.info.decimals, 4);
            const profit = formatToken(balanceInfo.info.profit.toString(), balanceInfo.info.decimals, 4);

            const activeRequests = await this.dependencies.database.getAllFromTable<DataRequest>(DB_TABLE_DATA_REQUESTS);
            const totalStaked = activeRequests.reduce((totalStaked, request) => {
                const totalRequestStaked = request.staking.reduce((requestStaked, stake) => requestStaked.add(stake.amount), new Big(0));
                return totalStaked.add(totalRequestStaked);
            }, new Big(0));

            const totalStakedFormatted = formatToken(totalStaked.toString(), balanceInfo.info.decimals, 4);

            return `Provider: ${balanceInfo.providerId}, Balance: ${balance} ${symbol}, Staked: ${totalStakedFormatted} ${symbol}, Profit ${profit} ${symbol}`;
        });

        (await Promise.all(logs)).forEach(log => this.dependencies.logger.info(log));

        this.timeBetweenLogs = 0;
    }
}
