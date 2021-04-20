export interface NearUserStakeGraphData {
    account_id: string;
    data_request_id: string;
    id: string;
    outcome: string;
    round: number;
    total_stake: string;
    data_request?: {
        finalized_outcome: string | null;
    }
    claim?: {
        payout: string;
    }
}
