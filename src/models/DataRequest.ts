import Big from "big.js";
import { executeJob } from "../core/JobExecuter";
import NodeBalance from "../core/NodeBalance";
import { stakeOrChallengeDataRequest } from "../core/Oracle";
import ProviderRegistry from "../providers/ProviderRegistry";
import { storeDataRequest } from "../services/DataRequestService";
import { JobExecuteResult } from "./JobExecuteResult";
import { NodeOptions } from "./NodeOptions";
import { isStakeResultSuccesful, SuccessfulStakeResult } from "./StakingResult";

export const DATA_REQUEST_TYPE = 'DataRequest';

export interface Round {
    round: number;
    outcomeStakes: {
        [key: string]: string;
    };
    quoromDate: string;
    winningOutcome?: string;
}

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
    outcomes: string[];
    rounds: Round[];
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
    rounds: Round[];
    executeResults: ExecuteResults[] = [];
    staking: SuccessfulStakeResult[] = [];
    claimedAmount?: string;
    type: string = DATA_REQUEST_TYPE;

    constructor(props: DataRequestProps) {
        this.id = props.id;
        this.internalId = `${props.id}_${props.providerId}_${props.contractId}`;
        this.providerId = props.providerId;
        this.contractId = props.contractId;
        this.outcomes = props.outcomes ?? [];
        this.sources = props.sources;
        this.rounds = props.rounds ?? [];
        this.executeResults = props.executeResults ?? [];
        this.staking = props.staking ?? [];
        this.claimedAmount = props.claimedAmount ?? undefined;
    }

    get currentRound(): Round {
        return this.rounds[this.rounds.length - 1];
    }

    hasStakenOnRound(roundId: number): boolean {
        return this.staking.some(s => s.roundId === roundId);
    }

    update(request: DataRequest) {
        this.rounds = request.rounds;
    }

    isClaimable(): boolean {
        if (this.claimedAmount) {
            return false;
        }

        const now = new Date();

        if (now.getTime() >= new Date(this.currentRound.quoromDate).getTime()) {
            return true;
        }

        return false;
    }

    async execute() {
        const results = await executeJob(this);

        this.executeResults.push({
            roundId: this.currentRound.round,
            results
        });
    }

    async claim(providerRegistry: ProviderRegistry): Promise<boolean> {
        const claimResult = await providerRegistry.claim(this.providerId, this.id);

        if (!claimResult.success) {
            return false;
        }

        this.claimedAmount = claimResult.received;
        return true;
    }

    async stakeOrChallenge(
        nodeOptions: NodeOptions,
        providerRegistry: ProviderRegistry,
        nodeBalance: NodeBalance,
    ): Promise<void> {
        // TODO: determine if we want to restake when our outcome is being challenged
        if (this.hasStakenOnRound(this.currentRound.round)) {
            return;
        }

        const stakeResult = await stakeOrChallengeDataRequest(
            nodeOptions,
            providerRegistry,
            nodeBalance,
            this,
        );

        // Something went wrong on the provider side
        // We let the next jobwalker tick retry it.
        if (!isStakeResultSuccesful(stakeResult)) {
            return;
        }

        this.staking.push(stakeResult);
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
        rounds: [
            {
                outcomeStakes: {},
                quoromDate: new Date().toJSON(),
                round: 0,
            }
        ],
        sources: [],
        providerId: 'near',
        executeResults: [],
        staking: [],
        claimedAmount: undefined,
        ...request,
    });
}
