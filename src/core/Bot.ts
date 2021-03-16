import { NetworkType } from "../models/NearNetworkConfig";
import logger from "../services/LoggerService";
import { connectAccount, connectToNear } from "../services/NearCredentialsService";
import { listenForJobs } from "./JobSearcher";

interface BotOptions {
    net: NetworkType;
    accountId: string;
    credentialsStorePath: string;
}

export async function startBot(options: BotOptions) {
    logger.info(`🤖 Starting oracle bot on ${options.net}..`);

    const nearConnection = await connectToNear(options.net, options.credentialsStorePath);
    const account = await connectAccount(nearConnection, options.accountId);

    logger.info(`Using account ${account.accountId}`);

    listenForJobs(() => {
        logger.info(`💼 Job found, executing task..`);
    });
}
