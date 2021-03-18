import { BotOptions } from "../models/BotOptions";
import { isJobSuccesful } from "../models/JobExecuteResult";
import logger from "../services/LoggerService";
import { connectAccount, connectToNear } from "../services/NearCredentialsService";
import JobQueue, { ProcessedRequest } from "./JobQueue";
import { listenForJobs } from "./JobSearcher";
import { submitJobToOracle } from "./Oracle";


export async function startBot(options: BotOptions) {
    logger.info(`🤖 Starting oracle bot on ${options.net}..`);

    const nearConnection = await connectToNear(options.net, options.credentialsStorePath);
    const account = await connectAccount(nearConnection, options.accountId);
    const queue = new JobQueue();

    logger.info(`Using account ${account.accountId}`);

    function onItemProcessed(item: ProcessedRequest) {
        const result = item.result;

        // We should not stake any requests
        if (!isJobSuccesful(result)) {
            logger.info(`❌ Request ${item.request.id} but the status ${item.result.type}. Will not stake.`);
            return;
        }

        submitJobToOracle(options, nearConnection, {
            result,
            request: item.request,
        });
    }

    listenForJobs(nearConnection, (requests) => {
        const currentJobsAmount = queue.length;

        requests.forEach((request) => {
            if (request.challengeRound > options.maximumChallengeRound) {
                return;
            }

            queue.enqueue(request);
        });

        const deltaJobs = queue.length - currentJobsAmount;

        if (deltaJobs > 0) {
            logger.info(`Found ${deltaJobs} jobs, processing to queue..`);
            queue.process((item) => onItemProcessed(item));
        }
    });
}
