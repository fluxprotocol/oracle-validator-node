import winston, { format } from 'winston';
import { TOKEN_DENOM } from '../config';
import AvailableStake from '../core/AvailableStake';
import JobPool from '../core/JobPool';
import { NodeOptions } from '../models/NodeOptions';
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
    const profit = availableStake.startingBalance.add(availableStake.totalStaked).sub(availableStake.balance);
    const profitFormatted = formatToken(profit.toString(), TOKEN_DENOM);
    const balanceFormatted = formatToken(availableStake.balance.toString(), TOKEN_DENOM);
    const totalStakedFormatted = formatToken(availableStake.totalStaked.toString(), TOKEN_DENOM);

    logger.info(`💸 Balance: ${balanceFormatted} FLX, Staking: ${totalStakedFormatted} FLX, Profit: ${profitFormatted} FLX, Jobs executed: ${pool.processedRequests.size}, Jobs actively staking: ${availableStake.activeStaking.size}`);
}

export function logNodeOptions(nodeOptions: NodeOptions) {
    const stakePerRequest = nodeOptions.stakePerRequest.toString();

    logger.info(`🛠  Using account ${nodeOptions.accountId}`);
    logger.info(`🛠  Staking per request ${formatToken(stakePerRequest, TOKEN_DENOM)} FLX`);
    logger.info(`🛠  Maxmimum round to stake on ${nodeOptions.maximumChallengeRound}`);
}
