import fs from 'fs/promises';
import { Argv, CommandModule } from 'yargs';
import { startNode } from '../core/Node';
import { getProviderOptions, parseNodeOptions } from '../models/NodeOptions';
import NearProvider from '../providers/Near/NearProvider';
import { Provider } from '../providers/Provider';
import ProviderRegistry from '../providers/ProviderRegistry';
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

        const nodeOptions = parseNodeOptions(JSON.parse(file));
        const providers: Provider[] = [];

        nodeOptions.providersConfig.forEach((providerConfig) => {
            if (providerConfig.id === NearProvider.id) {
                providers.push(new NearProvider());
            }
        });

        if (!providers.length) {
            logger.error('No providers configured..');
            process.exit(1);
            return;
        }

        providers.forEach((provider) => {
            const errors = provider.validateOptions(nodeOptions, getProviderOptions(provider.id, nodeOptions));

            if (errors.length) {
                logger.error(errors.join('\n'));
                process.exit(1);
                return;
            }
        });

        const providerRegistry = new ProviderRegistry(nodeOptions, providers);
        startNode(providerRegistry, nodeOptions);
    }
};
