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
    outcomes?: string[];
    rounds: DataRequestRound[];
}
