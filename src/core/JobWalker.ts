import Big from "big.js";
import { JOB_WALKER_INTERVAL } from "../config";
import DataRequest from "../models/DataRequest";
import { NodeOptions } from "../models/NodeOptions";
import ProviderRegistry from "../providers/ProviderRegistry";
import { deleteDataRequest, storeDataRequest } from "../services/DataRequestService";
import logger from "../services/LoggerService";
import NodeBalance from "./NodeBalance";

export default class JobWalker {
    nodeOptions: NodeOptions;
    providerRegistry: ProviderRegistry;
    nodeBalance: NodeBalance;
    requests: Map<string, DataRequest>;
    processingIds: Set<string> = new Set();
    walkerIntervalId?: any;
    currentWalkerPromise?: Promise<void[]>;

    constructor(nodeOptions: NodeOptions, providerRegistry: ProviderRegistry, nodeBalance: NodeBalance, initialRequests: DataRequest[] = []) {
        this.requests = new Map();
        initialRequests.forEach((request) => {
            if (request.isDeletable()) {
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

            // It could be that the staking failed due it being finalized already or
            // something else
            // We let the job walker take care of it in the next tick
            await request.stake(
                this.providerRegistry,
                this.nodeBalance,
            );

            await storeDataRequest(request);

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
                await deleteDataRequest(request);
                return;
            }
        }

        // Either we did not stake (or already claimed), but the request got finalized or the final arbitrator got triggered
        // Either way it's safe to remove this from our watch pool and let the user manually claim the earnings
        if (request.isDeletable()) {
            this.requests.delete(request.internalId);
            logger.debug(`${request.internalId} - Pruning from pool fat: ${request.finalArbitratorTriggered}, fo: ${JSON.stringify(request.finalizedOutcome)}, ic: ${request.isClaimable()}`);
            await deleteDataRequest(request);
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
