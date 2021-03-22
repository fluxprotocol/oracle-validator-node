import Big from "big.js";
import { Account, Near } from "near-api-js";
import { CLAIM_CHECK_INTERVAL } from "../config";
import { getTokenBalance } from "../contracts/FluxTokenContract";
import { dataRequestFinalizeClaim, getDataRequestById } from "../contracts/OracleContract";
import { NodeOptions } from "../models/NodeOptions";
import { DataRequestViewModel } from "../models/DataRequest";


interface ActiveStaking {
    stakingAmount: Big;
    request: DataRequestViewModel;
}

export default class AvailableStake {
    nodeOptions: NodeOptions;
    nodeAccount: Account;
    nearConnection: Near;
    startingBalance: Big = new Big(0);
    balance: Big = new Big(0);
    totalStaked: Big = new Big(0);
    activeStaking: Map<string, ActiveStaking> = new Map();

    /** Used for not spamming the RPC with balance requests */
    private balanceFetch?: Promise<Big>;

    constructor(nodeOptions: NodeOptions, nodeAccount: Account, nearConnection: Near) {
        this.nodeOptions = nodeOptions;
        this.nodeAccount = nodeAccount;
        this.nearConnection = nearConnection;
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

        this.balanceFetch = getTokenBalance(this.nodeAccount);
        this.balance = await this.balanceFetch;
        this.balanceFetch = undefined;

        if (isStartingBalance) {
            this.startingBalance = this.balance;
        }
    }

    /**
     * Withdraws FLX from balance in order to stake
     *
     * @return {Big}
     * @memberof AvailableStake
     */
    withdrawBalanceToStake(): Big {
        if (this.nodeOptions.stakePerRequest.gt(this.balance)) {
            return new Big(0);
        }

        this.balance = this.balance.sub(this.nodeOptions.stakePerRequest);

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

            activelyStakingKeys.forEach(async (key) => {
                const activelyStakingData = this.activeStaking.get(key) as ActiveStaking;
                const dataRequest = await getDataRequestById(this.nearConnection, key);
                const currentChallengeRound = dataRequest.rounds[dataRequest.rounds.length - 1];
                const now = new Date();

                // The last challange has ended so we are ready to finalize/claim
                if (now.getTime() > currentChallengeRound.quoromDate.getTime()) {
                    const claimResponse = await dataRequestFinalizeClaim(this.nearConnection, dataRequest);

                    this.totalStaked = this.totalStaked.sub(activelyStakingData.stakingAmount);
                    this.activeStaking.delete(dataRequest.id);
                    this.balance = this.balance.add(claimResponse.received);
                }
            });
        }, CLAIM_CHECK_INTERVAL);
    }
}
