import { NodeOptions } from "../models/NodeOptions";
import { DataRequestViewModel } from "../models/DataRequest";
import { SuccessfulJobResult } from "../models/JobExecuteResult";
import logger from "../services/LoggerService";
import AvailableStake from "./AvailableStake";
import ProviderRegistry from "../providers/ProviderRegistry";

const FIRST_CHALLENGE_ROUND = 0;

interface SubmitJobToOracleParams {
    request: DataRequestViewModel;
    result: SuccessfulJobResult<string>;
    availableStake: AvailableStake;
}

enum SubmitJobToOracleError {
    MaxChallengeRoundExceeded,
    ChallengeHasWrongOutcome,
    NotEnoughBalance,
    Unknown,
}

interface SubmitJobToOracleResult {
    error?: SubmitJobToOracleError;
    success: boolean;
}

export async function submitJobToOracle(nodeOptions: NodeOptions, providerRegistry: ProviderRegistry, params: SubmitJobToOracleParams): Promise<SubmitJobToOracleResult> {
    const currentRequestStatus = await providerRegistry.getDataRequestById(params.request.providerId, params.request.id);
    if (!currentRequestStatus) {
        logger.error(`Request id ${params.request.id} on ${params.request.providerId} does not exist`);
        return {
            success: false,
            error: SubmitJobToOracleError.Unknown,
        };
    }

    const currentChallengeRound = currentRequestStatus.rounds[currentRequestStatus.rounds.length - 1];

    if (currentChallengeRound.round > nodeOptions.maximumChallengeRound) {
        logger.info(`Skipping ${currentRequestStatus.id}, max challenge round is ${nodeOptions.maximumChallengeRound} but request is at ${currentChallengeRound.round}`);
        return {
            success: false,
            error: SubmitJobToOracleError.MaxChallengeRoundExceeded,
        };
    }

    // The outcome is being challenged, we should skip the commitment
    // when the challenge outcome is not the same as ours
    if (currentChallengeRound.round > FIRST_CHALLENGE_ROUND) {
        if (params.result.data !== currentChallengeRound.winningOutcome) {
            logger.info(`Skipping commitment of ${currentRequestStatus.id}, challenge outcome did not match fetched outcome`);
            return {
                success: false,
                error: SubmitJobToOracleError.ChallengeHasWrongOutcome,
            };
        }
    }

    const stake = params.availableStake.withdrawBalanceToStake(currentRequestStatus.providerId);

    if (stake.lte(0)) {
        logger.error(`❌💰 Not enough balance to stake.`);
        return {
            success: false,
            error: SubmitJobToOracleError.NotEnoughBalance,
        };
    }

    // We can safely commit to the challenge
    // We should check how much the user wants to stake per data request
    // Also check whether the balance of the token is enough to stake
    const stakingResponse = await providerRegistry.stake(currentRequestStatus.providerId);

    if (!stakingResponse.success) {
        logger.error(`Staking failed for id ${currentRequestStatus.id} on ${currentRequestStatus.providerId}`);
        return {
            success: false,
            error: SubmitJobToOracleError.Unknown,
        };
    }

    const actualStaking = nodeOptions.stakePerRequest.sub(stakingResponse.amountBack);
    params.availableStake.addRequestToActiveStaking(currentRequestStatus, actualStaking);

    return {
        success: true,
    }
}
