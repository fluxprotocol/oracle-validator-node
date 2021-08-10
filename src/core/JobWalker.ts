/** Luke JobWalker */
import DataRequest, { isRequestClaimable, isRequestDeletable, isRequestExecutable, mergeRequests } from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import { isStakeResultSuccesful } from "@fluxprotocol/oracle-provider-core/dist/StakeResult";

import { JOB_WALKER_INTERVAL } from "../config";
import ProviderRegistry from "../providers/ProviderRegistry";
import { deleteDataRequest, storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";
import { executeJob } from "./JobExecuter";
import { finalizeAndClaim, stakeOnDataRequest } from "./Oracle";

export default class JobWalker {
    providerRegistry: ProviderRegistry;
    requests: Map<string, DataRequest>;
    processingIds: Set<string> = new Set();
    walkerIntervalId?: any;
    currentWalkerPromise?: Promise<void[]>;

    constructor(providerRegistry: ProviderRegistry, initialRequests: DataRequest[] = []) {
        this.requests = new Map();
        initialRequests.forEach((request) => {
            if (isRequestDeletable(request)) {
                return;
            }

            this.requests.set(request.internalId, request);
        });

        this.providerRegistry = providerRegistry;
    }

    async addNewDataRequest(request: DataRequest) {
        try {
            if (isRequestExecutable(request)) {
                request.executeResult = await executeJob(request);

                // It could be that the staking failed due it being finalized already or
                // something else
                // We let the job walker take care of it in the next tick
                const stakeResult = await stakeOnDataRequest(this.providerRegistry, request);

                if (isStakeResultSuccesful(stakeResult)) {
                    request.staking.push(stakeResult);
                }
            } else {
                logger.debug(`${request.internalId} - Currently not executeable, can be executed on ${request.settlementTime}`);
            }

            await storeDataRequest(request);
            this.requests.set(request.internalId, request);
        } catch (error) {
            logger.error(`[JobWalker.addNewDataRequest] ${error}`);
        }
    }

    async walkRequest(input: DataRequest) {
        const newStatus = await this.providerRegistry.getDataRequestById(input.providerId, input.id);
        if (!newStatus) return;

        let request = mergeRequests(input, newStatus);
        logger.debug(`${request.internalId} - Updating status fo: ${JSON.stringify(request.finalizedOutcome)}, rw: ${request.resolutionWindows.length}, fat: ${request.finalArbitratorTriggered}`);

        if (!isRequestExecutable(request)) {
            logger.debug(`${request.internalId} - Cannot be executed till ${request.settlementTime}`);
            await storeDataRequest(request);
            return;
        }

        // Claim the request earnings and remove it from the walker
        if (isRequestClaimable(request)) {
            const isClaimSuccesful = await finalizeAndClaim(this.providerRegistry, request);

            if (isClaimSuccesful) {
                logger.debug(`${request.internalId} - Pruning from pool due completed claim`);
                this.requests.delete(request.internalId);
                await deleteDataRequest(request);
                return;
            }
        }

        // Either we did not stake (or already claimed), but the request got finalized or the final arbitrator got triggered
        // Either way it's safe to remove this from our watch pool and let the user manually claim the earnings
        if (isRequestDeletable(request)) {
            this.requests.delete(request.internalId);
            logger.debug(`${request.internalId} - Pruning from pool fat: ${request.finalArbitratorTriggered}, fo: ${JSON.stringify(request.finalizedOutcome)}, ic: ${isRequestClaimable(request)}`);
            await deleteDataRequest(request);
            return;
        }

        // Something can go wrong with the execute results
        if (!request.executeResult) {
            request.executeResult = await executeJob(request);
        }

        // Continuously try to stake on the outcome.
        // This will prevent any mallicious attacks
        if (request.executeResult) {
            const stakeResult = await stakeOnDataRequest(this.providerRegistry, request);

            if (isStakeResultSuccesful(stakeResult)) {
                request.staking.push(stakeResult);
            }
        }

        await storeDataRequest(request);
    }

    async walkAllRequests() {
        const requests = Array.from(this.requests.values());
        const promises = requests.map(async (request) => {
            // Request is already being processed
            if (this.processingIds.has(request.internalId)) {
                return;
            }

            this.processingIds.add(request.internalId);
            logger.debug(`${request.internalId} - Start walk`);
            await this.walkRequest(request);

            this.processingIds.delete(request.internalId);
        });

        this.currentWalkerPromise = Promise.all(promises);
        await this.currentWalkerPromise;
    }

    async stopWalker() {
        clearInterval(this.walkerIntervalId);

        if (this.processingIds.size) {
            await this.currentWalkerPromise;
        }
    }

    startWalker() {
        if (this.walkerIntervalId) return;
        this.walkerIntervalId = setInterval(() => {
            this.walkAllRequests();
        }, JOB_WALKER_INTERVAL);
    }
}
