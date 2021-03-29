import { NodeOptions } from "../models/NodeOptions";
import DataRequest from "../models/DataRequest";
import logger from "../services/LoggerService";
import ProviderRegistry from "../providers/ProviderRegistry";
import { StakeResponse } from "../providers/Provider";
import NodeBalance from "./NodeBalance";
import { getDataRequestAnswer } from "../services/DataRequestService";
import { StakeError, StakeResult, StakeResultType } from "../models/StakingResult";

const FIRST_CHALLENGE_ROUND = 0;

export async function stakeOrChallengeDataRequest(
    nodeOptions: NodeOptions,
    providerRegistry: ProviderRegistry,
    nodeBalance: NodeBalance,
    dataRequest: DataRequest,
): Promise<StakeResult> {
    const currentChallengeRound = dataRequest.rounds[dataRequest.rounds.length - 1];
    const stake = nodeBalance.withdrawBalanceToStake(dataRequest.providerId);

    if (stake.lte(0)) {
        logger.error(`❌💰 Not enough balance to stake.`);
        return {
            error: StakeError.NotEnoughBalance,
            type: StakeResultType.Error,
        };
    }

    let stakingResponse: StakeResponse;
    let roundIdStakingOn = currentChallengeRound.round;
    const dataRequestAnswer = getDataRequestAnswer(dataRequest);

    // The outcome is being challenged
    if (currentChallengeRound.round > FIRST_CHALLENGE_ROUND && dataRequestAnswer !== currentChallengeRound.winningOutcome) {
        // The winning outcome for the challange was not correct.
        // We should invalidate the challenge by creating a new challenge
        logger.info(`🦠 Malicious challenge found for ${dataRequest.id} at ${dataRequest.providerId}`);
        stakingResponse = await providerRegistry.challenge(dataRequest.providerId, dataRequest.id, currentChallengeRound.round, dataRequestAnswer);
        roundIdStakingOn += 1;
    } else {
        // We can safely commit to the challenge
        // We should check how much the user wants to stake per data request
        // Also check whether the balance of the token is enough to stake
        stakingResponse = await providerRegistry.stake(dataRequest.providerId, dataRequest.id, currentChallengeRound.round, dataRequestAnswer);
    }

    if (!stakingResponse.success) {
        logger.error(`Staking failed for id ${dataRequest.id} on ${dataRequest.providerId}`);

        return {
            error: StakeError.Unknown,
            type: StakeResultType.Error,
        };
    }

    const actualStaking = stake.sub(stakingResponse.amountBack);
    nodeBalance.deposit(dataRequest.providerId, stakingResponse.amountBack);

    return {
        amountStaked: actualStaking.toString(),
        roundId: roundIdStakingOn,
        type: StakeResultType.Success,
    }
}
