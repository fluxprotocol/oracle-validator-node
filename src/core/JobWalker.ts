import Big from "big.js";
import { JOB_WALKER_INTERVAL } from "../config";
import DataRequest from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
import { isStakeResultSuccesful, StakeError } from "../models/StakingResult";
import ProviderRegistry from "../providers/ProviderRegistry";
import { storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";
import NodeBalance from "./NodeBalance";

export default class JobWalker {
    nodeOptions: NodeOptions;
    providerRegistry: ProviderRegistry;
    nodeBalance: NodeBalance;
    requests: Map<string, DataRequest>;
    processingIds: string[] = [];

    constructor(nodeOptions: NodeOptions, providerRegistry: ProviderRegistry, nodeBalance: NodeBalance, initialRequests: DataRequest[] = []) {
        this.requests = new Map();
        initialRequests.forEach((request) => {
            if (request.claimedAmount) {
                return;
            }

            if (request.finalizedOutcome && !request.staking.length) {
                return;
            }

            this.requests.set(request.internalId, request);
        });

        this.nodeOptions = nodeOptions;
        this.providerRegistry = providerRegistry;
        this.nodeBalance = nodeBalance;
    }

    async addNewDataRequest(request: DataRequest) {
        try {
            await request.execute();
            const stakeResult = await request.stake(
                this.nodeOptions,
                this.providerRegistry,
                this.nodeBalance,
            );

            await storeDataRequest(request);

            if (!isStakeResultSuccesful(stakeResult)) {
                if (stakeResult.error === StakeError.AlreadyBonded) {
                    return;
                }
            }

            this.requests.set(request.internalId, request);
        } catch (error) {
            logger.error(`[JobWalker.addNewDataRequest] ${error}`);
        }
    }

    async walkRequest(request: DataRequest) {
        const newStatus = await this.providerRegistry.getDataRequestById(request.providerId, request.id);
        if (!newStatus) return;
        request.update(newStatus);

        // Claim the request earnings and remove it from the walker
        if (request.isClaimable()) {
            const isClaimSuccesful = await request.claim(this.providerRegistry);

            const newStatus = await this.providerRegistry.getDataRequestById(request.providerId, request.id);
            if (newStatus) {
                request.update(newStatus);
            }

            if (isClaimSuccesful) {
                logger.debug(`${request.internalId} - Pruning from pool due completed claim`);
                this.requests.delete(request.internalId);
                this.nodeBalance.deposit(request.providerId, new Big(request.claimedAmount ?? 0));
                await storeDataRequest(request);
                return;
            }
        }

        // Either we did not stake (or already claimed), but the request got finalized or the final arbitrator got triggered
        // Either way it's safe to remove this from our watch pool and let the user manually claim the earnings
        if (request.finalArbitratorTriggered || (request.finalizedOutcome && !request.isClaimable())) {
            this.requests.delete(request.internalId);
            logger.debug(`${request.internalId} - Pruning from pool fat: ${request.finalArbitratorTriggered}, fo: ${JSON.stringify(request.finalizedOutcome)}, ic: ${request.isClaimable()}`);
            await storeDataRequest(request);
            return;
        }

        // Something can go wrong with the execute results
        if (!request.executeResults.length) {
            await request.execute();
        }

        // Continuously try to stake on the outcome.
        // This will prevent any mallicious attacks
        if (request.executeResults.length) {
            await request.stake(
                this.nodeOptions,
                this.providerRegistry,
                this.nodeBalance
            );
        }

        await storeDataRequest(request);
    }

    async walkAllRequests() {
        const requests = Array.from(this.requests.values());
        const promises = requests.map(async (request) => {
            // Request is already being processed
            if (this.processingIds.includes(request.internalId)) {
                return;
            }

            this.processingIds.push(request.internalId);
            logger.debug(`${request.internalId} - Start walk`);
            await this.walkRequest(request);

            // Let the next loop know we are ready to be processed again
            // We can't trust the forEach index, because it could be gone by the time we processed it
            const index = this.processingIds.findIndex(id => id === request.internalId);
            this.processingIds.splice(index, 1);
        });

        await Promise.all(promises);
    }

    startWalker() {
        setInterval(() => {
            this.walkAllRequests();
        }, JOB_WALKER_INTERVAL);
    }
}
