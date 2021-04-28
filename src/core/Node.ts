import death from 'death';
import { NodeOptions } from "../models/NodeOptions";
import logger, { logNodeOptions, logBalances } from "../services/LoggerService";
import JobSearcher from "./JobSearcher";
import { BALANCE_REFRESH_INTERVAL } from "../config";
import NodeBalance from './NodeBalance';
import ProviderRegistry from "../providers/ProviderRegistry";
import { getAllDataRequests } from "../services/DataRequestService";
import JobWalker from "./JobWalker";
import NodeSyncer from './NodeSyncer';


export async function startNode(providerRegistry: ProviderRegistry, options: NodeOptions) {
    logNodeOptions(providerRegistry, options);

    await providerRegistry.init();
    const nodeSyncer = new NodeSyncer(providerRegistry);
    await nodeSyncer.init();
    await nodeSyncer.syncNode();

    // Restore our current validator state
    const dataRequests = await getAllDataRequests();
    const jobSearcher = new JobSearcher(providerRegistry, options, dataRequests);
    const nodeBalance = new NodeBalance(options, providerRegistry);
    const jobWalker = new JobWalker(options, providerRegistry, nodeBalance, dataRequests);

    // Used to keep track of how much the node can spend
    await nodeBalance.refreshBalances(true);
    logBalances(nodeBalance, jobWalker);

    // For checking the balances and preventing a lockup of 0 balance in case of a fail
    setInterval(async () => {
        await nodeBalance.refreshBalances();
        logBalances(nodeBalance, jobWalker);
    }, BALANCE_REFRESH_INTERVAL);

    jobSearcher.startSearch((requests) => {
        requests.forEach((request) => {
            nodeSyncer.updateLatestDataRequest(request);
            jobWalker.addNewDataRequest(request);
        });
    });

    jobWalker.startWalker();

    let deathCounter = 0;

    death(async () => {
        if (deathCounter === 1) {
            logger.info('Data could be inaccurate for next run. Please check the explorer to claim manually.');
            process.exit(1);
        }

        deathCounter += 1;
        logger.info('Finishing walk in order to keep data integrity');
        await jobWalker.stopWalker();
        process.exit(0);
    });
}
