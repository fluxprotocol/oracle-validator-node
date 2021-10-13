import { ILogger } from '@fluxprotocol/oracle-provider-core/dist/Core';
import winston, { format } from 'winston';
import packageJson from '../../package.json';

import { AVAILABLE_PROVIDERS, MAX_LOG_LIFETIME } from '../config';
import ProviderRegistry from '../providers/ProviderRegistry';
import 'winston-daily-rotate-file';

const logFormat = format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

const logger = winston.createLogger({
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            level: 'debug',
            filename: 'flux-%DATE%.log',
            datePattern: 'YYYY-MMM-DD',
            zippedArchive: true,
            dirname: 'logs',
            format: logFormat,
            maxFiles: MAX_LOG_LIFETIME,
        }),
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
