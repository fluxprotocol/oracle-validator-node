import { Argv, CommandModule } from 'yargs';
import { startBot } from '../core/Bot';
import { NetworkType } from '../models/NearNetworkConfig';
import { credentialOptions } from './options/credentialOptions';

export const start: CommandModule = {
    command: 'start',
    describe: 'Starts the oracle bot',
    builder: (yargs: Argv) => credentialOptions(yargs)
        .option('net', {
            describe: 'The net (main or test) you want to run',
            type: 'string',
            demandOption: false,
            default: NetworkType.Testnet,
            choices: [NetworkType.Testnet, NetworkType.Mainnet]
        })
        .option('maximumChallengeRound', {
            describe: 'The maximum challenge round the bot wants to commit to',
            type: 'number',
            demandOption: false,
            default: 0,
        })
    ,
    handler: (args) => {
        startBot({
            net: args.net as NetworkType,
            accountId: args.accountId as string,
            credentialsStorePath: args.credentialsStore as string,
            maximumChallengeRound: args.maximumChallengeRound as number
        });
    }
};
