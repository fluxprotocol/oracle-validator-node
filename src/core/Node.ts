import death from 'death';
import logger, { logNodeOptions } from "../services/LoggerService";
import JobSearcher from "./JobSearcher";
import ProviderRegistry from "../providers/ProviderRegistry";
import { getAllDataRequests } from "../services/DataRequestService";
import JobWalker from "./JobWalker";
import NodeSyncer from './NodeSyncer';

export async function startNode(providerRegistry: ProviderRegistry) {
    logNodeOptions(providerRegistry);

    await providerRegistry.init();
    const nodeSyncer = new NodeSyncer(providerRegistry);
    await nodeSyncer.init();
    await nodeSyncer.syncNode();

    logger.debug('Restoring all stored data requests');

    // Restore the validator state
    const dataRequests = await getAllDataRequests();
    const jobSearcher = new JobSearcher(providerRegistry, dataRequests);
    const jobWalker = new JobWalker(providerRegistry, dataRequests);

    logger.debug('Starting searcher');
    jobSearcher.startSearch((requests) => {
        requests.forEach((request) => {
            nodeSyncer.updateLatestDataRequest(request);
            jobWalker.addNewDataRequest(request);
        });
    });

    logger.debug('Starting walker');
    jobWalker.startWalker();

    let deathCounter = 0;

    death(async () => {
        if (deathCounter === 1) {
            logger.info('Data could be inaccurate for next run. Please check the explorer to claim manually and delete the database if there are any issues with startup.');
            process.exit(1);
        }

        deathCounter += 1;
        logger.info('Finishing walk in order to keep data integrity');
        await jobWalker.stopWalker();
        process.exit(0);
    });
}
