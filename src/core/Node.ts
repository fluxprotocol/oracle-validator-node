import { NodeOptions } from "../models/NodeOptions";
import { isJobSuccesful } from "../models/JobExecuteResult";
import logger, { logBalances, logNodeOptions } from "../services/LoggerService";
import JobPool, { ProcessedRequest } from "./JobPool";
import { loadJobs } from "./JobSearcher";
import { submitJobToOracle } from "./Oracle";
import AvailableStake from "./AvailableStake";
import { BALANCE_REFRESH_INTERVAL, JOB_SEARCH_INTERVAL } from "../config";
import ProviderRegistry from "../providers/ProviderRegistry";


export async function startNode(providerRegistry: ProviderRegistry, options: NodeOptions) {
    logNodeOptions(providerRegistry, options);

    await providerRegistry.init();

    const jobPool = new JobPool();

    // Used to keep track of how much the node can spend
    const availableStake = new AvailableStake(options, providerRegistry);
    await availableStake.refreshBalances(true);
    availableStake.startClaimingProcess();

    logBalances(availableStake, jobPool);

    // For checking the balances and preventing a lockup of 0 balance in case of a fail
    setInterval(async () => {
        await availableStake.refreshBalances();
        logBalances(availableStake, jobPool);
    }, BALANCE_REFRESH_INTERVAL);

    function onItemProcessed(item: ProcessedRequest) {
        const result = item.result;

        if (!isJobSuccesful(result)) {
            logger.info(`❌ Request ${item.request.id} errored with: ${result.error}`);
            return;
        }

        submitJobToOracle(options, providerRegistry, {
            result,
            request: item.request,
            availableStake,
        });
    }

    setInterval(async () => {
        loadJobs(providerRegistry, options, (requests, providerId) => {
            if (!requests.length) return;

            requests.forEach((item) => jobPool.addRequest(item));

            if (!availableStake.hasEnoughBalanceForStaking(providerId)) {
                return;
            }

            jobPool.process((item) => onItemProcessed(item));
        });
    }, JOB_SEARCH_INTERVAL);
}
