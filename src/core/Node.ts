import { NodeOptions } from "../models/NodeOptions";
import logger, { logNodeOptions, logBalances } from "../services/LoggerService";
import JobSearcher from "./JobSearcher";
import { BALANCE_REFRESH_INTERVAL } from "../config";
import NodeBalance from './NodeBalance';
import ProviderRegistry from "../providers/ProviderRegistry";
import { getAllDataRequests } from "../services/DataRequestService";
import JobWalker from "./JobWalker";


export async function startNode(providerRegistry: ProviderRegistry, options: NodeOptions) {
    logNodeOptions(providerRegistry, options);

    await providerRegistry.init();

    // Restore our current validator state
    const dataRequests = await getAllDataRequests();
    const jobSearcher = new JobSearcher(providerRegistry, options, dataRequests);
    const nodeBalance = new NodeBalance(options, providerRegistry);
    const jobWalker = new JobWalker(options, providerRegistry, nodeBalance, dataRequests);

    // Used to keep track of how much the node can spend
    await nodeBalance.refreshBalances(true);
    logBalances(nodeBalance, jobWalker);

    // For checking the balances and preventing a lockup of 0 balance in case of a fail
    setInterval(() => {
        // nodeBalance.refreshBalances();
        logBalances(nodeBalance, jobWalker);
    }, BALANCE_REFRESH_INTERVAL);

    jobSearcher.startSearch((requests) => {
        requests.forEach(r => jobWalker.addNewDataRequest(r));
    });

    jobWalker.startWalker();
}
