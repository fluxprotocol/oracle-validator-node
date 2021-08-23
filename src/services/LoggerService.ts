import { ILogger } from '@fluxprotocol/oracle-provider-core/dist/Core';
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

export function createModuleLogger(name: string): ILogger {
    return {
        debug: (message: string) => logger.debug(message),
        info: (message: string) => logger.info(message),
        warn: (message: string) => logger.warn(message),
        error: (message: string) => logger.error(message),
    };
}
