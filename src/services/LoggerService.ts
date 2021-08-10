import winston, { format } from 'winston';
import packageJson from '../../package.json';

import { AVAILABLE_PROVIDERS } from '../config';
import ProviderRegistry from '../providers/ProviderRegistry';

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

export function logNodeOptions(providerRegistry: ProviderRegistry) {
    logger.info(`🤖 Starting oracle node v${packageJson.version} for ${providerRegistry.providers.map(p => p.providerName)}..`);
    logger.info(`🛠  Listening to: ${AVAILABLE_PROVIDERS.map(p => p.id).join(', ')}`);
}
