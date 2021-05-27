import DataRequest from "../models/DataRequest";
import logger from "../services/LoggerService";
import ProviderRegistry from "../providers/ProviderRegistry";
import NodeBalance from "./NodeBalance";
import { StakeError, StakeResult, StakeResultType } from "../models/StakingResult";
import { getRequestOutcome, isOutcomesEqual } from "../models/DataRequestOutcome";

const FIRST_CHALLENGE_ROUND = 0;

export async function stakeOnDataRequest(
    providerRegistry: ProviderRegistry,
    nodeBalance: NodeBalance,
    dataRequest: DataRequest,
): Promise<StakeResult> {
    const currentResolutionWindow = dataRequest.currentWindow;
    const stake = nodeBalance.withdrawBalanceToStake(dataRequest.providerId);

    if (stake.lte(0)) {
        logger.error(`❌💰 Not enough balance to stake.`);
        return {
            error: StakeError.NotEnoughBalance,
            type: StakeResultType.Error,
        };
    }

    const roundIdStakingOn = currentResolutionWindow?.round ?? 0;
    const dataRequestAnswer = getRequestOutcome(dataRequest);

    if (roundIdStakingOn > FIRST_CHALLENGE_ROUND) {
        // A window has already been closed.
        // We need to make sure we are not submitting the same answer
        // Otherwise this would result in an error
        const previousWindow = dataRequest.resolutionWindows.find(rw => rw.round === roundIdStakingOn - 1);

        // No bonded outcome on the previous window is impossible
        if (!previousWindow || !previousWindow.bondedOutcome) {
            nodeBalance.deposit(dataRequest.providerId, stake);
            return {
                type: StakeResultType.Error,
                error: StakeError.Unknown,
            };
        }

        if (isOutcomesEqual(previousWindow.bondedOutcome, dataRequestAnswer)) {
            nodeBalance.deposit(dataRequest.providerId, stake);
            return {
                type: StakeResultType.Error,
                error: StakeError.AlreadyBonded,
            }
        }
    }

    const stakingResponse = await providerRegistry.stake(dataRequest.providerId, dataRequest, dataRequestAnswer, stake.toString());

    if (!stakingResponse.success) {
        logger.error(`Staking failed for id ${dataRequest.id} on ${dataRequest.providerId}`);
        nodeBalance.deposit(dataRequest.providerId, stake);

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
