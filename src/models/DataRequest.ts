import { executeJob } from "../core/JobExecuter";
import NodeBalance from "../core/NodeBalance";
import { stakeOnDataRequest } from "../core/Oracle";
import ProviderRegistry from "../providers/ProviderRegistry";
import logger from "../services/LoggerService";
import { ClaimResultType, isClaimResultSuccesful } from "./ClaimResult";
import { Outcome } from './DataRequestOutcome';
import { JobExecuteResult } from "./JobExecuteResult";
import { NodeOptions } from "./NodeOptions";
import { ResolutionWindow } from "./ResolutionWindow";
import { isStakeResultSuccesful, StakeError, StakeResult, StakeResultType, SuccessfulStakeResult } from "./StakingResult";

export const DATA_REQUEST_TYPE = 'DataRequest';

export interface RequestInfo {
    end_point: string;
    source_path: string;
}

export interface ExecuteResults {
    roundId: number;
    results: JobExecuteResult<string>[];
}

export interface DataRequestProps {
    id: string;
    sources: RequestInfo[];
    contractId: string;
    finalArbitratorTriggered: boolean;
    finalizedOutcome?: Outcome;
    outcomes: string[];
    resolutionWindows: ResolutionWindow[];
    providerId: string;
    executeResults: ExecuteResults[];
    staking: SuccessfulStakeResult[];
    claimedAmount?: string;
}

export default class DataRequest {
    id: string;
    internalId: string;
    providerId: string;
    contractId: string;
    outcomes: string[];
    sources: RequestInfo[];
    resolutionWindows: ResolutionWindow[];
    finalArbitratorTriggered: boolean;
    executeResults: ExecuteResults[] = [];
    staking: SuccessfulStakeResult[] = [];
    finalizedOutcome?: Outcome;
    claimedAmount?: string;
    type: string = DATA_REQUEST_TYPE;

    constructor(props: DataRequestProps) {
        this.id = props.id;
        this.internalId = `${props.id}_${props.providerId}_${props.contractId}`;
        this.providerId = props.providerId;
        this.contractId = props.contractId;
        this.outcomes = props.outcomes ?? [];
        this.sources = props.sources;
        this.resolutionWindows = [];
        this.executeResults = props.executeResults ?? [];
        this.staking = props.staking ?? [];
        this.claimedAmount = props.claimedAmount ?? undefined;
        this.finalArbitratorTriggered = props.finalArbitratorTriggered ?? false;
        this.finalizedOutcome = props.finalizedOutcome ?? undefined;

        if (props.resolutionWindows.length) {
            this.resolutionWindows = props.resolutionWindows.map((rw) => ({
                ...rw,
                endTime: new Date(rw.endTime),
            }));
        }
    }

    get currentWindow(): ResolutionWindow | undefined {
        return this.resolutionWindows[this.resolutionWindows.length - 1];
    }

    hasStakenOnRound(roundId: number): boolean {
        return this.staking.some(s => s.roundId === roundId);
    }

    update(request: DataRequest) {
        this.resolutionWindows = request.resolutionWindows;
        this.finalizedOutcome = request.finalizedOutcome;
        this.finalArbitratorTriggered = request.finalArbitratorTriggered;
        logger.debug(`${this.internalId} - Updating status fo: ${JSON.stringify(this.finalizedOutcome)}, rw: ${this.resolutionWindows.length}, fat: ${this.finalArbitratorTriggered}`);
    }

    isClaimable(): boolean {
        // When we have nothing to stake we can not claim
        if (this.staking.length === 0) {
            return false;
        }

        if (this.claimedAmount) {
            return false;
        }

        if (!this.currentWindow) {
            return false;
        }

        const now = new Date();

        if (now.getTime() >= new Date(this.currentWindow.endTime).getTime()) {
            return true;
        }

        return false;
    }

    async execute() {
        logger.debug(`${this.internalId} - Executing`);
        const results = await executeJob(this);
        logger.debug(`${this.internalId} - Executed, results: ${JSON.stringify(results)}`);

        this.executeResults.push({
            roundId: this.currentWindow?.round ?? 0,
            results
        });
    }

    async claim(providerRegistry: ProviderRegistry): Promise<boolean> {
        try {
            if (!this.finalizedOutcome) {
                logger.debug(`${this.internalId} - Finalizing`);
                await providerRegistry.finalize(this.providerId, this.id);
                logger.debug(`${this.internalId} - Finalized`);
            }

            logger.debug(`${this.internalId} - Claiming`);
            const claimResult = await providerRegistry.claim(this.providerId, this.id);
            logger.debug(`${this.internalId} - Claim, results: ${JSON.stringify(claimResult)}`);

            if (!isClaimResultSuccesful(claimResult)) {
                return false;
            }

            this.claimedAmount = claimResult.received;
            return true;
        } catch(error) {
            return false;
        }
    }

    async stake(
        nodeOptions: NodeOptions,
        providerRegistry: ProviderRegistry,
        nodeBalance: NodeBalance,
    ): Promise<StakeResult> {
        if (this.hasStakenOnRound(this.currentWindow?.round ?? 0)) {
            logger.debug(`${this.internalId} - Already staken`);
            return {
                type: StakeResultType.Error,
                error: StakeError.AlreadyStaked,
            };
        }

        if (this.finalizedOutcome) {
            logger.debug(`${this.internalId} - Already finalized, can't stake`);
            return {
                type: StakeResultType.Error,
                error: StakeError.AlreadyBonded,
            };
        }

        logger.debug(`${this.internalId} - Staking`);

        const stakeResult = await stakeOnDataRequest(
            nodeOptions,
            providerRegistry,
            nodeBalance,
            this,
        );

        logger.debug(`${this.internalId} - Stake complete: ${JSON.stringify(stakeResult)}`);

        if (isStakeResultSuccesful(stakeResult)) {
            this.staking.push(stakeResult);
        } else {
            logger.debug(`${this.internalId} - Unsuccesful staking for: ${this.toString()}`);
        }

        return stakeResult;
    }

    toString() {
        return JSON.stringify({
            ...this,
        });
    }
}


export function createMockRequest(request: Partial<DataRequestProps> = {}): DataRequest {
    return new DataRequest({
        contractId: 'san.near',
        id: '1',
        outcomes: [],
        resolutionWindows: [
            {
                endTime: new Date(),
                round: 0,
                bondSize: '2',
            }
        ],
        sources: [],
        providerId: 'near',
        executeResults: [],
        staking: [],
        claimedAmount: undefined,
        finalArbitratorTriggered: false,
        finalizedOutcome: undefined,
        ...request,
    });
}
