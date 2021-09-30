import DataRequest, { canStakeOnRequest, getCurrentResolutionWindow } from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import { getRequestOutcome } from "@fluxprotocol/oracle-provider-core/dist/Outcome";
import { isClaimResultSuccesful } from "@fluxprotocol/oracle-provider-core/dist/ClaimResult";
import { StakeResult, isStakeResultSuccesful, StakeResultType, StakeError } from "@fluxprotocol/oracle-provider-core/dist/StakeResult";

import logger from "../services/LoggerService";
import ProviderRegistry from "../providers/ProviderRegistry";

export async function stakeOnDataRequest(
    providerRegistry: ProviderRegistry,
    dataRequest: DataRequest,
): Promise<StakeResult> {
    const canStakeResult = canStakeOnRequest(dataRequest);

    if (!canStakeResult.canStake) {
        logger.debug(`${dataRequest.internalId} - Skipping stake due: ${canStakeResult.reason}`);

        return {
            type: StakeResultType.Error,
            error: canStakeResult.reason ?? StakeError.Unknown,
        }
    }

    logger.debug(`${dataRequest.internalId} - Staking on request`);

    const currentResolutionWindow = getCurrentResolutionWindow(dataRequest);
    const roundIdStakingOn = currentResolutionWindow?.round ?? 0;
    const dataRequestAnswer = getRequestOutcome(dataRequest);
    const stakingResponse = await providerRegistry.stake(dataRequest.providerId, dataRequest, dataRequestAnswer);

    if (!isStakeResultSuccesful(stakingResponse)) {
        logger.debug(`${dataRequest.internalId} - Staking failed: ${JSON.stringify(stakingResponse)}`);
        return stakingResponse;
    }

    return {
        roundId: roundIdStakingOn,
        amount: stakingResponse.amount,
        type: StakeResultType.Success,
    }
}


export async function finalizeRequest(providerRegistry: ProviderRegistry, request: DataRequest) {
    try {
        logger.debug(`${request.internalId} - Finalizing`);
        const isFinalized = await providerRegistry.finalize(request.providerId, request);

        if (isFinalized) {
            logger.debug(`${request.internalId} - Finalized`);
        } else {
            logger.debug(`${request.internalId} - Could not finalize`);
        }
    } catch (error) {
        logger.error(`${request.internalId} - ${error}`);
        return false;
    }
}

export async function claimRequestEarnings(providerRegistry: ProviderRegistry, request: DataRequest): Promise<boolean> {
    try {
        if (!request.finalizedOutcome) {
            await finalizeRequest(providerRegistry, request);
        }

        logger.debug(`${request.internalId} - Claiming`);
        const claimResult = await providerRegistry.claim(request.providerId, request);
        logger.debug(`${request.internalId} - Claim, results: ${JSON.stringify(claimResult)}`);

        if (!isClaimResultSuccesful(claimResult)) {
            return false;
        }

        return true;
    } catch (error) {
        logger.error(`${request.internalId} - ${error}`);
        return false;
    }
}
