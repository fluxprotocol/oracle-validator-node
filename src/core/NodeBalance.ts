import Big from "big.js";
import DataRequest from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
import ProviderRegistry from "../providers/ProviderRegistry";
import logger from "../services/LoggerService";
import { getBalanceStatus, storeBalanceStatus } from "../services/NodeBalanceService";
import { sumBig } from "../utils/bigUtils";
import { BalanceStatusViewModel, transformToBalanceStatusViewModel } from '../models/BalanceStatus';

export default class NodeBalance {
    nodeOptions: NodeOptions;
    startingBalance: Big = new Big(0);
    balances: Map<string, Big> = new Map();
    providerRegistry: ProviderRegistry;


    /** Keeps track of profit/total staked */
    balanceStatus: BalanceStatusViewModel;

    /** Used for not spamming the RPC with balance requests */
    balanceFetch?: Promise<Big[]>;

    constructor(nodeOptions: NodeOptions, providerRegistry: ProviderRegistry) {
        this.nodeOptions = nodeOptions;
        this.providerRegistry = providerRegistry;
        this.balanceStatus = transformToBalanceStatusViewModel({
            balance: '0',
            claimed: '0',
            staked: '0',
        });
    }

    async init() {
        this.balanceStatus = await getBalanceStatus();
    }

    /**
     * Adds a request that is claimed to the profit
     *
     * @param {DataRequest} request
     * @memberof NodeBalance
     */
    addClaimedRequest(request: DataRequest) {
        if (!request.claimedAmount) {
            logger.error(`${request.internalId} - Missing claimed amount`);
            return;
        }

        const amountStaked = request.staking.reduce((prev, curr) => prev.add(curr.amountStaked), new Big(0));

        this.deposit(request.providerId, new Big(request.claimedAmount));
        this.balanceStatus = transformToBalanceStatusViewModel({
            balance: sumBig(Array.from(this.balances.values())).toString(),
            claimed: this.balanceStatus.claimed.add(request.claimedAmount).toString(),
            staked: this.balanceStatus.staked.add(amountStaked).toString(),
        });
    }

    /**
     * Refreshes the FLX balances of the node
     *
     * @param {boolean} [isStartingBalance=false]
     * @return {Promise<void>}
     * @memberof AvailableStake
     */
    async refreshBalances(isStartingBalance: boolean = false): Promise<void> {
        try {
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

            if (isStartingBalance) {
                this.startingBalance = sumBig(balances);
            }

            // Store the balance data to the database
            await storeBalanceStatus(this.balanceStatus);

            this.balanceFetch = undefined;
        } catch (error) {
            logger.error(`[NodeBalance.refreshBalances] ${error}`);
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
     * Deposit FLX back to the balances
     * Only used when staking/challenging gives back tokens
     *
     * @param {Big} amount
     * @memberof NodeBalance
     */
    deposit(providerId: string, amount: Big): void {
        const balance = this.balances.get(providerId);

        if (!balance) {
            return;
        }

        this.balances.set(providerId, balance.add(amount));
    }
}
