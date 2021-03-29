import Big from 'big.js';
import winston, { format } from 'winston';
import packageJson from '../../package.json';

import { TOKEN_DENOM } from '../config';
import JobWalker from '../core/JobWalker';
import NodeBalance from '../core/NodeBalance';
import { NodeOptions } from '../models/NodeOptions';
import ProviderRegistry from '../providers/ProviderRegistry';
import { sumBig } from '../utils/bigUtils';
import { formatToken } from '../utils/tokenUtils';
import { getAllDataRequests } from './DataRequestService';

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

export async function logBalances(nodeBalance: NodeBalance, walker: JobWalker) {
    const sumBalances = sumBig(Array.from(nodeBalance.balances.values()));

    const stakingRequests = walker.requests.flatMap(r => r.staking);
    const amountStaked = stakingRequests.reduce((prev, curr) => prev.add(curr.amountStaked), new Big(0));

    const profit = sumBalances.sub(nodeBalance.startingBalance);
    const profitFormatted = formatToken(profit.toString(), TOKEN_DENOM);
    const balanceFormatted = formatToken(sumBalances.toString(), TOKEN_DENOM);
    const totalStakedFormatted = formatToken(amountStaked.toString(), TOKEN_DENOM);
    const dr = await getAllDataRequests();

    logger.info(`💸 Balance: ${balanceFormatted} FLX, Staking: ${totalStakedFormatted} FLX, Profit: ${profitFormatted} FLX, Jobs actively staking: ${walker.requests.length}, Jobs Executed: ${dr.length}`);
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
