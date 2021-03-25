import winston, { format } from 'winston';
import packageJson from '../../package.json';

import { TOKEN_DENOM } from '../config';
import AvailableStake from '../core/NodeBalance';
import JobPool from '../core/JobPool';
import { NodeOptions } from '../models/NodeOptions';
import ProviderRegistry from '../providers/ProviderRegistry';
import { sumBig } from '../utils/bigUtils';
import { formatToken } from '../utils/tokenUtils';

const logFormat = format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)

const logger = winston.createLogger({
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports: [
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat
            ),
        }),
    ],
});

export default logger;

export function logBalances(availableStake: AvailableStake, pool: JobPool) {
    const sumBalances = sumBig(Array.from(availableStake.balances.values()));

    const profit = availableStake.startingBalance.add(availableStake.totalStaked).sub(sumBalances);
    const profitFormatted = formatToken(profit.toString(), TOKEN_DENOM);
    const balanceFormatted = formatToken(sumBalances.toString(), TOKEN_DENOM);
    const totalStakedFormatted = formatToken(availableStake.totalStaked.toString(), TOKEN_DENOM);

    logger.info(`💸 Balance: ${balanceFormatted} FLX, Staking: ${totalStakedFormatted} FLX, Profit: ${profitFormatted} FLX, Jobs executed: ${pool.processedRequests.size}, Jobs actively staking: ${availableStake.activeStaking.size}`);
}

export function logNodeOptions(providerRegistry: ProviderRegistry, nodeOptions: NodeOptions) {
    const stakePerRequest = nodeOptions.stakePerRequest.toString();

    logger.info(`🤖 Starting oracle node v${packageJson.version} for ${providerRegistry.providers.map(p => p.providerName)}..`);
    logger.info(`🛠  Staking per request ${formatToken(stakePerRequest, TOKEN_DENOM)} FLX`);

    if (nodeOptions.contractIds.length) {
        logger.info(`🛠  Listening to: ${nodeOptions.contractIds}`);
    } else {
        logger.info(`🛠  Listening to all contracts`);
    }
}
