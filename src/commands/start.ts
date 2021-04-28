import fs from 'fs/promises';
import { Argv, CommandModule } from 'yargs';
import { startNode } from '../core/Node';
import { parseNodeOptions } from '../models/NodeOptions';
import NearProvider from '../providers/Near/NearProvider';
import { Provider } from '../providers/Provider';
import ProviderRegistry from '../providers/ProviderRegistry';
import Database from '../services/DatabaseService';
import logger from '../services/LoggerService';

export const start: CommandModule = {
    command: 'start',
    describe: 'Starts the oracle node',
    builder: (yargs: Argv) => yargs
        .option('config', {
            describe: 'Path to the config.json',
            type: 'string',
            demandOption: false,
            default: './config.json',
        })
    ,
    handler: async (args) => {
        const file = await fs.readFile(args.config as string, {
            encoding: 'utf-8',
        });

        if (!file) {
            logger.error(`Config file could not be found at ${args.config}`);
            process.exit(1);
        }

        const nodeOptions = parseNodeOptions(JSON.parse(file));
        const providers: Provider[] = [];

        await Database.startDatabase(nodeOptions.dbPath, nodeOptions.dbName);

        logger.transports.forEach((transport) => {
            transport.level = nodeOptions.debug ? 'debug' : 'info';
        });

        nodeOptions.providersConfig.forEach((providerConfig) => {
            if (providerConfig.id === NearProvider.id) {
                const provider = new NearProvider();
                const errors = provider.validateOptions(nodeOptions, providerConfig.options);

                if (errors.length) {
                    logger.error(errors.join('\n'));
                    process.exit(1);
                }

                providers.push(provider);
            }
        });

        if (!providers.length) {
            logger.error('No providers configured..');
            process.exit(1);
        }

        const providerRegistry = new ProviderRegistry(nodeOptions, providers);
        startNode(providerRegistry, nodeOptions);
    }
};
