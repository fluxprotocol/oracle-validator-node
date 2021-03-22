import { NodeOptions } from "../models/NodeOptions";
import { isJobSuccesful } from "../models/JobExecuteResult";
import logger, { logBalances, logNodeOptions } from "../services/LoggerService";
import { connectToNear } from "../services/NearService";
import JobPool, { ProcessedRequest } from "./JobPool";
import { loadJobs } from "./JobSearcher";
import { submitJobToOracle } from "./Oracle";
import AvailableStake from "./AvailableStake";
import { getAccount } from "../services/NearService";
import { BALANCE_REFRESH_INTERVAL, JOB_SEARCH_INTERVAL } from "../config";


export async function startNode(options: NodeOptions) {
    logger.info(`🤖 Starting oracle node on ${options.net}..`);
    logNodeOptions(options);

    const nearConnection = await connectToNear(options.net, options.credentialsStorePath);
    const nodeAccount = await getAccount(nearConnection, options.accountId);
    const jobPool = new JobPool();

    // Used to keep track of how much the node can spend
    const availableStake = new AvailableStake(options, nodeAccount, nearConnection);
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

        // We should not stake any requests
        if (!isJobSuccesful(result)) {
            logger.info(`❌ Request ${item.request.id} errored with: ${result.error}`);
            return;
        }

        submitJobToOracle(options, nearConnection, {
            result,
            request: item.request,
            availableStake,
        });
    }

    setInterval(async () => {
        const requests = await loadJobs({
            near: nearConnection,
            nodeOptions: options,
        });

        requests.forEach((item) => jobPool.addRequest(item));

        if (!availableStake.hasEnoughBalanceForStaking()) {
            return;
        }

        jobPool.process((item) => onItemProcessed(item));
    }, JOB_SEARCH_INTERVAL);
}
