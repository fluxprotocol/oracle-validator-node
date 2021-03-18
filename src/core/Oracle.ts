import { Near } from "near-api-js";
import { ORACLE_CONTRACT_ID } from "../config";
import { BotOptions } from "../models/BotOptions";
import { DataRequestViewModel } from "../models/DataRequest";
import { SuccessfulJobResult } from "../models/JobExecuteResult";
import logger from "../services/LoggerService";
import { getAccount } from "../services/NearRpcService";


async function getCurrentRequestStatus(connection: Near, request: DataRequestViewModel): Promise<DataRequestViewModel> {
    const oracleAccount = await getAccount(connection, ORACLE_CONTRACT_ID);

    return {
        ...request,
        challengeRound: 1,
    };
}

interface CommitAndStakeJobParams {
    request: DataRequestViewModel;
    result: SuccessfulJobResult<string>;
}

export async function submitJobToOracle(botOptions: BotOptions, connection: Near, params: CommitAndStakeJobParams) {
    const currentRequestStatus = await getCurrentRequestStatus(connection, params.request);

    if (currentRequestStatus.challengeRound > botOptions.maximumChallengeRound) {
        logger.info(`Skipping submission of ${currentRequestStatus.id} due the challenge round being higher than ${botOptions.maximumChallengeRound}`);
        return;
    }
}
