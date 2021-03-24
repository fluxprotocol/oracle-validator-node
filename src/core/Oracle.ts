import { NodeOptions } from "../models/NodeOptions";
import { DataRequestViewModel } from "../models/DataRequest";
import { SuccessfulJobResult } from "../models/JobExecuteResult";
import logger from "../services/LoggerService";
import AvailableStake from "./AvailableStake";
import ProviderRegistry from "../providers/ProviderRegistry";
import { StakeResponse } from "../providers/Provider";

const FIRST_CHALLENGE_ROUND = 0;

interface SubmitJobToOracleParams {
    request: DataRequestViewModel;
    result: SuccessfulJobResult<string>;
    availableStake: AvailableStake;
}

export enum SubmitJobToOracleError {
    MaxChallengeRoundExceeded = 'MaxChallengeRoundExceeded',
    ChallengeHasWrongOutcome = 'ChallengeHasWrongOutcome',
    NotEnoughBalance = 'NotEnoughBalance',
    Unknown = 'Unknown',
    RequestNotFound = 'RequestNotFound',
}

interface SubmitJobToOracleResult {
    error?: SubmitJobToOracleError;
    success: boolean;
}

export async function submitJobToOracle(nodeOptions: NodeOptions, providerRegistry: ProviderRegistry, params: SubmitJobToOracleParams): Promise<SubmitJobToOracleResult> {
    const { request, result, availableStake } = params;
    const latestRequestData = await providerRegistry.getDataRequestById(request.providerId, request.id);

    if (!latestRequestData) {
        return {
            success: false,
            error: SubmitJobToOracleError.RequestNotFound,
        }
    }

    const currentChallengeRound = latestRequestData.rounds[latestRequestData.rounds.length - 1];
    const stake = params.availableStake.withdrawBalanceToStake(request.providerId);

    if (stake.lte(0)) {
        logger.error(`❌💰 Not enough balance to stake.`);
        return {
            success: false,
            error: SubmitJobToOracleError.NotEnoughBalance,
        };
    }

    let stakingResponse: StakeResponse | undefined;

    // The outcome is being challenged
    if (currentChallengeRound.round > FIRST_CHALLENGE_ROUND) {
        // The winning outcome for the challange was not correct. We should invalidate the challenge
        if (result.data !== currentChallengeRound.winningOutcome) {
            logger.info(`🦠 Malicious challenge found for ${request.id} at ${request.providerId}`);

            stakingResponse = await providerRegistry.stake(request.providerId, request.id, currentChallengeRound.round, undefined);
        } else {
            // The winning outcome is correct we can add our stake
            stakingResponse = await providerRegistry.stake(request.providerId, request.id, currentChallengeRound.round, result.data);
        }
    } else {
        // We can safely commit to the challenge
        // We should check how much the user wants to stake per data request
        // Also check whether the balance of the token is enough to stake
        stakingResponse = await providerRegistry.stake(request.providerId, request.id, currentChallengeRound.round, result.data);
    }

    if (!stakingResponse?.success) {
        logger.error(`Staking failed for id ${request.id} on ${request.providerId}`);

        return {
            success: false,
            error: SubmitJobToOracleError.Unknown,
        };
    }

    const actualStaking = nodeOptions.stakePerRequest.sub(stakingResponse.amountBack);
    availableStake.addRequestToActiveStaking(request, result, actualStaking);

    return {
        success: true,
    }
}
