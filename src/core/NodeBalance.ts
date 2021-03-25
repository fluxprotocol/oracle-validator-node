import Big from "big.js";
import { CLAIM_CHECK_INTERVAL } from "../config";
import { NodeOptions } from "../models/NodeOptions";
import { DataRequestViewModel } from "../models/DataRequest";
import ProviderRegistry from "../providers/ProviderRegistry";
import { sumBig } from "../utils/bigUtils";
import { SuccessfulJobResult } from "../models/JobExecuteResult";


interface ActiveStaking {
    stakingAmount: Big;
    request: DataRequestViewModel;
    result: SuccessfulJobResult<string>,
}

export default class NodeBalance {
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
}
