import winston, { format } from 'winston';
import packageJson from '../../package.json';

import { TOKEN_DENOM } from '../config';
import JobWalker from '../core/JobWalker';
import NodeBalance from '../core/NodeBalance';
import { NodeOptions } from '../models/NodeOptions';
import ProviderRegistry from '../providers/ProviderRegistry';
import { formatToken } from '../utils/tokenUtils';
import { calculateBalanceStatus } from './NodeBalanceService';

const logFormat = format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

const logger = winston.createLogger({
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: format.combine(
                format.colorize(),
                logFormat,
            ),
        }),
    ],
});

export default logger;

export async function logBalances(nodeBalance: NodeBalance, walker: JobWalker) {
    const result = calculateBalanceStatus(nodeBalance, walker);

    const profitFormatted = formatToken(result.profit.toString(), TOKEN_DENOM);
    const balanceFormatted = formatToken(result.balance.toString(), TOKEN_DENOM);
    const totalStakedFormatted = formatToken(result.activelyStaking.toString(), TOKEN_DENOM);

    logger.info(`💸 Balance: ${balanceFormatted} FLX, Staking: ${totalStakedFormatted} FLX, Profit: ${profitFormatted} FLX, Jobs actively watching: ${walker.requests.size}`);
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
