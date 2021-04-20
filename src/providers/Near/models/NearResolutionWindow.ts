import { NearUserStakeGraphData } from "./NearUserStake";

export interface NearResolutionWindowGraphData {
    block_height: string;
    bond_size: string;
    date: string;
    dr_id: string;
    end_time: string;
    id: string;
    round: number;
    bonded_outcome: null | string;
    outcome_stakes: {
        data_request_id: string;
        id: string;
        round: number;
        total_stake: string;
        outcome: string;
    }[];
    user_stakes: NearUserStakeGraphData[];
}
