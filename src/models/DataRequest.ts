import Big from "big.js";

export interface DataRequestRound {
    round: number;
    outcomeStakes: Map<string, Big>;
    quoromDate: Date;
    winningOutcome?: string;
}

export interface DataRequestViewModel {
    id: string;
    source: string;
    fees: Big;
    sourcePath: string;
    contractId: string;
    outcomes?: string[];
    rounds: DataRequestRound[];
}

export function createMockRequest(request: Partial<DataRequestViewModel> = {}): DataRequestViewModel {
    return {
        contractId: 'san.near',
        fees: new Big(1),
        id: '1',
        outcomes: [],
        rounds: [],
        source: '',
        sourcePath: '',
        ...request,
    };
}
