/** Luke JobWalker */
import DataRequest, { isRequestClaimable, isRequestDeletable, isRequestExecutable, isRequestFinalizable, mergeRequests } from "@fluxprotocol/oracle-provider-core/dist/DataRequest";
import { isStakeResultSuccesful } from "@fluxprotocol/oracle-provider-core/dist/StakeResult";
import { IJobWalker } from "@fluxprotocol/oracle-provider-core/dist/Core";
import * as Sentry from "@sentry/node";


import { JOB_WALKER_INTERVAL } from "../config";
import ProviderRegistry from "../providers/ProviderRegistry";
import { deleteDataRequest, storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";
import { executeJob } from "./JobExecuter";
import { claimRequestEarnings, finalizeRequest, stakeOnDataRequest } from "./Oracle";
import AnalyticsService from "../services/AnalyticsService";

export default class JobWalker implements IJobWalker {
    providerRegistry: ProviderRegistry;
    requests: Map<string, DataRequest>;

    /** Used for keeping track which requests are on going */
    processingIds: Map<string, Promise<void>> = new Map();
    walkerIntervalId?: any;

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

    async addNewDataRequest(input: DataRequest) {
        let request = input;
        const txName = `request_${input.id}`;

        try {
            AnalyticsService.startTransaction(txName);
            if (isRequestExecutable(request)) {
                let child = AnalyticsService.startChild(txName, { op: 'task', description: 'executing' });
                request.executeResult = await executeJob(request);
                child.finish();

                if (request.allowedValidators.length) {
                    await finalizeRequest(this.providerRegistry, request);
                } else {
                    // It could be that the staking failed due it being finalized already or
                    // something else
                    // We let the job walker take care of it in the next tick
                    const stakeResult = await stakeOnDataRequest(this.providerRegistry, request);

                    if (isStakeResultSuccesful(stakeResult)) {
                        request.staking.push(stakeResult);
                    }
                }
            } else {
                logger.debug(`${request.internalId} - Currently not executeable`);
            }

            await storeDataRequest(request);
            this.requests.set(request.internalId, request);
            this.processingIds.delete(request.internalId);
            AnalyticsService.finishTransaction(txName);
        } catch (error) {
            logger.error(`[JobWalker.addNewDataRequest] ${error}`);
            await storeDataRequest(request);
            this.requests.set(request.internalId, request);
            this.processingIds.delete(request.internalId);
            AnalyticsService.finishTransaction(txName);
        }
    }

    async walkRequest(input: DataRequest) {
        let request = input;
        const txName = `request_${input.id}`;

        try {
            AnalyticsService.startTransaction(txName)
            const validatorId = this.providerRegistry.getAccountIdByProvider(input.providerId);
            let child = AnalyticsService.startChild(txName, { op: 'task', description: 'update_request' });
            const newStatus = await this.providerRegistry.getDataRequestById(input.providerId, input.id);
            child.finish();

            if (!newStatus) {
                AnalyticsService.finishTransaction(txName);
                return;
            };

            request = mergeRequests(request, newStatus);
            logger.debug(`${request.internalId} - Updating status finalized: ${JSON.stringify(request.finalizedOutcome)}, windows: ${request.resolutionWindows.length}, final arb triggered: ${request.finalArbitratorTriggered}`);

            if (!isRequestExecutable(request)) {
                logger.debug(`${request.internalId} - Cannot be executed`);
                this.requests.set(request.internalId, request);
                await storeDataRequest(request);
                AnalyticsService.finishTransaction(txName);
                return;
            }

            if (isRequestFinalizable(request, validatorId)) {
                let child = AnalyticsService.startChild(txName, { op: 'task', description: 'finalize_request' });
                await finalizeRequest(this.providerRegistry, request);
                child.finish();

                // Update our status for the next checks
                const finalizedRequest = await this.providerRegistry.getDataRequestById(input.providerId, input.id);

                if (!finalizedRequest) {
                    AnalyticsService.finishTransaction(txName);
                    return;
                }

                request = mergeRequests(request, finalizedRequest);
            }

            // Claim the request earnings and remove it from the walker
            if (isRequestClaimable(request)) {
                let child = AnalyticsService.startChild(txName, { op: 'task', description: 'claim_request' });
                await claimRequestEarnings(this.providerRegistry, request);
                logger.debug(`${request.internalId} - Pruning from pool due claim`);
                this.requests.delete(request.internalId);
                await deleteDataRequest(request);
                child.finish();
                AnalyticsService.finishTransaction(txName);
                return;
            }

            // Either we did not stake (or already claimed), but the request got finalized or the final arbitrator got triggered
            // Either way it's safe to remove this from our watch pool and let the user manually claim the earnings
            if (isRequestDeletable(request)) {
                let child = AnalyticsService.startChild(txName, { op: 'task', description: 'delete_request' });
                this.requests.delete(request.internalId);
                logger.debug(`${request.internalId} - Pruning from pool fat: ${request.finalArbitratorTriggered}, fo: ${JSON.stringify(request.finalizedOutcome)}, ic: ${isRequestClaimable(request)}`);
                await deleteDataRequest(request);
                child.finish();
                AnalyticsService.finishTransaction(txName);
                return;
            }

            // Something can go wrong with the execute results
            if (!request.executeResult) {
                request.executeResult = await executeJob(request);
                await storeDataRequest(request);
            }

            // Continuously try to stake on the outcome.
            // This will prevent any mallicious attacks
            if (request.executeResult) {
                let child = AnalyticsService.startChild(txName, { op: 'task', description: 'delete_request' });
                const stakeResult = await stakeOnDataRequest(this.providerRegistry, request);

                if (isStakeResultSuccesful(stakeResult)) {
                    request.staking.push(stakeResult);
                }

                child.finish();
            }

            this.requests.set(request.internalId, request);
            await storeDataRequest(request);
            AnalyticsService.finishTransaction(txName);
        } catch (error) {
            this.requests.set(request.internalId, request);
            await storeDataRequest(request);
            logger.error(`[JobWalker.walkRequest] ${input.internalId} - ${error}`);
            AnalyticsService.finishTransaction(txName);
        }
    }

    async walkAllRequests() {
        logger.debug(`Walking ${this.requests.size} requests`);
        const requests = Array.from(this.requests.values());

        requests.forEach(async (request) => {
            // Request is already being processed
            if (this.processingIds.has(request.internalId)) {
                return;
            }

            logger.debug(`${request.internalId} - Start walk`);

            let processingRequest = this.walkRequest(request);
            this.processingIds.set(request.internalId, processingRequest);
            await processingRequest;
            this.processingIds.delete(request.internalId);

            logger.debug(`${request.internalId} - Done walking`);
        });
    }

    async stopWalker() {
        logger.debug('Stop walker triggered');
        clearInterval(this.walkerIntervalId);

        if (this.processingIds.size) {
            const processes = Array.from(this.processingIds.values());
            await Promise.all(processes);
        }
    }

    startWalker() {
        if (this.walkerIntervalId) return;
        this.walkerIntervalId = setInterval(() => {
            this.walkAllRequests();
        }, JOB_WALKER_INTERVAL);
    }
}
