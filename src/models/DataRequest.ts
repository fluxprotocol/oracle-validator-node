import Big from "big.js";
import { executeJob } from "../core/JobExecuter";
import ProviderRegistry from "../providers/ProviderRegistry";
import { JobExecuteResult } from "./JobExecuteResult";

export const DATA_REQUEST_TYPE = 'DataRequest';

export interface DataRequestRound {
    round: number;
    outcomeStakes: Map<string, Big>;
    quoromDate: Date;
    winningOutcome?: string;
}

export interface DataRequestViewModel {
    id: string;
    internalId: string;
    providerId: string;
    source: string;
    fees: Big;
    sourcePath: string;
    contractId: string;
    outcomes?: string[];
    rounds: DataRequestRound[];
    type: 'DataRequest';
}

export function createMockRequest(request: Partial<DataRequestViewModel> = {}): DataRequestViewModel {
    return {
        contractId: 'san.near',
        fees: new Big(1),
        id: '1',
        internalId: '1_near_san.near',
        outcomes: [],
        rounds: [],
        source: '',
        sourcePath: '',
        providerId: 'near',
        type: 'DataRequest',
        ...request,
    };
}

export interface Round {
    round: number;
    outcomeStakes: {
        [key: string]: Big;
    };
    quoromDate: Date;
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

interface DataRequestProps {
    id: string;
    sources: RequestInfo[];
    internalId: string;
    contractId: string;
    outcomes: string[];
    rounds: Round[];
    providerId: string;
}

export default class DataRequest {
    id: string;
    internalId: string;
    providerId: string;
    contractId: string;
    outcomes: string[];
    sources: RequestInfo[];
    rounds: Round[];
    currentRound: Round;
    executeResults: ExecuteResults[] = [];
    type: string = DATA_REQUEST_TYPE;

    constructor(props: DataRequestProps) {
        this.id = props.id;
        this.sources = props.sources;
        this.internalId = props.internalId;
        this.contractId = props.contractId;
        this.providerId = props.providerId;
        this.outcomes = props.outcomes;
        this.rounds = props.rounds ?? [];
        this.currentRound = this.rounds[this.rounds.length - 1];
    }

    async execute() {
        const results = await executeJob(this);

        this.executeResults.push({
            roundId: this.currentRound.round,
            results
        });
    }

    async claim() {

    }

    async stake() {

    }

    async challenge() {

    }

    async stakeOrChallenge(): Promise<void> {
        if (this.currentRound.round === 0) {
            return this.stake();
        }

        return this.challenge();
    }

    toString() {
        return JSON.stringify({
            ...this,
        });
    }

    static fromString(str: string) {
        return new DataRequest(JSON.parse(str));
    }
}
