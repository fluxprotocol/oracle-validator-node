import Big from "big.js";
import { CLAIM_CHECK_INTERVAL } from "../config";
import { NodeOptions } from "../models/NodeOptions";
import { DataRequestViewModel } from "../models/DataRequest";
import ProviderRegistry from "../providers/ProviderRegistry";
import { sumBig } from "../utils/bigUtils";


interface ActiveStaking {
    stakingAmount: Big;
    request: DataRequestViewModel;
}

export default class AvailableStake {
    nodeOptions: NodeOptions;
    startingBalance: Big = new Big(0);
    balances: Map<string, Big> = new Map();
    totalStaked: Big = new Big(0);
    activeStaking: Map<string, ActiveStaking> = new Map();

    /** Used for not spamming the RPC with balance requests */
    private balanceFetch?: Promise<Big[]>;
    private providerRegistry: ProviderRegistry;

    constructor(nodeOptions: NodeOptions, providerRegistry: ProviderRegistry) {
        this.nodeOptions = nodeOptions;
        this.providerRegistry = providerRegistry;
    }

    /**
     * Refreshes the FLX balances of the node
     *
     * @param {boolean} [isStartingBalance=false]
     * @return {Promise<void>}
     * @memberof AvailableStake
     */
    async refreshBalances(isStartingBalance: boolean = false): Promise<void> {
        // short circuit if the request is already ongoing
        if (this.balanceFetch) {
            await this.balanceFetch;
            return;
        }

        const providerIds = this.providerRegistry.activeProviders;
        const balanceFetches = providerIds.map((id) => {
            return this.providerRegistry.getTokenBalance(id);
        });

        this.balanceFetch = Promise.all(balanceFetches);
        const balances = await this.balanceFetch;

        providerIds.forEach((providerId, index) => {
            this.balances.set(providerId, balances[index]);
        });

        this.balanceFetch = undefined;

        if (isStartingBalance) {
            this.startingBalance = sumBig(balances);
        }
    }

    /**
     * Checks if the node has enough balance to stake
     *
     * @return {boolean}
     * @memberof AvailableStake
     */
    hasEnoughBalanceForStaking(providerId: string): boolean {
        const providerBalance = this.balances.get(providerId);

        if (!providerBalance) {
            return false;
        }

        if (this.nodeOptions.stakePerRequest.gt(providerBalance)) {
            return false;
        }

        return true;
    }

    /**
     * Withdraws FLX from balance in order to stake
     *
     * @return {Big} amount of stake withdrawn
     * @memberof AvailableStake
     */
    withdrawBalanceToStake(providerId: string): Big {
        const providerBalance = this.balances.get(providerId);

        if (!providerBalance || !this.hasEnoughBalanceForStaking(providerId)) {
            return new Big(0);
        }

        const newBalance = providerBalance.sub(this.nodeOptions.stakePerRequest);
        this.balances.set(providerId, newBalance);

        return this.nodeOptions.stakePerRequest;
    }

    /**
     * Adds a request that we are actively staking
     * This will allow the node to later claim the rewards automagicly
     *
     * @param {DataRequestViewModel} request
     * @param {Big} stakingAmount
     * @memberof AvailableStake
     */
    addRequestToActiveStaking(request: DataRequestViewModel, stakingAmount: Big) {
        this.totalStaked = this.totalStaked.add(stakingAmount);

        this.activeStaking.set(request.id, {
            request,
            stakingAmount,
        });
    }

    /**
     * Start claiming process
     * Checks each x seconds if something can be claimed
     * If something is claimable it will try to claim it and update the balances accordingly
     *
     * @memberof AvailableStake
     */
    startClaimingProcess() {
        setInterval(() => {
            const activelyStakingKeys = Array.from(this.activeStaking.keys());

            activelyStakingKeys.forEach(async (requestId) => {
                const activelyStakingData = this.activeStaking.get(requestId) as ActiveStaking;
                const dataRequest = await this.providerRegistry.getDataRequestById(activelyStakingData.request.providerId, requestId);

                if (!dataRequest) {
                    return;
                }

                const currentChallengeRound = dataRequest.rounds[dataRequest.rounds.length - 1];
                const now = new Date();

                // The last challange has ended so we are ready to finalize/claim
                if (now.getTime() > currentChallengeRound.quoromDate.getTime()) {
                    const claimResponse = await this.providerRegistry.claim(dataRequest.providerId, dataRequest.id);

                    this.totalStaked = this.totalStaked.sub(activelyStakingData.stakingAmount);
                    this.activeStaking.delete(dataRequest.id);

                    const currentProviderBalance = this.balances.get(dataRequest.providerId) ?? new Big(0);
                    this.balances.set(dataRequest.providerId, currentProviderBalance.add(claimResponse.received));
                }
            });
        }, CLAIM_CHECK_INTERVAL);
    }
}
