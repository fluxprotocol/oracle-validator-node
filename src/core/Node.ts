import { NodeOptions } from "../models/NodeOptions";
import { logNodeOptions } from "../services/LoggerService";
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
    const jobWalker = new JobWalker(dataRequests);
    const nodeBalance = new NodeBalance(options, providerRegistry);

    // Used to keep track of how much the node can spend
    await nodeBalance.refreshBalances(true);

    // For checking the balances and preventing a lockup of 0 balance in case of a fail
    setInterval(async () => {
        await nodeBalance.refreshBalances();
    }, BALANCE_REFRESH_INTERVAL);

    jobSearcher.startSearch((requests) => {
        requests.forEach(r => jobWalker.addNewDataRequest(r));
    });

    jobWalker.startWalker();
}
