import Big from 'big.js';
import { Argv, CommandModule } from 'yargs';
import { TOKEN_DENOM } from '../config';
import { startNode } from '../core/Node';
import { NetworkType } from '../models/NearNetworkConfig';
import { NodeOptions } from '../models/NodeOptions';
import NearProvider from '../providers/Near/NearProvider';
import ProviderRegistry from '../providers/ProviderRegistry';
import { toToken } from '../utils/tokenUtils';
import { credentialOptions } from './options/credentialOptions';

export const start: CommandModule = {
    command: 'start',
    describe: 'Starts the oracle node',
    builder: (yargs: Argv) => credentialOptions(yargs)
        .option('net', {
            describe: 'The net (main or test) you want to run',
            type: 'string',
            demandOption: false,
            default: NetworkType.Testnet,
            choices: [NetworkType.Testnet, NetworkType.Mainnet]
        })
        .option('maximumChallengeRound', {
            describe: 'The maximum challenge round the node wants to commit to',
            type: 'number',
            demandOption: false,
            default: 0,
        })
        .option('stakePerRequest', {
            describe: 'The maximum amount the node is allowed to stake per request (in whole FLX)',
            type: 'number',
            demandOption: false,
            default: 2.5,
        })
        .option('contractIds', {
            describe: 'Tells the node to only resolve these contract ids',
            type: 'array',
            demandOption: false,
            default: [],
        })
    ,
    handler: (args) => {
        const stakePerRequest = args.stakePerRequest as number;
        const stakePerRequestDenom = toToken(stakePerRequest.toString(), TOKEN_DENOM);
        const nodeOptions: NodeOptions = {
            net: args.net as NetworkType,
            accountId: args.accountId as string,
            credentialsStorePath: args.credentialsStore as string,
            maximumChallengeRound: args.maximumChallengeRound as number,
            stakePerRequest: new Big(stakePerRequestDenom),
            contractIds: args.contractIds as string[],
        }

        const providerRegistry = new ProviderRegistry(nodeOptions, [
            new NearProvider(),
        ]);

        startNode(providerRegistry, nodeOptions);
    }
};
